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

    if (enrollment.studentSession && enrollment.scholarSession) {
      // Use existing sessions
      studentSession = await ChatSession.findById(enrollment.studentSession);
      scholarSession = await ChatSession.findById(enrollment.scholarSession);
    } else {
      // Create new sessions
      studentSession = await ChatSession.create({
        user: userId,
        title: `Chat with ${scholar.user.name} (Scholar)`,
        messages: [],
        kind: 'direct',
        isActive: true
      });

      scholarSession = await ChatSession.create({
        user: scholar.user._id,
        title: `Chat with ${req.user.name} (Student)`,
        messages: [],
        kind: 'direct',
        isActive: true
      });

      // Update enrollment with session IDs
      enrollment.studentSession = studentSession._id;
      enrollment.scholarSession = scholarSession._id;
      await enrollment.save();
    }

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
    
    // Step 4: Build enhanced prompt with RAG context
    let systemPrompt = `You are Hikma AI, an Islamic knowledge assistant providing authentic guidance based on Quran and Hadith.

IMPORTANT INSTRUCTIONS:
- Always respond in the SAME LANGUAGE the user used in their question
- If user asks in Arabic, respond in Arabic
- If user asks in English, respond in English  
- If user asks in Urdu, French, Turkish, Indonesian, or any other language, respond in that language
- Provide answers based on authentic Islamic sources when available
- For greetings and casual conversation, respond naturally without forcing citations
- Be respectful, compassionate, and clear
- If uncertain, acknowledge limitations and suggest consulting a scholar
`;

    if (isRelevantContext) {
      systemPrompt += `\n\nRELEVANT ISLAMIC SOURCES:\n${ragResult.context}\n\nUse these authentic sources to answer the question. Always cite the specific source (Surah:Ayah or Hadith reference) when quoting.`;
      console.log(`✅ Retrieved ${ragResult.sources.length} relevant sources`);
    } else {
      console.log('ℹ️ No specific sources found or not relevant, using general knowledge');
    }
    
    // Step 5: Generate AI response with Gemini
    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
    
    const result = await chat.sendMessage(systemPrompt + '\n\nUser question: ' + message);
    const response = result.response;
    const aiResponse = response.text();
    
    // Step 6: Add source attribution ONLY if context was actually used
    let finalResponse = aiResponse;
    if (isRelevantContext && ragResult.sources.length > 0) {
      const sourcesList = ragResult.sources
        .slice(0, 3) // Show top 3 sources
        .map(src => `• ${src}`)
        .join('\n');
      finalResponse += `\n\n📚 **Sources:**\n${sourcesList}`;
    }
    
    return finalResponse;
    
  } catch (error) {
    console.error('Error generating AI response:', error);
    // Fallback response in case of error
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
