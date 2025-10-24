#!/usr/bin/env python3
"""
Fast Hadith Ingestion to Pinecone
Optimized for parallel processing and batch operations
"""

import requests
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from pinecone import Pinecone
import google.generativeai as genai
from tqdm import tqdm
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Load environment
script_dir = Path(__file__).resolve().parent
backend_dir = script_dir.parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path, override=True)

HADITH_API_KEY = os.getenv('HADITH_API_KEY')
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
BASE_URL = "https://hadithapi.com/api"

# Books to ingest
BOOKS = {
    "sahih-bukhari": "Sahih Bukhari",
    "sahih-muslim": "Sahih Muslim",
    "abu-dawood": "Sunan Abu Dawood",
    "al-tirmidhi": "Jami' at-Tirmidhi",
    "sunan-nasai": "Sunan an-Nasa'i",
    "ibn-e-majah": "Sunan Ibn Majah"
}

# Performance settings
MAX_WORKERS = 10  # Parallel API requests
BATCH_SIZE = 100  # Embeddings per batch
PINECONE_BATCH = 100  # Vectors per Pinecone upload

print("=" * 70)
print("🚀 FAST HADITH INGESTION TO PINECONE")
print("=" * 70)
print()

# Validate API keys
if not all([HADITH_API_KEY, PINECONE_API_KEY, GEMINI_API_KEY]):
    print("❌ Error: Missing API keys!")
    print(f"   HADITH_API_KEY: {'✓' if HADITH_API_KEY else '✗'}")
    print(f"   PINECONE_API_KEY: {'✓' if PINECONE_API_KEY else '✗'}")
    print(f"   GEMINI_API_KEY: {'✓' if GEMINI_API_KEY else '✗'}")
    exit(1)

# Initialize Pinecone
print("📡 Connecting to Pinecone...")
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index("hikma-fatwas")
print("✅ Connected to index: hikma-fatwas")

# Initialize Gemini
print("🤖 Initializing Gemini API...")
genai.configure(api_key=GEMINI_API_KEY)
print("✅ Gemini ready")
print()

# Thread-safe counters
lock = threading.Lock()
stats = {
    'fetched': 0,
    'uploaded': 0,
    'failed': 0,
    'skipped': 0
}

def generate_embeddings_batch(texts):
    """Generate embeddings for multiple texts at once"""
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=texts,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"⚠️  Batch embedding error: {str(e)}")
        return None

def fetch_chapter_hadiths(book_slug, book_name, chapter):
    """Fetch hadiths from a single chapter using the correct API format"""
    chapter_key = chapter.get('chapterKey') or chapter.get('key') or chapter.get('chapterNumber')
    chapter_name = chapter.get('chapterEnglish') or chapter.get('chapterName', 'Unknown')
    
    if not chapter_key:
        return []
    
    try:
        # Use the correct hadithapi.com endpoint format
        url = f"{BASE_URL}/hadiths"
        params = {
            "apiKey": HADITH_API_KEY,
            "book": book_slug,
            "chapter": str(chapter_key),
            "paginate": 500  # Get max hadiths per chapter
        }
        
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code != 200:
            return []
        
        data = response.json()
        hadiths = data.get('hadiths', {}).get('data', [])
        
        results = []
        for hadith in hadiths:
            english = hadith.get('hadithEnglish', '').strip()
            arabic = hadith.get('hadithArabic', '').strip()
            
            if not english:
                continue
            
            results.append({
                'book_slug': book_slug,
                'book_name': book_name,
                'chapter_key': str(chapter_key),
                'chapter_name': chapter_name,
                'hadith_number': str(hadith.get('hadithNumber', '')),
                'english_text': english,
                'arabic_text': arabic,
                'narrator': hadith.get('hadithNarrator', ''),
                'grade': hadith.get('grade', 'Unknown'),
            })
        
        with lock:
            stats['fetched'] += len(results)
        
        return results
        
    except Exception as e:
        return []

def fetch_all_hadiths_from_book(book_slug, book_name):
    """Fetch all hadiths from a book using parallel requests"""
    print(f"\n📖 Processing: {book_name}")
    print("-" * 70)
    
    try:
        # Get chapters
        url = f"{BASE_URL}/{book_slug}/chapters"
        params = {"apiKey": HADITH_API_KEY}
        
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code != 200:
            print(f"   ❌ Failed to fetch chapters")
            return []
        
        data = response.json()
        chapters = data.get('chapters', [])
        
        print(f"   📚 Found {len(chapters)} chapters")
        print(f"   🚀 Fetching with {MAX_WORKERS} parallel workers...")
        
        all_hadiths = []
        
        # Parallel fetch chapters
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {
                executor.submit(fetch_chapter_hadiths, book_slug, book_name, chapter): chapter
                for chapter in chapters
            }
            
            with tqdm(total=len(chapters), desc=f"   Chapters", unit="ch") as pbar:
                for future in as_completed(futures):
                    hadiths = future.result()
                    all_hadiths.extend(hadiths)
                    pbar.update(1)
        
        print(f"   ✅ Fetched {len(all_hadiths)} hadiths")
        return all_hadiths
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return []

