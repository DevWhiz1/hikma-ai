# 🚀 ChromaDB to Pinecone Migration Guide

## Why Migrate to Pinecone?

- ✅ **Vercel Compatible** - Works with serverless functions
- ✅ **Cloud-Hosted** - No local storage needed (2.5 GB → 0 GB)
- ✅ **Free Tier** - 100K vectors for free (perfect for 131K fatwas)
- ✅ **Fast** - Sub-100ms queries
- ✅ **Production Ready** - Used by OpenAI, Notion, and others

---

## 📋 Prerequisites

- ✅ Your ChromaDB data (131K fatwas) in `backend/chroma-data/`
- ✅ Pinecone account (sign up at https://www.pinecone.io)
- ✅ Python 3.8+ installed
- ✅ Node.js 18+ installed

---

## 🎯 Migration Steps

### Step 1: Setup Pinecone Account (5 minutes)

1. Go to https://www.pinecone.io and sign up (FREE)
2. Create a new project
3. Create a **Serverless Index**:
   - Click "Create Index"
   - Name: `hikma-fatwas`
   - Dimensions: `768`
   - Metric: `cosine`
   - Cloud: `aws`
   - Region: `us-east-1`
4. Get your API key:
   - Go to "API Keys" in dashboard
   - Copy your API key

### Step 2: Install Python Dependencies

```bash
cd backend/scripts
pip install -r requirements-pinecone.txt
```

Or manually:
```bash
pip install pinecone-client chromadb python-dotenv tqdm
```

### Step 3: Configure Environment Variables

Add to your `backend/.env` file:

```bash
# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key-here

# Existing (keep these)
GEMINI_API_KEY=your-gemini-key
MONGODB_URI=your-mongodb-uri
```

### Step 4: Run Migration Script

```bash
cd backend
python scripts/migrate_to_pinecone.py
```

**What it does:**
- Reads all 131K fatwas from ChromaDB
- Uploads embeddings + metadata to Pinecone
- Shows progress bar
- Takes ~15-20 minutes
- Verifies upload with test query

**Expected output:**
```
🕌 HIKMA AI - ChromaDB to Pinecone Migration
===================================================================
📊 MIGRATION SUMMARY:
   Source (ChromaDB): 131,057 fatwas
   Target (Pinecone): 0 existing vectors
   Batch size: 100 vectors
   Estimated time: 26.2 minutes
===================================================================

⚠️  Proceed with migration? (yes/no): yes

🚀 Starting migration to Pinecone...
Migrating batches: 100%|████████████████| 1311/1311 [15:23<00:00]

===================================================================
✅ MIGRATION COMPLETE!
===================================================================
📊 Statistics:
   Total fatwas: 131,057
   Successful: 131,057
   Failed: 0
   Success rate: 100.0%

✅ Pinecone now contains: 131,057 vectors
```

### Step 5: Install Node.js Pinecone Package

```bash
cd backend
npm install @pinecone-database/pinecone
```

### Step 6: Update Your Code (Already Done!)

The following files have been created/updated:

✅ `backend/utils/ragSystemPinecone.js` - New Pinecone RAG client
✅ `backend/package.json` - Added Pinecone dependency
✅ `backend/scripts/migrate_to_pinecone.py` - Migration script

### Step 7: Switch to Pinecone in Your Controller

**Option A: On the `aqib` branch (your RAG work):**

1. Checkout your `aqib` branch:
   ```bash
   git checkout aqib
   ```

2. Update `backend/controllers/enhancedChatController.js` line ~415:
   ```javascript
   // OLD (ChromaDB + Flask):
   // const { retrieveContext } = require('../utils/ragSystemSimple');
   
   // NEW (Pinecone):
   const { retrieveContext } = require('../utils/ragSystemPinecone');
   ```

**Option B: On `main` branch (friend's code):**

Your friend's `enhancedChatController.js` doesn't have RAG yet. You'll need to:
1. Merge your `aqib` branch RAG changes
2. Update to use Pinecone instead of ChromaDB

---

## 🧪 Testing Locally

### 1. Test Migration Worked

```bash
cd backend
node -e "
const { Pinecone } = require('@pinecone-database/pinecone');
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('hikma-fatwas');
index.describeIndexStats().then(stats => console.log('Vectors:', stats.totalVectorCount));
"
```

Expected: `Vectors: 131057`

### 2. Test RAG Query

Start backend:
```bash
cd backend
node index.js
```

Test a query in your frontend or use curl:
```bash
curl -X POST http://localhost:5000/api/enhanced-chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "What is the ruling on wearing gold for men?"}'
```

Check backend logs for:
```
🔍 RAG Query: "What is the ruling on wearing gold for men?"
✅ RAG: Retrieved 5 fatwas
✅ RAG: Retrieved 5 fatwas in 1234ms
```

---

## 🚀 Deploy to Vercel

### 1. Add Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables:

```
PINECONE_API_KEY=your-pinecone-api-key
GEMINI_API_KEY=your-gemini-key
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
```

### 2. Commit and Push

```bash
# Make sure you're on your working branch
git checkout aqib  # or create a new branch

# Add new files
git add backend/utils/ragSystemPinecone.js
git add backend/scripts/migrate_to_pinecone.py
git add backend/package.json

# Commit
git commit -m "feat: migrate RAG from ChromaDB to Pinecone for Vercel

- Added Pinecone RAG client (ragSystemPinecone.js)
- Created migration script (migrate_to_pinecone.py)
- Updated package.json with Pinecone dependency
- Migrated 131K fatwas to Pinecone cloud
- Ready for Vercel serverless deployment"

# Push
git push origin aqib
```

### 3. Deploy to Vercel

```bash
# If you have Vercel CLI
vercel --prod

# Or push to GitHub and Vercel auto-deploys
git push origin main
```

### 4. Verify in Production

Test your deployed Vercel URL:
```bash
curl https://your-app.vercel.app/api/enhanced-chat/health
```

---

## 📊 Before vs After Comparison

| Feature | ChromaDB + Flask | Pinecone |
|---------|-----------------|----------|
| **Vercel Compatible** | ❌ No (needs Python server) | ✅ Yes (HTTP API) |
| **Local Storage** | ❌ 2.5 GB | ✅ 0 GB (cloud) |
| **Setup Complexity** | ❌ High (Flask + ChromaDB) | ✅ Low (just API calls) |
| **Query Speed** | ✅ ~1-3s | ✅ ~0.5-1s |
| **Scalability** | ❌ Limited | ✅ Millions of vectors |
| **Cost** | ✅ Free (local) | ✅ Free (100K vectors) |
| **Maintenance** | ❌ High | ✅ Low |

---

## 🔧 Troubleshooting

### Migration fails with "PINECONE_API_KEY not found"
**Solution:** Add `PINECONE_API_KEY` to your `.env` file

### "Index already exists" error
**Solution:** This is fine! The script will use the existing index

### "Failed to upload batch" error
**Solution:** Check your Pinecone free tier limits (100K vectors)

### RAG returns no results locally
**Solution:** 
1. Verify migration completed: Check Pinecone dashboard for 131K vectors
2. Check API key is correct in `.env`
3. Ensure you're using `ragSystemPinecone.js` not `ragSystemSimple.js`

### Vercel deployment fails
**Solution:**
1. Ensure `@pinecone-database/pinecone` is in `package.json` dependencies
2. Add `PINECONE_API_KEY` to Vercel environment variables
3. Check Vercel logs for specific errors

---

## 🎉 Success Checklist

- [ ] Pinecone account created with index `hikma-fatwas`
- [ ] Migration script completed (131K vectors in Pinecone)
- [ ] `PINECONE_API_KEY` added to `.env`
- [ ] Pinecone package installed (`npm install`)
- [ ] Code updated to use `ragSystemPinecone.js`
- [ ] Tested locally (RAG queries working)
- [ ] Environment variables added to Vercel
- [ ] Deployed to Vercel
- [ ] Tested in production

---

## 📞 Support

If you encounter issues:
1. Check Pinecone dashboard for index stats
2. Review backend logs for error messages
3. Verify all environment variables are set
4. Test with a simple query first

---

## 🗑️ After Migration (Optional)

Once everything works in production, you can:
1. Delete local ChromaDB data (saves 2.5 GB):
   ```bash
   rm -rf backend/chroma-data/
   rm -rf backend/chroma-data-test/
   ```
2. Remove unused files:
   - `backend/rag_service.py` (Flask service no longer needed)
   - `backend/utils/ragSystemSimple.js` (ChromaDB client no longer needed)
   - `backend/scripts/chromaIngestor.py` (data already migrated)

**But keep backups just in case!**

---

**Good luck with your migration! 🚀**
