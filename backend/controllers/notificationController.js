const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Enrollment = require('../models/Enrollment');
const Scholar = require('../models/Scholar');
const { emitNewMessage, emitNotification } = require('../utils/socketEmitter');
const ChatSession = require('../models/ChatSession');

// Ensure a persistent Chat exists between scholar (req.user) and student
async function ensureChat(studentUserId, scholarUserId) {
  let chat = await Chat.findOne({ studentId: studentUserId, scholarId: scholarUserId });
  if (!chat) {
    chat = await Chat.create({ studentId: studentUserId, scholarId: scholarUserId, messages: [] });
  }
  return chat;
}

async function mirrorToHikmaChat(studentUserId, scholarUserId, text) {
  try {
    const scholarProfile = await Scholar.findOne({ user: scholarUserId }).select('_id user');
    if (!scholarProfile) return;
    const enrollment = await Enrollment.findOne({ student: studentUserId, scholar: scholarProfile._id }).lean();
    if (!enrollment || (!enrollment.studentSession && !enrollment.scholarSession)) return;
    const updates = [];
    if (enrollment.studentSession) {
      updates.push(ChatSession.findByIdAndUpdate(enrollment.studentSession, {
        $push: { messages: { role: 'assistant', content: text } },
        $set: { lastActivity: new Date() }
      }));
    }
    if (enrollment.scholarSession) {
      updates.push(ChatSession.findByIdAndUpdate(enrollment.scholarSession, {
        $push: { messages: { role: 'assistant', content: text } },
        $set: { lastActivity: new Date() }
      }));
    }
    await Promise.all(updates);
  } catch (e) {
    console.warn('Mirror to Hikma chat (notify) failed:', e?.message || e);
  }
}

// POST /api/notifications/smart
// body: { text: string, audience: 'all'|'selected', studentIds?: string[] }
async function sendSmartNotification(req, res) {
  try {
    const scholarUserId = req.user._id;
    const { text, audience = 'all', studentIds = [] } = req.body || {};

    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    let targets = [];
    if (audience === 'all') {
      // Map current user (scholar user) -> Scholar document id
      const scholarDoc = await Scholar.findOne({ user: scholarUserId }).select('_id');
      if (!scholarDoc) {
        return res.status(404).json({ error: 'Scholar profile not found' });
      }
      const enrollments = await Enrollment.find({ scholar: scholarDoc._id, isActive: true }).select('student');
      targets = enrollments.map(e => e.student);
    } else if (audience === 'selected') {
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: 'studentIds required for selected audience' });
      }
      targets = studentIds;
    } else {
      return res.status(400).json({ error: 'Invalid audience' });
    }

    const results = [];
    for (const studentId of targets) {
      try {
        const chat = await ensureChat(studentId, scholarUserId);
        const msg = await Message.create({
          sender: scholarUserId,
          chatId: chat._id,
          text: String(text).trim(),
          type: 'text',
          timestamp: new Date()
        });
        chat.messages.push(msg._id);
        chat.lastActivity = new Date();
        await chat.save();

        // Emit socket events
        emitNewMessage(String(chat._id), {
          text: msg.text,
          senderId: String(scholarUserId),
          timestamp: msg.timestamp
        });
        emitNotification(String(studentId), {
          type: 'chat_message',
          text: msg.text,
          chatId: String(chat._id),
          from: String(scholarUserId),
          createdAt: msg.timestamp
        });
        // Mirror to Hikma ChatSessions so messages appear in legacy chat UI
        await mirrorToHikmaChat(studentId, scholarUserId, msg.text);

        results.push({ studentId: String(studentId), chatId: String(chat._id), messageId: String(msg._id), ok: true });
      } catch (e) {
        results.push({ studentId: String(studentId), ok: false, error: e.message });
      }
    }

    res.json({ success: true, sent: results.filter(r => r.ok).length, results });
  } catch (error) {
    console.error('sendSmartNotification error:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
}

module.exports = { sendSmartNotification };


