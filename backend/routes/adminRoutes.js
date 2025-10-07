const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const SensitiveLog = require('../models/SensitiveLog');
const Scholar = require('../models/Scholar');
const ChatSession = require('../models/ChatSession');

const router = express.Router();

// List users (students and scholars)
router.get('/users', auth, requireRole('admin'), async (req, res) => {
  const users = await User.find().select('name email role warningCount lockUntil createdAt');
  res.json(users);
});

// Block/unblock
router.post('/users/:id/block', auth, requireRole('admin'), async (req, res) => {
  const until = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const u = await User.findByIdAndUpdate(req.params.id, { lockUntil: until }, { new: true });
  res.json({ success: true, user: u });
});
router.post('/users/:id/unblock', auth, requireRole('admin'), async (req, res) => {
  const u = await User.findByIdAndUpdate(req.params.id, { lockUntil: null, warningCount: 0 }, { new: true });
  res.json({ success: true, user: u });
});

// Reviews analytics (feedback)
router.get('/reviews', auth, requireRole('admin'), async (req, res) => {
  const data = await Enrollment.aggregate([
    { $unwind: '$feedback' },
    { $group: { _id: '$scholar', count: { $sum: 1 }, avgRating: { $avg: '$feedback.rating' } } },
    { $lookup: { from: 'scholars', localField: '_id', foreignField: '_id', as: 'scholarDoc' } },
    { $unwind: { path: '$scholarDoc', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'users', localField: 'scholarDoc.user', foreignField: '_id', as: 'userDoc' } },
    { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 1, count: 1, avgRating: 1, scholarName: '$userDoc.name' } },
    { $sort: { count: -1 } }
  ]);
  res.json(data);
});

// Sensitive logs
router.get('/sensitive-logs', auth, requireRole('admin'), async (req, res) => {
  const logs = await SensitiveLog.find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(500);
  res.json(logs);
});

// Danger: purge all direct chats and enrollments (one-time cleanup)
router.post('/purge-direct-chats', auth, requireRole('admin'), async (_req, res) => {
  try {
    const Enrollment = require('../models/Enrollment');
    const ChatSession = require('../models/ChatSession');
    // Collect all direct sessions from enrollments
    const enrollments = await Enrollment.find({}).select('studentSession scholarSession');
    const sessionIds = [];
    enrollments.forEach(e => {
      if (e.studentSession) sessionIds.push(e.studentSession);
      if (e.scholarSession) sessionIds.push(e.scholarSession);
    });
    if (sessionIds.length) {
      await ChatSession.deleteMany({ _id: { $in: sessionIds } });
    }
    await Enrollment.deleteMany({});
    res.json({ success: true, removedSessions: sessionIds.length, removedEnrollments: enrollments.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to purge direct chats' });
  }
});

// Danger: purge ALL chats (AI + direct) and related meeting data
router.post('/purge-all-chats', auth, requireRole('admin'), async (_req, res) => {
  try {
    const Enrollment = require('../models/Enrollment');
    const ChatSession = require('../models/ChatSession');
    let removedEnrollments = 0;
    let removedSessions = 0;

    try {
      const enrollments = await Enrollment.find({}).select('_id');
      removedEnrollments = enrollments.length;
      await Enrollment.deleteMany({});
    } catch {}

    try {
      const sessCount = await ChatSession.countDocuments({});
      removedSessions = sessCount;
      await ChatSession.deleteMany({});
    } catch {}

    // Also clear new Chat/Message/Meeting models used by meeting system, if present
    try { const Chat = require('../models/Chat'); await Chat.deleteMany({}); } catch {}
    try { const Message = require('../models/Message'); await Message.deleteMany({}); } catch {}
    try { const Meeting = require('../models/Meeting'); await Meeting.deleteMany({}); } catch {}

    res.json({ success: true, removedSessions, removedEnrollments });
  } catch (e) {
    res.status(500).json({ error: 'Failed to purge all chats' });
  }
});

module.exports = router;

// TEMP: promote a user to admin using a secret; remove after first use
router.post('/promote-admin', async (req, res) => {
  try {
    const secret = req.query.secret || req.body?.secret;
    if (!secret || secret !== process.env.SEED_SECRET) return res.status(403).json({ error: 'Forbidden' });
    const email = (req.query.email || req.body?.email || '').toString().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email required' });
    const u = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: { id: u._id, name: u.name, email: u.email, role: u.role } });
  } catch (e) { res.status(500).json({ error: 'Failed to promote' }); }
});

