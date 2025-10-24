require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize clients
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const INDEX_NAME = 'hikma-fatwas';

/**
 * Detect language of user query
 * @param {string} query - User's question
 * @returns {string} Language code ('ar', 'en', 'ur', 'tr', 'id', etc.)
 */
function detectLanguage(query) {
  // Arabic detection (most common in Islamic context)
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  if (arabicPattern.test(query)) {
    return 'ar';
  }
  
  // Urdu detection (shares Arabic script but has unique characters)
  const urduPattern = /[\u0600-\u06FF]/;
  const urduSpecific = /[ٹڈڑںے]/; // Unique Urdu characters
  if (urduSpecific.test(query)) {
    return 'ur';
  }
  
  // Turkish detection
  const turkishPattern = /[ğĞıİöÖüÜşŞçÇ]/;
  if (turkishPattern.test(query)) {
    return 'tr';
  }
  
  // Indonesian/Malay detection (common words)
  const indonesianWords = /\b(yang|adalah|untuk|dalam|dengan|akan|pada|ini|itu|tidak|ada|atau)\b/i;
  if (indonesianWords.test(query)) {
    return 'id';
  }
  
  // Default to English
  return 'en';
}

/**
 * Generate embedding using Google Gemini
 */
async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    
    if (!result || !result.embedding || !result.embedding.values) {
      throw new Error('Invalid embedding response');
    }
    
    return result.embedding.values;
  } catch (error) {
    console.error('❌ Embedding generation failed:', error.message);
    return null;
  }
}

/**
 * Retrieve context from Pinecone for RAG
 * @param {string} query - User's question
 * @param {object} options - Query options
 * @param {number} options.topK - Number of results to return (default: 5)
 * @returns {Promise<object>} RAG context with fatwas and metadata
 */
async function retrieveContext(query, options = {}) {
  const startTime = Date.now();
  const limit = options.topK || options.limit || 5;
  
  try {
    // Detect user's language
    const userLanguage = detectLanguage(query);
    console.log(`🔍 RAG Query: "${query.substring(0, 60)}..." [Language: ${userLanguage}]`);
    
    // 1. Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding) {
      console.warn('⚠️  Failed to generate query embedding');
      return {
        hasContext: false,
        context: '',
        sources: [],
        retrievalTime: Date.now() - startTime,
        fatwaCount: 0,
        language: userLanguage
      };
    }
    
    // 2. Query Pinecone index
    const index = pinecone.index(INDEX_NAME);
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: limit * 2, // Get more for filtering
      includeMetadata: true
    });
    
    const matches = queryResponse.matches || [];
    
    if (matches.length === 0) {
      console.log('ℹ️  No relevant fatwas found');
      return {
        hasContext: false,
        context: '',
        sources: [],
        retrievalTime: Date.now() - startTime,
        fatwaCount: 0
      };
    }
    
    console.log(`✅ RAG: Retrieved ${matches.length} fatwas`);
    
    // 3. Format results based on detected language
    const results = matches.slice(0, limit).map(match => {
      const metadata = match.metadata || {};
      const type = metadata.type || 'fatwa';
      
      // Extract text in user's language
      let primaryText = '';
      let arabicText = '';
      
      if (type === 'quran') {
        arabicText = metadata.text_arabic || '';
        primaryText = getTranslationForLanguage(metadata, userLanguage);
      } else if (type === 'hadith') {
        // Hadith uses different field names
        arabicText = metadata.arabic_text || metadata.text_arabic || '';
        primaryText = metadata.english_text || metadata.text_english || '';
      } else if (type === 'tafsir') {
        primaryText = getTranslationForLanguage(metadata, userLanguage);
      } else {
        // Fatwa
        primaryText = metadata.answer || metadata.text || '';
        arabicText = metadata.answer_arabic || '';
      }
      
      return {
        _id: match.id,
        type: type,
        text: primaryText,
        textArabic: arabicText,
        surahName: metadata.surah_name || '',
        ayahNumber: metadata.ayah_number || '',
        hadithBook: metadata.book_name || '',
        hadithNumber: metadata.hadith_number || '',
        scholar: metadata.scholar || '',
        category: metadata.category || '',
        score: match.score || 0,
        metadata: metadata
      };
    });
    
    // 4. Build context string for Gemini in user's language
    const context = formatMultilingualContext(results, userLanguage);
    
    // 5. Extract unique sources for attribution
    const sources = extractSources(results);
    
    const retrievalTime = Date.now() - startTime;
    
    return {
      hasContext: true,
      context,
      sources,
      retrievalTime,
      fatwaCount: results.length,
      language: userLanguage,
      intent: {}
    };
    
  } catch (error) {
    console.error('❌ RAG error:', error.message);
    return {
      hasContext: false,
      context: '',
      sources: [],
      retrievalTime: Date.now() - startTime,
      fatwaCount: 0,
      language: 'en'
    };
  }
}

