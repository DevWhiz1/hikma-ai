const express = require('express');
const { auth } = require('../middleware/auth');
const { getHistory, createSession, getSession, getSessions, deleteSession } = require('../controllers/chatController');
const ChatSession = require('../models/ChatSession');
const { filterSensitive, filterMeetingLinks, filterContactInfo, detectAllLinks } = require('../middleware/messageFilter');
const { notifyAdmin } = require('../agents/notificationAgent');
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
    
    // Filter sensitive content
    const { filtered: sensitiveFiltered, warn } = filterSensitive(content);
    content = sensitiveFiltered;
    
    // Filter meeting links
    const { filtered: meetingFiltered, hasMeetingLink } = filterMeetingLinks(content);
    content = meetingFiltered;
    
    // Filter contact information (phone/email)
    const { filtered: contactFiltered, hasContactInfo, hasPhone, hasEmail } = filterContactInfo(content);
    content = contactFiltered;
    
    // Detect all links for logging
    const { hasLinks, links } = detectAllLinks(req.body.content || '');
    const session = await ChatSession.findOne({ _id: id, user: req.user._id, isActive: true });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.kind && session.kind !== 'direct') return res.status(400).json({ error: 'Not a direct chat' });
    const trimmed = content.trim();
    session.messages.push({ role: 'user', content: trimmed });
    await session.save();

    // Mirror to counterpart session (student <-> scholar)
    try {
      const Enrollment = require('../models/Enrollment');
      const mirror = await Enrollment.findOne({ $or: [ { studentSession: session._id }, { scholarSession: session._id } ] }).lean();
      if (mirror) {
        const counterpartId = String(mirror.studentSession) === String(session._id) ? mirror.scholarSession : mirror.studentSession;
        if (counterpartId) {
          await ChatSession.findByIdAndUpdate(counterpartId, {
            $push: { messages: { role: 'assistant', content: trimmed } },
            $set: { lastActivity: new Date() }
          });
        }
      }
    } catch {}
    // Notify counterpart participant via email
    try {
      const senderRole = (req.user?.role === 'scholar') ? 'scholar' : 'student';
      const Enrollment = require('../models/Enrollment');
      const Scholar = require('../models/Scholar');
      const User = require('../models/User');
      const mirror = await Enrollment.findOne({ $or: [ { studentSession: session._id }, { scholarSession: session._id } ] }).lean();
      if (mirror) {
        const isStudentSession = String(mirror.studentSession) === String(session._id);
        const scholarProfile = await Scholar.findById(mirror.scholar).populate('user','email name');
        const studentUser = await User.findById(mirror.student).select('email name');
        const recipient = isStudentSession ? scholarProfile?.user : studentUser;
        if (recipient?.email) {
          await notifyAdmin({
            senderName: req.user?.name || 'Unknown',
            senderRole,
            messageType: 'Chat',
            messagePreview: trimmed,
            sessionId: isStudentSession ? mirror.scholarSession : mirror.studentSession,
            timestamp: Date.now(),
            toEmail: recipient.email,
            force: false,
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
    
    // Log meeting link usage
    if (hasMeetingLink) {
      try {
        await SensitiveLog.create({ 
          user: req.user._id, 
          textSample: (req.body?.content||'').slice(0,200), 
          redactedText: content.slice(0,200), 
          endpoint: `/api/chat/sessions/${id}/messages`,
          type: 'meeting_link_blocked'
        });
      } catch {}
    }
    
    // Log contact info usage
    if (hasContactInfo) {
      try {
        await SensitiveLog.create({ 
          user: req.user._id, 
          textSample: (req.body?.content||'').slice(0,200), 
          redactedText: content.slice(0,200), 
          endpoint: `/api/chat/sessions/${id}/messages`,
          type: hasPhone ? 'phone_blocked' : 'email_blocked'
        });
      } catch {}
    }
    
    // Log all links for sensitive information tracking
    if (hasLinks) {
      try {
        await SensitiveLog.create({ 
          user: req.user._id, 
          textSample: (req.body?.content||'').slice(0,200), 
          redactedText: content.slice(0,200), 
          endpoint: `/api/chat/sessions/${id}/messages`,
          type: 'link_detected',
          metadata: { 
            links: links.slice(0, 10), // Store first 10 links
            linkCount: links.length 
          }
        });
      } catch {}
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Failed to send message' }); }
});