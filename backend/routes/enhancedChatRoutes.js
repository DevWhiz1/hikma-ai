const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getChatSessions,
  getChatSession,
  sendAIMessage,
  sendScholarMessage,
  startDirectChat,
  getScholarStatus,
  deleteChatSession
} = require('../controllers/enhancedChatController');

// Get chat sessions (filtered by type: 'ai' or 'scholar')
router.get('/sessions', auth, getChatSessions);

// Get a specific chat session
router.get('/sessions/:sessionId', auth, getChatSession);

// Send AI message
router.post('/ai/message', auth, sendAIMessage);

// Send scholar message
router.post('/scholar/message', auth, sendScholarMessage);

// Start direct chat with scholar
router.post('/scholar/start', auth, startDirectChat);

// Get scholar status
router.get('/scholar/:scholarId/status', auth, getScholarStatus);

// Delete chat session
router.delete('/sessions/:sessionId', auth, deleteChatSession);

module.exports = router;
