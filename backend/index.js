// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');

// Load env BEFORE reading variables
dotenv.config();

const fetch = global.fetch || require('node-fetch');
const connectDB = require('./config/db');
const { auth } = require('./middleware/auth');
const ChatSession = require('./models/ChatSession');
const DirectMessage = require('./models/DirectMessage');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { emitNewMessage, emitSessionUpdate } = require('./utils/socketEmitter');

const modelName = 'gemini-2.5-flash'; 

// Read API key AFTER dotenv.config
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is missing in environment variables');
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      "http://localhost:5173",
      "http://localhost:5174", 
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize socket emitter
const { initializeSocket } = require('./utils/socketEmitter');
initializeSocket(io);

// 🚀 NEW: Initialize NotificationService with socket.io
const NotificationService = require('./services/notificationService');
NotificationService.io = io;

app.use(cors());
app.use(express.json());

// Raw body parser for Stripe webhooks
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));

// Static uploads serving
const uploadsDir = path.join(__dirname, 'uploads');
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir); } catch {}
app.use('/uploads', express.static(uploadsDir));

// Multer storage for images
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) { cb(null, uploadsDir); },
  filename: function (_req, file, cb) {
    const safe = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '') || '.jpg';
    cb(null, `${safe}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

const genAI = new GoogleGenerativeAI(apiKey || '');

// System prompt (shortened here for brevity - keep your full version)
const systemPrompt = `You are a Spiritual Guide and Islamic Counselor.
representing Hikma AI.
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
app.use('/api/enhanced-chat', require('./routes/enhancedChatRoutes'));
// Mount new scholar & meet routes
app.use('/api/scholars', require('./routes/scholarRoutes'));
app.use('/api/meet', require('./routes/meetRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/hadith', require('./routes/hadithRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/enhanced-admin', require('./routes/enhancedAdminRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/ratings-reviews', require('./routes/ratingReviewRoutes'));
app.use('/api/scholar-feedback', require('./routes/scholarFeedbackRoutes'));
app.use('/api/smart-scheduler', require('./routes/smartSchedulerRoutes'));
app.use('/api/enhanced-meetings', require('./routes/enhancedMeetingRoutes'));
app.use('/api/ai-agent', require('./routes/aiAgentRoutes'));
// Assignments & Submissions
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
// Notifications
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Upload endpoint (auth required)
app.post('/api/upload/photo', auth, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const base = process.env.BASE_URL || `http://localhost:${port}`;
  const url = `${base}/uploads/${req.file.filename}`;
  res.json({ url });
});

app.post('/api/scholar-ai', auth, async (req, res) => {
  let userPrompt = (req.body && (req.body.message || req.body.prompt)) || '';
  const conversation = Array.isArray(req.body?.conversation) ? req.body.conversation : [];
  const sessionId = req.body.sessionId;
  if (!userPrompt.trim()) {
    return res.status(400).json({ error: "Missing 'message' (or 'prompt') in request body." });
  }
  if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured.' });
  // Sensitive data filter & temporary lockout
  try {
    const User = require('./models/User');
    const { filterSensitive } = require('./middleware/messageFilter');
    const SensitiveLog = require('./models/SensitiveLog');
    // Check lock
    if (req.user.lockUntil && new Date(req.user.lockUntil) > new Date()) {
      const ms = new Date(req.user.lockUntil).getTime() - Date.now();
      const hours = Math.ceil(ms / (60 * 60 * 1000));
      return res.status(429).json({ error: `Messaging temporarily locked. Try again in ~${hours}h.` });
    }
    const { filtered, warn } = filterSensitive(userPrompt);
    userPrompt = filtered;
    if (warn) {
      const user = await User.findById(req.user._id);
      user.warningCount = (user.warningCount || 0) + 1;
      if (user.warningCount >= 3) {
        user.lockUntil = new Date(Date.now() + 12 * 60 * 60 * 1000);
        user.warningCount = 0; // reset after lock
      }
      await user.save();
      try { await SensitiveLog.create({ user: req.user._id, textSample: (req.body?.message||'').slice(0,200), redactedText: userPrompt.slice(0,200), endpoint: '/api/scholar-ai' }); } catch {}
    }
  } catch (filterErr) {
    console.warn('Filter/lock failed:', filterErr?.message);
  }
    try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    });
  // try {
  //   const model = genAI.getGenerativeModel({
  //     model: modelName,
  //     systemInstruction: systemPrompt,
  //     generationConfig: { temperature: 0.7, topP: 0.9, topK: 40, maxOutputTokens: 1024 }
  //   });

    const history = conversation
      .filter(m => m && m.content && (m.role === 'user' || m.role === 'assistant'))
      .slice(0, -1) // exclude current user prompt (last element)
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    let text;
    if (history.length) {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userPrompt);
      text = result?.response?.text();
    } else {
      const result = await model.generateContent(userPrompt);
      text = result?.response?.text();
    }

    if (!text) return res.status(502).json({ error: 'Empty response from Gemini model.' });

    let updatedSessionSummary = null;
    if (sessionId) {
      try {
        const session = await ChatSession.findOne({ _id: sessionId, user: req.user._id, isActive: true });
        if (session) {
          // Only persist AI messages to AI sessions
          if (session.kind && session.kind !== 'ai') {
            return res.status(200).json({ text, generated_text: text, session: { _id: session._id, title: session.title, lastActivity: session.lastActivity, createdAt: session.createdAt } });
          }
          // Append latest user + assistant messages
          session.messages.push({ role: 'user', content: userPrompt });
          session.messages.push({ role: 'assistant', content: text });
          // Auto title if still default
          if (session.title === 'New Chat' && session.messages.length >= 1) {
            const firstUser = session.messages.find(m => m.role === 'user');
            if (firstUser) {
              let t = firstUser.content.trim().slice(0, 50);
              if (firstUser.content.length > 50) t += '...';
              session.title = t || 'New Chat';
            }
          }
          // Limit stored messages (optional - keep last 40)
          if (session.messages.length > 80) {
            session.messages = session.messages.slice(-80);
          }
          await session.save();
          updatedSessionSummary = { _id: session._id, title: session.title, lastActivity: session.lastActivity, createdAt: session.createdAt };
          
          // Emit WebSocket events for AI response
          emitNewMessage(session._id, {
            text: text,
            senderId: 'ai',
            timestamp: new Date()
          });

          emitSessionUpdate(req.user._id, session._id, {
            _id: session._id,
            title: session.title,
            lastActivity: session.lastActivity,
            messages: session.messages
          });
        }
      } catch (sessErr) {
        console.error('Session persistence error:', sessErr.message);
      }
    }

    res.status(200).json({ text, generated_text: text, session: updatedSessionSummary });
  } catch (error) {
    const errData = error?.response?.data || error?.message || error;
    console.error('Error calling Gemini API:', errData);
    res.status(500).json({ error: 'Failed to generate content from Gemini API.' });
  }
});

