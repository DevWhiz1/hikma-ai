const ChatSession = require('../models/ChatSession');
const DirectMessage = require('../models/DirectMessage');
const Enrollment = require('../models/Enrollment');
const Scholar = require('../models/Scholar');
const User = require('../models/User');
const { filterSensitive, filterMeetingLinks, filterContactInfo, detectAllLinks } = require('../middleware/messageFilter');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { retrieveContext } = require('../utils/ragSystemPinecone');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Get all chat sessions for a user (separated by type)
const getChatSessions = async (req, res) => {
  try {
    const { type } = req.query; // 'ai' or 'scholar'
    const userId = req.user._id;

    let query = { user: userId, isActive: true };
    
    if (type === 'ai') {
      // AI chat sessions (not direct chats with scholars)
      query.kind = { $ne: 'direct' };
    } else if (type === 'scholar') {
      // Scholar chat sessions (direct chats)
      query.kind = 'direct';
    }

    const sessions = await ChatSession.find(query)
      .sort({ lastActivity: -1 })
      .limit(50);

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        _id: session._id,
        title: session.title,
        lastMessage: session.messages?.length > 0 ? session.messages[session.messages.length - 1]?.content : '',
        lastActivity: session.lastActivity,
        messageCount: session.messages?.length || 0,
        kind: session.kind
      }))
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
};