/**
 * Get translation for specific language from metadata
 */
function getTranslationForLanguage(metadata, lang) {
  // Priority: requested language > English > Arabic
  const langMap = {
    'ar': metadata.text_arabic || metadata.arabic || '',
    'en': metadata.text_english || metadata.english || metadata.text || '',
    'ur': metadata.text_urdu || metadata.urdu || metadata.text_english || '',
    'tr': metadata.text_turkish || metadata.turkish || metadata.text_english || '',
    'id': metadata.text_indonesian || metadata.indonesian || metadata.text_english || ''
  };
  
  return langMap[lang] || metadata.text || metadata.text_english || metadata.text_arabic || '';
}

/**
 * Extract sources for attribution
 */
function extractSources(results) {
  const sources = [];
  const seen = new Set();
  
  results.forEach(result => {
    const type = result.type;
    let sourceText = '';
    
    if (type === 'quran') {
      sourceText = `Quran ${result.metadata.surah_name} ${result.metadata.ayah_number}`;
    } else if (type === 'hadith') {
      sourceText = `${result.metadata.book_name} #${result.metadata.hadith_number}`;
    } else if (type === 'tafsir') {
      sourceText = `Tafsir ${result.metadata.surah_name}:${result.metadata.ayah_number}`;
    } else {
      sourceText = result.metadata.scholar || 'Islamic Scholar';
    }
    
    if (!seen.has(sourceText)) {
      seen.add(sourceText);
      sources.push(sourceText);
    }
  });
  
  return sources;
}

/**
 * Format multilingual context for Gemini
 */
function formatMultilingualContext(results, lang) {
  if (!results || results.length === 0) {
    return '';
  }
  
  const langNames = {
    'ar': 'Arabic',
    'en': 'English',
    'ur': 'Urdu',
    'tr': 'Turkish',
    'id': 'Indonesian'
  };
  
  let context = `# Islamic Knowledge Base (${langNames[lang] || 'English'})\n\n`;
  context += 'The following are authentic Islamic sources:\n\n';
  
  results.forEach((result, index) => {
    context += `## Source ${index + 1}\n`;
    
    if (result.type === 'quran') {
      context += `**Type:** Quran\n`;
      context += `**Surah:** ${result.surahName} (${result.ayahNumber})\n`;
      if (lang === 'ar' || lang === 'ur') {
        context += `**Arabic Text:**\n${result.textArabic}\n\n`;
      }
      if (lang !== 'ar') {
        context += `**Translation:**\n${result.text}\n\n`;
      }
    } else if (result.type === 'hadith') {
      context += `**Type:** Hadith\n`;
      context += `**Collection:** ${result.hadithBook}\n`;
      context += `**Number:** ${result.hadithNumber}\n`;
      if (lang === 'ar' || lang === 'ur') {
        context += `**Arabic Text:**\n${result.textArabic}\n\n`;
      }
      if (lang !== 'ar') {
        context += `**Translation:**\n${result.text}\n\n`;
      }
    } else if (result.type === 'tafsir') {
      context += `**Type:** Tafsir (Commentary)\n`;
      context += `**Surah:** ${result.surahName} (${result.ayahNumber})\n`;
      context += `**Commentary:**\n${result.text}\n\n`;
    } else {
      // Fatwa
      context += `**Type:** Islamic Ruling (Fatwa)\n`;
      if (result.scholar) {
        context += `**Scholar:** ${result.scholar}\n`;
      }
      if (result.category) {
        context += `**Category:** ${result.category}\n`;
      }
      context += `**Answer:**\n${result.text}\n\n`;
    }
    
    context += '---\n\n';
  });
  
  return context;
}

/**
 * Format fatwas into context string for Gemini (legacy support)
 */
function formatFatwaContext(fatwas) {
  if (!fatwas || fatwas.length === 0) {
    return '';
  }
  
  let context = '# Islamic Knowledge Base\n\n';
  context += 'The following are authentic Islamic rulings from recognized scholars:\n\n';
  
  fatwas.forEach((fatwa, index) => {
    context += `## Fatwa ${index + 1}\n`;
    context += `**Scholar:** ${fatwa.scholar}\n`;
    context += `**Category:** ${fatwa.category}\n`;
    if (fatwa.question) {
      context += `**Question:** ${fatwa.question}\n`;
    }
    if (fatwa.answer) {
      context += `**Answer:** ${fatwa.answer}\n`;
    }
    context += `**Relevance Score:** ${(fatwa.score * 100).toFixed(1)}%\n`;
    context += `\n---\n\n`;
  });
  
  return context;
}

module.exports = {
  retrieveContext,
  formatFatwaContext
};
