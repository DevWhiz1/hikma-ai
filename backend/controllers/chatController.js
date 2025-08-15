const AIChatMessage = require('../models/ChatMessage');
const ChatSession = require('../models/ChatSession');

async function getSessions(req, res) {
  try {
    const sessions = await ChatSession.find({ user: req.user._id, isActive: true })
      .select('title lastActivity createdAt')
      .sort({ lastActivity: -1 })
      .limit(50)
      .lean();
    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
}

async function createSession(req, res) {
  try {
    const { title } = req.body;
    const session = new ChatSession({
      user: req.user._id,
      title: title || 'New Chat',
      messages: []
    });
    await session.save();
    res.status(201).json({ session });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
}

async function getSession(req, res) {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    }).lean();
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    res.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch chat session' });
  }
}

async function deleteSession(req, res) {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
}

// Legacy endpoint for backward compatibility
async function getHistory(req, res) {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const messages = await AIChatMessage.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json({ messages: messages.reverse() });
}

module.exports = { getHistory, getSessions, createSession, getSession, deleteSession };