def upload_hadiths_batch(hadiths_batch):
    """Upload a batch of hadiths with embeddings"""
    try:
        # Prepare texts for batch embedding
        texts = []
        for hadith in hadiths_batch:
            english = hadith['english_text']
            arabic = hadith['arabic_text']
            combined = f"{english}\n{arabic}" if arabic else english
            texts.append(combined)
        
        # Generate embeddings in batch
        embeddings = generate_embeddings_batch(texts)
        
        if embeddings is None:
            with lock:
                stats['failed'] += len(hadiths_batch)
            return
        
        # Prepare vectors for Pinecone
        vectors = []
        for i, hadith in enumerate(hadiths_batch):
            try:
                vector_id = f"hadith_{hadith['book_slug']}_{hadith['hadith_number']}_{hadith['chapter_key']}"
                
                metadata = {
                    'type': 'hadith',
                    'book_name': hadith['book_name'],
                    'book_slug': hadith['book_slug'],
                    'chapter': hadith['chapter_name'][:200],
                    'hadith_number': hadith['hadith_number'],
                    'english_text': hadith['english_text'][:1000],
                    'arabic_text': hadith['arabic_text'][:1000],
                    'narrator': hadith['narrator'][:200],
                    'grade': hadith['grade'],
                    'source': 'Hadith API'
                }
                
                vectors.append({
                    'id': vector_id,
                    'values': embeddings[i],
                    'metadata': metadata
                })
                
            except Exception as e:
                with lock:
                    stats['failed'] += 1
                continue
        
        # Upload to Pinecone
        if vectors:
            index.upsert(vectors=vectors)
            with lock:
                stats['uploaded'] += len(vectors)
        
    except Exception as e:
        print(f"   ⚠️  Batch upload error: {str(e)}")
        with lock:
            stats['failed'] += len(hadiths_batch)

def process_book_fast(book_slug, book_name):
    """Fetch and upload hadiths from a book with batch processing"""
    hadiths = fetch_all_hadiths_from_book(book_slug, book_name)
    
    if not hadiths:
        return
    
    print(f"   📤 Uploading {len(hadiths)} hadiths in batches of {BATCH_SIZE}...")
    
    # Process in batches
    with tqdm(total=len(hadiths), desc=f"   Uploading", unit="hadith") as pbar:
        for i in range(0, len(hadiths), BATCH_SIZE):
            batch = hadiths[i:i+BATCH_SIZE]
            upload_hadiths_batch(batch)
            pbar.update(len(batch))
            time.sleep(0.5)  # Rate limiting
    
    print(f"   ✅ Completed {book_name}")

# Main execution
print("🎯 Starting fast hadith ingestion...")
print("=" * 70)

start_time = time.time()

# Process each book sequentially (but with parallel chapter fetching)
for book_slug, book_name in BOOKS.items():
    process_book_fast(book_slug, book_name)
    print()

elapsed = time.time() - start_time

# Final summary
print("=" * 70)
print("✅ HADITH INGESTION COMPLETE!")
print("=" * 70)
print(f"⏱️  Total time: {elapsed/60:.1f} minutes")
print(f"📊 Hadiths fetched: {stats['fetched']:,}")
print(f"✅ Successfully uploaded: {stats['uploaded']:,}")
print(f"❌ Failed: {stats['failed']:,}")
print(f"⏭️  Skipped: {stats['skipped']:,}")
if stats['fetched'] > 0:
    print(f"📈 Success rate: {(stats['uploaded']/stats['fetched']*100):.1f}%")
print("=" * 70)

# Verify in Pinecone
print("\n🔍 Verifying in Pinecone...")
try:
    index_stats = index.describe_index_stats()
    total = index_stats.get('total_vector_count', 0)
    print(f"✅ Total vectors in Pinecone: {total:,}")
    print(f"   📖 Hadiths uploaded this session: {stats['uploaded']:,}")
    print("=" * 70)
except Exception as e:
    print(f"⚠️  Could not verify: {str(e)}")