// Get a specific chat session
const getChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await ChatSession.findOne({ 
      _id: sessionId, 
      user: userId, 
      isActive: true 
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      session: {
        _id: session._id,
        title: session.title,
        messages: session.messages || [],
        lastActivity: session.lastActivity,
        kind: session.kind,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({ error: 'Failed to fetch chat session' });
  }
};

// Send a message to AI chat
const sendAIMessage = async (req, res) => {
  try {
    const { sessionId, message, conversation } = req.body;
    const userId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content required' });
    }

    // Find or create session
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, user: userId, isActive: true });
    }

    if (!session) {
      session = await ChatSession.create({
        user: userId,
        title: 'AI Islamic Assistant',
        messages: [],
        kind: 'ai',
        isActive: true
      });
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    });

    // Simulate AI response (in real implementation, this would call your AI service)
    const aiResponse = await generateAIResponse(message.trim(), conversation || []);
    
    session.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    session.lastActivity = new Date();
    await session.save();

    // Emit realtime event to this chat room and update user session list
    try {
      const { emitNewMessage, emitSessionUpdate } = require('../utils/socketEmitter');
      emitNewMessage(session._id, {
        text: cleanMessage,
        senderId: String(userId),
        timestamp: new Date()
      });
      emitSessionUpdate(req.user._id, session._id, {
        _id: session._id,
        title: session.title,
        lastActivity: session.lastActivity,
        messages: session.messages
      });
    } catch (e) {
      console.warn('Socket emit failed (scholar message):', e?.message || e);
    }

    res.json({
      success: true,
      session: {
        _id: session._id,
        title: session.title,
        messages: session.messages,
        lastActivity: session.lastActivity
      },
      generated_text: aiResponse
    });
  } catch (error) {
    console.error('Error sending AI message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Send a message to scholar chat
const sendScholarMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const userId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content required' });
    }

    // Find the session
    const session = await ChatSession.findOne({ 
      _id: sessionId, 
      user: userId, 
      isActive: true,
      kind: 'direct'
    });

    if (!session) {
      return res.status(404).json({ error: 'Scholar chat session not found' });
    }

    // Filter sensitive content
    const { filtered: sensitiveFiltered, warn } = filterSensitive(message);
    const filteredMessage = sensitiveFiltered;
    
    // Filter meeting links
    const { filtered: meetingFiltered, hasMeetingLink } = filterMeetingLinks(filteredMessage);
    const finalMessage = meetingFiltered;
    
    // Filter contact information
    const { filtered: contactFiltered, hasContactInfo } = filterContactInfo(finalMessage);
    const cleanMessage = contactFiltered;

    // Add user message to session
    session.messages.push({
      role: 'user',
      content: cleanMessage,
      timestamp: new Date()
    });

    session.lastActivity = new Date();
    await session.save();

    // Mirror to scholar's session
    try {
      const enrollment = await Enrollment.findOne({ 
        $or: [
          { studentSession: session._id },
          { scholarSession: session._id }
        ]
      });

      if (enrollment) {
        const counterpartId = String(enrollment.studentSession) === String(session._id) 
          ? enrollment.scholarSession 
          : enrollment.studentSession;

        if (counterpartId) {
          await ChatSession.findByIdAndUpdate(counterpartId, {
            $push: { 
              messages: { 
                role: 'assistant', 
                content: cleanMessage,
                timestamp: new Date()
              } 
            },
            $set: { lastActivity: new Date() }
          });
          try {
            const { emitNewMessage } = require('../utils/socketEmitter');
            emitNewMessage(counterpartId, {
              text: cleanMessage,
              senderId: String(userId),
              timestamp: new Date()
            });
          } catch {}
        }
      }
    } catch (mirrorError) {
      console.error('Error mirroring message:', mirrorError);
    }

    // Create direct message record for tracking
    try {
      await DirectMessage.create({
        from: userId,
        to: session.user, // This will be the scholar's user ID
        content: cleanMessage,
        sessionId: session._id,
        timestamp: new Date()
      });
    } catch (dmError) {
      console.error('Error creating direct message record:', dmError);
    }

    res.json({
      success: true,
      session: {
        _id: session._id,
        title: session.title,
        messages: session.messages,
        lastActivity: session.lastActivity
      }
    });
  } catch (error) {
    console.error('Error sending scholar message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Start a new direct chat with a scholar
const startDirectChat = async (req, res) => {
  try {
    const { scholarId } = req.body;
    const userId = req.user._id;

    if (!scholarId) {
      return res.status(400).json({ error: 'Scholar ID required' });
    }

    // Check if user is enrolled with this scholar
    const enrollment = await Enrollment.findOne({ 
      student: userId, 
      scholar: scholarId 
    }).populate('scholar', 'user').populate('scholar.user', 'name');

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled with this scholar to start a chat' });
    }

    // Get scholar info
    const scholar = await Scholar.findById(scholarId).populate('user', 'name email');
    if (!scholar) {
      return res.status(404).json({ error: 'Scholar not found' });
    }

    // Create or get existing sessions
    let studentSession, scholarSession;

    // Ensure sessions exist; recreate if missing or inactive
    if (enrollment.studentSession && enrollment.scholarSession) {
      studentSession = await ChatSession.findById(enrollment.studentSession);
      scholarSession = await ChatSession.findById(enrollment.scholarSession);
    }
    if (!studentSession || studentSession.isActive === false) {
      studentSession = await ChatSession.create({
        user: userId,
        title: `Chat with ${scholar.user.name} (Scholar)`,
        messages: [],
        kind: 'direct',
        isActive: true
      });
      enrollment.studentSession = studentSession._id;
    }
    if (!scholarSession || scholarSession.isActive === false) {
      scholarSession = await ChatSession.create({
        user: scholar.user._id,
        title: `Chat with ${req.user.name} (Student)`,
        messages: [],
        kind: 'direct',
        isActive: true
      });
      enrollment.scholarSession = scholarSession._id;
    }
    await enrollment.save();

    // Update last activity
    studentSession.lastActivity = new Date();
    scholarSession.lastActivity = new Date();
    await studentSession.save();
    await scholarSession.save();

    res.json({
      success: true,
      studentSessionId: studentSession._id,
      scholarSessionId: scholarSession._id,
      scholar: {
        _id: scholar._id,
        name: scholar.user.name,
        email: scholar.user.email,
        photoUrl: scholar.photoUrl,
        specializations: scholar.specializations,
        isActive: scholar.isActive,
        averageRating: scholar.averageRating
      }
    });
  } catch (error) {
    console.error('Error starting direct chat:', error);
    res.status(500).json({ error: 'Failed to start direct chat' });
  }
};

// Get scholar's online status
const getScholarStatus = async (req, res) => {
  try {
    const { scholarId } = req.params;
    
    const scholar = await Scholar.findById(scholarId).populate('user', 'name email');
    if (!scholar) {
      return res.status(404).json({ error: 'Scholar not found' });
    }

    // Check if scholar has been active recently (within last 5 minutes)
    const recentActivity = await ChatSession.findOne({
      user: scholar.user._id,
      lastActivity: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    });

    res.json({
      success: true,
      scholar: {
        _id: scholar._id,
        name: scholar.user.name,
        isOnline: !!recentActivity,
        lastSeen: recentActivity ? 'Online now' : 'Last seen recently',
        isActive: scholar.isActive
      }
    });
  } catch (error) {
    console.error('Error getting scholar status:', error);
    res.status(500).json({ error: 'Failed to get scholar status' });
  }
};

// Delete a chat session
const deleteChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await ChatSession.findOne({ 
      _id: sessionId, 
      user: userId 
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // For direct chats, also deactivate the counterpart session
    if (session.kind === 'direct') {
      try {
        const enrollment = await Enrollment.findOne({
          $or: [
            { studentSession: session._id },
            { scholarSession: session._id }
          ]
        });

        if (enrollment) {
          const counterpartId = String(enrollment.studentSession) === String(session._id) 
            ? enrollment.scholarSession 
            : enrollment.studentSession;

          if (counterpartId) {
            await ChatSession.findByIdAndUpdate(counterpartId, {
              $set: { isActive: false }
            });
          }
        }
      } catch (error) {
        console.error('Error deactivating counterpart session:', error);
      }
    }

    session.isActive = false;
    await session.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

// Helper function to generate AI response (placeholder)
const generateAIResponse = async (message, conversation) => {
  try {
    // Step 1: Retrieve relevant context from Pinecone (Quran + Hadiths)
    console.log('🔍 Retrieving context from Pinecone...');
    const ragResult = await retrieveContext(message, { topK: 5 });
    
    // Step 2: Build conversation history
    const conversationHistory = conversation.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    // Step 3: Determine if context is relevant (check if scores are above threshold)
    const isRelevantContext = ragResult.hasContext && ragResult.fatwaCount > 0;
    
    // Step 4: Detect if the message is a greeting (Salam, Hello, etc.)
    const greetingRegex = /^(salam|assalamu|assalam|hello|hi|hey|peace be upon you|salam alaikum|السلام عليكم)/i;
    const isGreeting = greetingRegex.test(message.trim());
    
    // Step 5: Build system prompt
    let systemPrompt = `You are Hikma AI, a knowledgeable Islamic assistant. Provide comprehensive, accurate, and thoughtful answers about Islam.
    
FORMATTING:
- Use clear, well-structured responses
- Always respond in the SAME language the user used
- Be respectful and scholarly in tone

IMPORTANT:
- Provide detailed, informative answers
- Support responses with Islamic knowledge when appropriate

SPECIAL RULE FOR GREETINGS:
If the user greets you with "Salam", "Assalamu Alaikum", "Hello", "Hi", or similar short greetings:
- Do NOT use RAG or add long context.
- Do NOT include any sources, Hadiths, or Tafsir.
- Simply reply with a short, warm message (3–4 lines max), such as:

"Assalamu Alaikum wa Rahmatullahi wa Barakatuh dear brother/sister.  
May Allah bless you with peace and guidance.  
How can I assist you today?"`;
    
    // Step 6: Add RAG context only if NOT greeting
    if (!isGreeting && isRelevantContext) {
      systemPrompt += `

AUTHENTIC ISLAMIC SOURCES AVAILABLE:
${ragResult.context}

IMPORTANT: Weave these Quran verses and Hadiths naturally into your response. Don't just list them at the end. Incorporate them smoothly like:
- "As Allah beautifully says in Surah Al-Baqarah..."
- "The Prophet ﷺ taught us in Sahih Bukhari..."
- "This is supported by the verse..."

Make the citations feel natural and conversational, not academic.`;
      console.log(`✅ Retrieved ${ragResult.sources.length} relevant sources to enhance response`);
    } else if (isGreeting) {
      console.log('🤝 Greeting detected — skipping RAG context');
    } else {
      console.log('ℹ️ No specific sources found, generating response from general knowledge');
    }
    
    // Step 7: Generate AI response using Gemini
    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
    
    const result = await chat.sendMessage(systemPrompt + '\n\nUser question: ' + message);
    const aiResponse = result.response.text();
    
    // Step 8: Add sources ONLY if NOT a greeting and RAG was used
    let finalResponse = aiResponse;
    if (!isGreeting && isRelevantContext && ragResult.sources.length > 0) {
      const sourcesList = ragResult.sources
        .slice(0, 3)
        .map(src => `• ${src}`)
        .join('\n');
      
      finalResponse += `\n\n📚 **Sources:**\n${sourcesList}`;
    } else if (isGreeting) {
      console.log('📭 Skipping sources — greeting detected.');
    }
    
    // Step 9: Return the clean response
    return finalResponse;
  } catch (error) {
    console.error('❌ Error generating AI response:', error);
    return "I apologize, but I'm having trouble processing your question right now. Please try again in a moment, or rephrase your question.";
  }
};
      

module.exports = {
  getChatSessions,
  getChatSession,
  sendAIMessage,
  sendScholarMessage,
  startDirectChat,
  getScholarStatus,
  deleteChatSession
};