// Convenience GET variant for environments where POST is hard to trigger
router.get('/promote-admin', async (req, res) => {
  try {
    const secret = req.query.secret;
    if (!secret || secret !== process.env.SEED_SECRET) return res.status(403).json({ error: 'Forbidden' });
    const email = (req.query.email || '').toString().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email required' });
    const u = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: { id: u._id, name: u.name, email: u.email, role: u.role } });
  } catch (e) { res.status(500).json({ error: 'Failed to promote' }); }
});

// Scholar applications review
router.get('/scholar-applications', auth, requireRole('admin'), async (req, res) => {
  const apps = await Scholar.find({ approved: false }).populate('user', 'name email');
  res.json(apps);
});
router.post('/scholar-applications/:id/approve', auth, requireRole('admin'), async (req, res) => {
  const s = await Scholar.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
  if (!s) return res.status(404).json({ error: 'Not found' });
  try { await User.findByIdAndUpdate(s.user, { role: 'scholar' }); } catch {}
  res.json({ success: true, scholar: s });
});
router.post('/scholar-applications/:id/reject', auth, requireRole('admin'), async (req, res) => {
  const s = await Scholar.findById(req.params.id).populate('user', 'name');
  if (!s) return res.status(404).json({ error: 'Not found' });
  // Create an admin -> user chat session notifying rejection
  try {
    await ChatSession.create({ user: s.user._id, title: 'Admin Notice: Scholar Application (Rejected)', messages: [{ role: 'assistant', content: 'Your scholar application was rejected. Please review and resubmit with accurate details.' }], kind: 'direct' });
  } catch {}
  await Scholar.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Admin can open a new chat with any user (creates a direct session on the user's side)
router.post('/users/:id/message', auth, requireRole('admin'), async (req, res) => {
  try {
    const ChatSession = require('../models/ChatSession');
    const u = await User.findById(req.params.id).select('name');
    if (!u) return res.status(404).json({ error: 'User not found' });
    // Create session for the user
    const session = await ChatSession.create({ user: u._id, title: 'Admin', messages: [{ role: 'assistant', content: (req.body?.message || 'Message from admin') }], kind: 'direct' });
    // Also create an admin-side session for audit/visibility
    try {
      await ChatSession.create({ user: req.user._id, title: `Admin -> ${u.name}`, messages: [{ role: 'assistant', content: (req.body?.message || 'Message to user') }], kind: 'direct' });
    } catch {}
    res.json({ success: true, sessionId: session._id });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Set user role (admin only)
router.post('/users/set-role', auth, requireRole('admin'), async (req, res) => {
  try {
    const { email, role } = req.body || {};
    if (!email || !role) return res.status(400).json({ error: 'email and role required' });
    if (!['user','scholar','admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const u = await User.findOneAndUpdate({ email: String(email).toLowerCase() }, { role }, { new: true });
    if (!u) return res.status(404).json({ error: 'User not found' });
    return res.json({ success: true, user: { id: u._id, name: u.name, email: u.email, role: u.role } });
  } catch (e) { res.status(500).json({ error: 'Failed to set role' }); }
});

// Remove an existing scholar (does not delete the user)
router.delete('/scholars/:id', auth, requireRole('admin'), async (req, res) => {
  const s = await Scholar.findById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  await Scholar.findByIdAndDelete(req.params.id);
  try { await User.findByIdAndUpdate(s.user, { role: 'user' }); } catch {}
  res.json({ success: true });
});

// Remove scholar by user id
router.delete('/scholars/by-user/:userId', auth, requireRole('admin'), async (req, res) => {
  const s = await Scholar.findOneAndDelete({ user: req.params.userId });
  if (!s) return res.status(404).json({ error: 'Not found' });
  try { await User.findByIdAndUpdate(req.params.userId, { role: 'user' }); } catch {}
  res.json({ success: true });
});

// Danger: purge all scholars and reset roles of affected users to 'user' (except admins)
router.post('/scholars/purge-all', auth, requireRole('admin'), async (_req, res) => {
  try {
    const scholars = await Scholar.find().select('user');
    const userIds = scholars.map(s => s.user).filter(Boolean);
    await Scholar.deleteMany({});
    if (userIds.length) {
      await User.updateMany({ _id: { $in: userIds }, role: { $ne: 'admin' } }, { $set: { role: 'user' } });
    }
    res.json({ success: true, removed: scholars.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to purge scholars' });
  }
});


