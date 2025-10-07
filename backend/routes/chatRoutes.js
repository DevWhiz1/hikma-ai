const express = require('express');
const { auth } = require('../middleware/auth');
const { getHistory, createSession, getSession, getSessions, deleteSession } = require('../controllers/chatController');
const ChatSession = require('../models/ChatSession');
const { filterSensitive } = require('../middleware/messageFilter');
const SensitiveLog = require('../models/SensitiveLog');
const User = require('../models/User');
const router = express.Router();

router.get('/sessions', auth, getSessions);
router.post('/sessions', auth, createSession);
router.get('/sessions/:id', auth, getSession);
router.delete('/sessions/:id', auth, deleteSession);
router.get('/history', auth, getHistory); // Legacy endpoint

module.exports = router;

// Send a message to a direct chat session
router.post('/sessions/:id/messages', auth, async (req, res) => {
  try {
    const { id } = req.params;
    let { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message content required' });
    const { filtered, warn } = filterSensitive(content);
    content = filtered;
    const session = await ChatSession.findOne({ _id: id, user: req.user._id, isActive: true });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.kind && session.kind !== 'direct') return res.status(400).json({ error: 'Not a direct chat' });
    session.messages.push({ role: 'user', content: content.trim() });
    await session.save();

    // Mirror to counterpart session (student <-> scholar)
    try {
      const Enrollment = require('../models/Enrollment');
      const mirror = await Enrollment.findOne({ $or: [ { studentSession: session._id }, { scholarSession: session._id } ] }).lean();
      if (mirror) {
        const counterpartId = String(mirror.studentSession) === String(session._id) ? mirror.scholarSession : mirror.studentSession;
        if (counterpartId) {
          await ChatSession.findByIdAndUpdate(counterpartId, {
            $push: { messages: { role: 'assistant', content: content.trim() } },
            $set: { lastActivity: new Date() }
          });
        }
      }
    } catch {}
    // Log sensitive usage if any and apply warning/block logic
    if (warn) {
      try {
        await SensitiveLog.create({ user: req.user._id, textSample: (req.body?.content||'').slice(0,200), redactedText: content.slice(0,200), endpoint: `/api/chat/sessions/${id}/messages` });
      } catch {}
      try {
        const user = await User.findById(req.user._id);
        user.warningCount = (user.warningCount || 0) + 1;
        if (user.warningCount >= 3) {
          user.lockUntil = new Date(Date.now() + 12 * 60 * 60 * 1000);
          user.warningCount = 0;
        }
        await user.save();
      } catch {}
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Failed to send message' }); }
});