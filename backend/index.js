// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fetch = global.fetch || require('node-fetch');
const { connectDB } = require('./config/db');
const { auth } = require('./middleware/auth');
const ChatSession = require('./models/ChatSession');
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

// AI Chat endpoint (stores history if authenticated)
app.post('/api/scholar-ai', auth, async (req, res) => {
  const userPrompt = req.body.message || req.body.prompt;
  const conversation = Array.isArray(req.body.conversation) ? req.body.conversation : [];
  const sessionId = req.body.sessionId;
  
  if (!userPrompt) return res.status(400).json({ error: "Missing 'message' or 'prompt'." });

  try {
    let chatSession;
    
    // Find or create chat session
    if (sessionId) {
      chatSession = await ChatSession.findOne({
        _id: sessionId,
        user: req.user._id,
        isActive: true
      });
      if (!chatSession) {
        return res.status(404).json({ error: 'Chat session not found' });
      }
    } else {
      // Create new session
      chatSession = new ChatSession({
        user: req.user._id,
        title: 'New Chat',
        messages: []
      });
    }

    // Add user message to session
    chatSession.messages.push({
      role: 'user',
      content: userPrompt,
      timestamp: new Date()
    });

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
          ...conversation.slice(-10), // optional limited history (already user/assistant objects)
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

    // Add assistant message to session
    chatSession.messages.push({
      role: 'assistant',
      content,
      timestamp: new Date()
    });

    // Generate title if this is the first exchange
    if (!sessionId && chatSession.messages.filter(m => m.role === 'user').length === 1) {
      chatSession.generateTitle();
    }

    await chatSession.save();

    return res.status(200).json({ 
      generated_text: content, 
      model: OPENROUTER_MODEL,
      sessionId: chatSession._id,
      title: chatSession.title
    });
  } catch (err) {
    console.error('Error calling OpenRouter:', err);
    return res.status(500).json({ error: 'Failed to generate content via OpenRouter.' });
  }
});

// Health check
app.get('/', (_req, res) => {
  res.send('Hikmah AI (OpenRouter) API running with auth & chat');
});

// Start HTTP + Socket.io
const port = process.env.PORT || 5000;
const httpServer = app.listen(port, async () => {
  await connectDB(process.env.MONGO_URI);
  console.log(`Server running http://localhost:${port}`);
});

// WebSocket (Socket.io) for direct user<>scholar messaging
const { Server } = require('socket.io');
const { verifyToken } = require('./utils/jwt');
const io = new Server(httpServer, {
  cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const payload = verifyToken(token);
    socket.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.join(socket.user.id);

  socket.on('direct:message', async ({ to, content }) => {
    if (!to || !content) return;
    const msg = await DirectMessage.create({
      from: socket.user.id,
      to,
      content
    });
    io.to(to).emit('direct:message', {
      _id: msg._id,
      from: msg.from,
      to: msg.to,
      content: msg.content,
      createdAt: msg.createdAt
    });
    socket.emit('direct:sent', msg._id);
  });

  socket.on('direct:history', async ({ withUser, limit = 50 }) => {
    if (!withUser) return;
    const msgs = await DirectMessage.find({
      $or: [
        { from: socket.user.id, to: withUser },
        { from: withUser, to: socket.user.id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 200))
      .lean();
    socket.emit('direct:history', msgs.reverse());
  });
});

