#!/usr/bin/env python3
"""
Clear all vectors from Pinecone index
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from pinecone import Pinecone

# Load environment
script_dir = Path(__file__).resolve().parent
backend_dir = script_dir.parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path, override=True)

PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
INDEX_NAME = "hikma-fatwas"

print("=" * 70)
print("🗑️  CLEAR PINECONE INDEX")
print("=" * 70)
print()

if not PINECONE_API_KEY:
    print("❌ Error: PINECONE_API_KEY not found")
    exit(1)

# Connect to Pinecone
print("📡 Connecting to Pinecone...")
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

# Get current stats
stats = index.describe_index_stats()
current_count = stats.get('total_vector_count', 0)

print(f"📊 Current vectors in index '{INDEX_NAME}': {current_count:,}")
print()

if current_count == 0:
    print("✅ Index is already empty!")
    exit(0)

# Confirm deletion
print("⚠️  WARNING: This will DELETE ALL vectors from the index!")
print("   This action cannot be undone.")
print()
confirm = input("   Type 'DELETE' to confirm: ").strip()

if confirm != 'DELETE':
    print("❌ Deletion cancelled")
    exit(0)

# Delete all vectors
print()
print("🗑️  Deleting all vectors...")
try:
    index.delete(delete_all=True)
    print("✅ All vectors deleted!")
    
    # Verify
    import time
    time.sleep(2)  # Wait for deletion to propagate
    stats = index.describe_index_stats()
    remaining = stats.get('total_vector_count', 0)
    
    print()
    print("=" * 70)
    print(f"✅ DELETION COMPLETE")
    print(f"   Remaining vectors: {remaining:,}")
    print("=" * 70)
    
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
