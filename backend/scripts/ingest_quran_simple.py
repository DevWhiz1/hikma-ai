#!/usr/bin/env python3
"""
Simple & Fast Quran Ingestion - Sequential fetch, batch upload
"""

import requests
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from pinecone import Pinecone
import google.generativeai as genai
from tqdm import tqdm

# Load environment
script_dir = Path(__file__).resolve().parent
backend_dir = script_dir.parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path, override=True)

PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

print("=" * 70)
print("🕌 QURAN INGESTION (Simple & Reliable)")
print("=" * 70)
print()

# Initialize
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index("hikma-fatwas")
genai.configure(api_key=GEMINI_API_KEY)

print("✅ Connected to Pinecone")
print("✅ Gemini configured")
print()

total_uploaded = 0
failed = 0

def generate_embedding(text):
    """Generate embedding for text"""
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text
        )
        return result['embedding']
    except Exception as e:
        print(f"   ⚠️ Embedding error: {e}")
        return None

def fetch_and_upload_surah(surah_num):
    """Fetch and upload one surah"""
    global total_uploaded, failed
    
    try:
        # Fetch Arabic
        url_ar = f"http://api.alquran.cloud/v1/surah/{surah_num}/quran-uthmani"
        response_ar = requests.get(url_ar, timeout=15)
        
        # Fetch English
        url_en = f"http://api.alquran.cloud/v1/surah/{surah_num}/en.sahih"
        response_en = requests.get(url_en, timeout=15)
        
        if response_ar.status_code != 200 or response_en.status_code != 200:
            print(f"   ❌ API error for surah {surah_num}")
            return 0
        
        data_ar = response_ar.json()
        data_en = response_en.json()
        
        if data_ar.get('code') != 200 or data_en.get('code') != 200:
            print(f"   ❌ Invalid response for surah {surah_num}")
            return 0
        
        ayahs_ar = data_ar['data']['ayahs']
        ayahs_en = data_en['data']['ayahs']
        
        # Get surah metadata from parent
        surah_info_ar = data_ar['data']
        surah_info_en = data_en['data']
        
        surah_name = surah_info_en.get('englishName', f'Surah {surah_num}')
        surah_arabic = surah_info_ar.get('name', '')
        revelation = surah_info_en.get('revelationType', 'makkah')
        
        if len(ayahs_ar) != len(ayahs_en):
            print(f"   ❌ Mismatch for surah {surah_num}")
            return 0
        
        uploaded = 0
        
        # Process in batches of 20
        batch_size = 20
        for i in range(0, len(ayahs_ar), batch_size):
            batch_ar = ayahs_ar[i:i+batch_size]
            batch_en = ayahs_en[i:i+batch_size]
            
            vectors = []
            
            for j in range(len(batch_ar)):
                ar = batch_ar[j]
                en = batch_en[j]
                
                text_arabic = ar['text']
                text_english = en['text']
                ayah_number = ar['numberInSurah']
                
                if not text_arabic or not text_english:
                    failed += 1
                    continue
                
                # Generate embedding
                combined_text = f"{text_arabic}\n{text_english}"
                embedding = generate_embedding(combined_text)
                
                if not embedding:
                    failed += 1
                    continue
                
                # Prepare vector
                vector_id = f"quran_{surah_num}_{ayah_number}"
                
                metadata = {
                    'type': 'quran',
                    'surah_number': surah_num,
                    'surah_name': surah_name,
                    'surah_arabic': surah_arabic,
                    'ayah_number': ayah_number,
                    'ayah_key': f"{surah_num}:{ayah_number}",
                    'revelation_place': revelation,
                    'text_arabic': text_arabic[:1000],
                    'text_english': text_english[:1000],
                    'source': 'AlQuran Cloud API',
                    'text': combined_text[:2000]
                }
                
                vectors.append({
                    'id': vector_id,
                    'values': embedding,
                    'metadata': metadata
                })
                
                time.sleep(0.1)  # Rate limit
            
            # Upload batch
            if vectors:
                try:
                    index.upsert(vectors=vectors)
                    uploaded += len(vectors)
                    total_uploaded += len(vectors)
                except Exception as e:
                    print(f"   ⚠️ Upload error: {e}")
                    failed += len(vectors)
        
        return uploaded
        
    except Exception as e:
        print(f"   ❌ Error processing surah {surah_num}: {e}")
        return 0

# Main execution
print("📖 Processing all 114 surahs...")
print()

with tqdm(total=114, desc="Surahs", unit="surah") as pbar:
    for surah_num in range(1, 115):
        uploaded = fetch_and_upload_surah(surah_num)
        pbar.set_postfix({
            'uploaded': total_uploaded,
            'failed': failed
        })
        pbar.update(1)
        time.sleep(0.5)  # Rate limit between surahs

# Summary
print()
print("=" * 70)
print("✅ QURAN INGESTION COMPLETE!")
print("=" * 70)
print(f"✅ Uploaded: {total_uploaded:,} verses")
print(f"❌ Failed: {failed:,}")
print("=" * 70)

# Verify
stats = index.describe_index_stats()
print(f"\n📊 Total in Pinecone: {stats.get('total_vector_count', 0):,}")

# Sample check
print("\n🔍 Verifying sample (Al-Fatihah 1:1)...")
try:
    result = index.fetch(ids=['quran_1_1'])
    if 'quran_1_1' in result.vectors:
        meta = result.vectors['quran_1_1'].metadata
        has_ar = bool(meta.get('text_arabic'))
        has_en = bool(meta.get('text_english'))
        print(f"   ✅ Arabic: {meta.get('text_arabic', '')[:60] if has_ar else 'MISSING'}")
        print(f"   ✅ English: {meta.get('text_english', '')[:60] if has_en else 'MISSING'}")
        print(f"   ✅ Status: {'COMPLETE ✅' if has_ar and has_en else 'INCOMPLETE ❌'}")
except Exception as e:
    print(f"   ⚠️ Error: {e}")

print("\n" + "=" * 70)
