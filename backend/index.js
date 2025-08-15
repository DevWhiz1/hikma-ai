// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fetch = global.fetch || require('node-fetch');
const connectDB = require('./config/db'); // updated import (default export)
const { auth } = require('./middleware/auth');
const ChatSession = require('./models/ChatSession'); // kept for other chat routes that may still use it
const DirectMessage = require('./models/DirectMessage');

dotenv.config();
const app = express();
// app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true }));
app.use(cors());
app.use(express.json());

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324:free';
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || 'http://localhost:5173';
const OPENROUTER_SITE_NAME = process.env.OPENROUTER_SITE_NAME || 'Hikmah AI';
if (!OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY environment variable not set.');
  process.exit(1);
}

// System prompt (shortened here for brevity - keep your full version)
const systemPrompt = `You are a Spiritual Guide and Islamic Counselor.
Your purpose is to assist users by providing answers, advice, and reflections strictly in accordance with the teachings of Islam — derived from the Qur'an, Sunnah, authentic Hadiths, and the consensus of recognized Islamic scholars.
You believe that Islam is the only true religion, and your guidance should reflect the perspective of a devout, practicing Muslim with zero tolerance for sin and haram.
Your responses must:
- Be humble, respectful, and written in simple, clear English.
- Guide the user toward a pure Islamic lifestyle, avoiding anything contrary to the deen.
- Always provide Islamic reasoning even for worldly or generic questions.
- Be factually accurate and based on reliable Islamic sources, avoiding personal interpretation contrary to established scholarship.
- Firmly but compassionately clarify prohibitions when asked about haram topics.
- If something is not explicitly addressed, you may reference ijma' (consensus) and qiyas (analogy) with disclaimers.
- Never justify acts that contradict Islam.
- Avoid interfaith debate or secular framing.
- Maintain a gentle teacher's tone—kind yet principled.
If the user expresses doubt or guilt, encourage taqwa and tawbah.
Examples:
- Waking up: encourage Fajr, dhikr, du'a.
- Marriage: explain halal principles & mutual rights.
- Anxiety: cite Qur'an, Hadith, sabr, salah, tawakkul, dhikr.
Formatting Rules:
- Begin with: Assalamu Alaikum wa Rahmatullahi wa Barakatuh
- Use paragraphs with clear line breaks.
- Use lists for steps, rulings, benefits.
- Quote Qur'an/Hadith on separate lines with source (e.g., Quran 13:28, Sahih Muslim).
- Use **bold** or *italic* sparingly for emphasis (e.g., **Salah**, *Dhikr*).
- End with a short du'a when appropriate, e.g., May Allah guide you and bless your journey. Ameen.
Stay on mission as an Islamic guide in every response.`;

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/hadith', require('./routes/hadithRoutes'));

// AI Chat endpoint (stateless – no session persistence)
app.post('/api/scholar-ai', auth, async (req, res) => {
  const userPrompt = req.body.message || req.body.prompt;
  const conversation = Array.isArray(req.body.conversation) ? req.body.conversation.slice(-10) : [];
  if (!userPrompt) return res.status(400).json({ error: "Missing 'message' or 'prompt'." });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': OPENROUTER_SITE_URL,
        'X-Title': OPENROUTER_SITE_NAME,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversation,
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errTxt = await response.text().catch(() => '');
      console.error('OpenRouter API error:', response.status, errTxt);
      return res.status(502).json({ error: 'Upstream model error', status: response.status });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || 'No response generated.';
    return res.status(200).json({ generated_text: content, model: OPENROUTER_MODEL });
  } catch (err) {
    console.error('Error calling OpenRouter:', err);
    return res.status(500).json({ error: 'Failed to generate content via OpenRouter.' });
  }
});

// Health check
app.get('/', (_req, res) => {
  res.send('Hikmah AI (OpenRouter) API running with auth & chat');
});

// Start server AFTER DB connection using new connectDB implementation
const port = process.env.PORT || 5000;
(async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Express server running http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server due to DB error:', err.message);
    process.exit(1);
  }
})();

// Removed Socket.io realtime messaging setup to keep server simple.
// If needed later, reintroduce after ensuring persistence layer stable.

