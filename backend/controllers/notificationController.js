const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Enrollment = require('../models/Enrollment');
const Scholar = require('../models/Scholar');
const { emitNewMessage, emitNotification } = require('../utils/socketEmitter');
const ChatSession = require('../models/ChatSession');

// Get all notifications for the authenticated user
async function getMyNotifications(req, res) {
  try {
    const { page = 1, limit = 50, unreadOnly = false } = req.query;

    const userId = new mongoose.Types.ObjectId(String(req.user._id));
    const query = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(query);
    // Treat missing read field as unread to be safe
    const unreadCount = await Notification.countDocuments({
      userId,
      read: { $ne: true }
    });

    res.json({
      ok: true,
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

// Mark notification as read
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(String(req.user._id));

    const notification = await Notification.findOne({
      _id: id,
      userId
    });

    if (!notification) {
      return res.status(404).json({ ok: false, error: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ ok: true, notification });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

// Mark all notifications as read
async function markAllAsRead(req, res) {
  try {
    // Ensure req.user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({ ok: false, error: 'User not authenticated' });
    }

    // Safely convert to ObjectId - handle both string and ObjectId inputs
    let userId;
    try {
      if (req.user._id instanceof mongoose.Types.ObjectId) {
        userId = req.user._id;
      } else {
        userId = new mongoose.Types.ObjectId(String(req.user._id));
      }
    } catch (castError) {
      console.error('Error casting userId to ObjectId:', castError);
      console.error('req.user._id:', req.user._id, 'type:', typeof req.user._id);
      return res.status(400).json({ ok: false, error: 'Invalid user ID format' });
    }

    // Use updateMany with proper query
    const result = await Notification.updateMany(
      { 
        userId: userId,
        $or: [
          { read: { $ne: true } },
          { read: { $exists: false } }
        ]
      },
      { 
        $set: { 
          read: true, 
          readAt: new Date() 
        } 
      }
    );

    res.json({ ok: true, message: 'All notifications marked as read', modified: result.modifiedCount || 0 });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    console.error('Error stack:', error.stack);
    console.error('req.user:', req.user ? { _id: req.user._id, id: req.user.id } : 'null');
    res.status(500).json({ ok: false, error: error.message || 'Internal server error' });
  }
}

// Delete a notification
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(String(req.user._id));

    const result = await Notification.deleteOne({
      _id: id,
      userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, error: 'Notification not found' });
    }

    res.json({ ok: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

// Get unread count
async function getUnreadCount(req, res) {
  try {
    // Count any document not explicitly marked as read=true as unread
    const userId = new mongoose.Types.ObjectId(String(req.user._id));
    const count = await Notification.countDocuments({
      userId,
      read: { $ne: true }
    });

    res.json({ ok: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}

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

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendSmartNotification
};