// Health check
app.get('/', (_req, res) => {
  res.send('Hikmah AI API running with auth & chat');
});

// Credential validation endpoint
app.get('/api/validate-credentials', async (_req, res) => {
  try {
    const CredentialValidator = require('./utils/validateCredentials');
    const validator = new CredentialValidator();
    const results = await validator.validateAll();
    
    const allValid = Object.values(results).every(r => r.status === 'success');
    
    res.json({
      success: allValid,
      message: allValid ? 'All credentials are valid' : 'Some credentials need attention',
      results,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to validate credentials',
      error: error.message
    });
  }
});

// Decrypt and redirect to Meet link safely (no auth so new tab can open)
app.get('/api/meet/open', (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Missing token');
    const { decryptLink } = require('./utils/encryption');
    const link = decryptLink(String(token));
    // Use 302 redirect to open meet link
    res.redirect(link);
  } catch (e) {
    res.status(400).send('Invalid or expired link');
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  console.log('Socket namespace:', socket.nsp.name);

  // Test connection
  socket.on('test-connection', (data) => {
    console.log('Test connection received:', data);
    socket.emit('test-response', { message: 'Hello from server', timestamp: new Date() });
  });

  // Join user to their personal room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their notification room`);
  });

  // 🚀 NEW: Mark notification as read via socket
  socket.on('mark-notification-read', async (notificationId) => {
    try {
      const Notification = require('./models/Notification');
      await Notification.findByIdAndUpdate(notificationId, {
        read: true,
        readAt: new Date()
      });
      console.log(`Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('Error marking notification as read:', error.message);
    }
  });

  // Join chat room
  socket.on('join-chat', (chatId) => {
    socket.join(`chat-${chatId}`);
    console.log(`User joined chat ${chatId}`);
  });

  // Handle new message
  socket.on('send-message', async (data) => {
    try {
      const { chatId, text, senderId } = data;
      
      // Emit to all users in the chat room
      socket.to(`chat-${chatId}`).emit('new-message', {
        chatId,
        text,
        senderId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  // Typing indicators
  socket.on('typing', (data) => {
    try {
      const { chatId, userId, isTyping } = data || {};
      if (!chatId) return;
      // Broadcast to others in the same chat room
      socket.to(`chat-${chatId}`).emit('typing', { chatId, userId, isTyping });
    } catch (error) {
      console.error('Socket typing error:', error);
    }
  });

  // Handle meeting request
  socket.on('meeting-request', (data) => {
    const { chatId, studentId, scholarId } = data;
    socket.to(`chat-${chatId}`).emit('meetingRequest', {
      chatId,
      studentId,
      scholarId
    });
  });

  // Handle meeting scheduled
  socket.on('meeting-scheduled', (data) => {
    const { chatId, scheduledTime } = data;
    socket.to(`chat-${chatId}`).emit('meetingScheduled', {
      chatId,
      scheduledTime
    });
  });

  // Handle meeting link sent
  socket.on('meeting-link-sent', (data) => {
    const { chatId, link, roomId } = data;
    socket.to(`chat-${chatId}`).emit('meetingLinkSent', {
      chatId,
      link,
      roomId
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// CRON job for automatic meeting link generation
cron.schedule('* * * * *', async () => {
  try {
    const Meeting = require('./models/Meeting');
    const Message = require('./models/Message');
    const Chat = require('./models/Chat');
    const { generateJitsiLink } = require('./controllers/meetingController');
    
    // Find meetings that should start now (within the last minute)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    const meetings = await Meeting.find({
      status: 'scheduled',
      scheduledTime: { $gte: oneMinuteAgo, $lte: now }
    });

                for (const meeting of meetings) {
      // Generate Jitsi link
      const { roomId, link } = generateJitsiLink();
      
      // Update meeting
      meeting.link = link;
      meeting.roomId = roomId;
      meeting.status = 'link_sent';
      await meeting.save();

      // Create meeting link message (system: HikmaBot) - URL is in metadata, will be shown as button
      const message = new Message({
        sender: meeting.scholarId,
        chatId: meeting.chatId,
        text: `HikmaBot: Your meeting has started!`,
        type: 'meeting_link',
        metadata: { meetingLink: link, roomId }
      });
      await message.save();

      // Add message to chat
      const chat = await Chat.findById(meeting.chatId);
      if (chat) {
        chat.messages.push(message._id);
        chat.lastActivity = new Date();
        await chat.save();
      }

                  // Emit socket event
      io.to(`chat-${meeting.chatId}`).emit('meetingLinkSent', {
        chatId: meeting.chatId,
        link,
        roomId
      });

                  // Mirror into Hikma chat (legacy direct chat sessions) with metadata
                  try {
                    const ChatSession = require('./models/ChatSession');
                    const Enrollment = require('./models/Enrollment');
                    const Scholar = require('./models/Scholar');
                    const scholarProfile = await Scholar.findOne({ user: meeting.scholarId }).select('_id user');
                    if (scholarProfile) {
                      const enrollment = await Enrollment.findOne({ student: meeting.studentId, scholar: scholarProfile._id }).lean();
                      const text = `HikmaBot: Your meeting has started!`;
                      const messageObj = {
                        role: 'assistant',
                        content: text,
                        type: 'meeting_link',
                        metadata: {
                          meetingLink: link,
                          roomId: roomId
                        }
                      };
                      if (enrollment?.studentSession) {
                        await ChatSession.findByIdAndUpdate(enrollment.studentSession, { $push: { messages: messageObj }, $set: { lastActivity: new Date() } });
                      }
                      if (enrollment?.scholarSession) {
                        await ChatSession.findByIdAndUpdate(enrollment.scholarSession, { $push: { messages: messageObj }, $set: { lastActivity: new Date() } });
                      }
                    }
                  } catch (e) {
                    console.warn('Cron mirror failed:', e?.message || e);
                  }

      // Email both participants with the link
      try {
        const { notifyAdmin } = require('./agents/notificationAgent');
        const User = require('./models/User');
        const scholarDoc = await User.findById(meeting.scholarId).select('email name');
        const studentDoc = await User.findById(meeting.studentId).select('email name');
        const preview = `Your meeting has started! Join here: ${link}`;
        const payload = {
          senderName: scholarDoc?.name || 'Scholar',
          senderRole: 'scholar',
          messageType: 'Chat',
          messagePreview: preview,
          sessionId: undefined,
          chatId: String(meeting.chatId),
          timestamp: Date.now(),
        };
        if (scholarDoc?.email) await notifyAdmin({ ...payload, toEmail: scholarDoc.email, force: true });
        if (studentDoc?.email) await notifyAdmin({ ...payload, toEmail: studentDoc.email, force: true });
      } catch {}

      console.log(`Meeting link sent for meeting ${meeting._id}`);
    }
  } catch (error) {
    console.error('CRON job error:', error);
  }
});

// Start server AFTER DB connection using new connectDB implementation
const port = process.env.PORT || 5000;
(async () => {
  try {
    await connectDB();
    server.listen(port, () => {
      console.log(`Express server running http://localhost:${port}`);
      console.log(`Socket.IO server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server due to DB error:', err.message);
    process.exit(1);
  }
})();

// Smart Notify Cron (every 5 minutes): evaluate due rules across scholars
cron.schedule('*/5 * * * *', async () => {
  try {
    const NotificationRule = require('./models/NotificationRule');
    const rules = await NotificationRule.find({ isActive: true }).select('scholarUserId').lean();
    const uniqueScholars = Array.from(new Set(rules.map(r => String(r.scholarUserId))));
    if (uniqueScholars.length === 0) return;
    // For now, run all rules via internal controller to avoid auth for cron
    const controller = require('./controllers/notificationRuleController');
    for (const scholarUserId of uniqueScholars) {
      // Fake req/res objects to call runDueRules internally for each scholar
      const req = { user: { _id: scholarUserId } };
      const res = { json: () => {} };
      await controller.runDueRules(req, res);
    }
  } catch (e) {
    console.warn('SmartNotify cron error:', e?.message || e);
  }
});

