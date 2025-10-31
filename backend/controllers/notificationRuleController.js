const NotificationRule = require('../models/NotificationRule');
const Scholar = require('../models/Scholar');
const Enrollment = require('../models/Enrollment');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ChatSession = require('../models/ChatSession');
const { emitNewMessage, emitNotification } = require('../utils/socketEmitter');

function parseTimeOfDay(timeStr) {
  if (!timeStr) return { h: 9, m: 0 };
  const [h, m] = String(timeStr).split(':').map(n => Number(n));
  return { h: Number.isFinite(h) ? h : 9, m: Number.isFinite(m) ? m : 0 };
}

async function ensureChat(studentUserId, scholarUserId) {
  let chat = await Chat.findOne({ studentId: studentUserId, scholarId: scholarUserId });
  if (!chat) chat = await Chat.create({ studentId: studentUserId, scholarId: scholarUserId, messages: [] });
  return chat;
}

async function mirrorToHikmaChat(studentUserId, scholarUserId, text) {
  try {
    const scholarProfile = await Scholar.findOne({ user: scholarUserId }).select('_id user');
    if (!scholarProfile) return;
    const enrollment = await Enrollment.findOne({ student: studentUserId, scholar: scholarProfile._id }).lean();
    if (!enrollment || (!enrollment.studentSession && !enrollment.scholarSession)) return;
    const ops = [];
    if (enrollment.studentSession) {
      ops.push(ChatSession.findByIdAndUpdate(enrollment.studentSession, {
        $push: { messages: { role: 'assistant', content: text } },
        $set: { lastActivity: new Date() }
      }));
    }
    if (enrollment.scholarSession) {
      ops.push(ChatSession.findByIdAndUpdate(enrollment.scholarSession, {
        $push: { messages: { role: 'assistant', content: text } },
        $set: { lastActivity: new Date() }
      }));
    }
    await Promise.all(ops);
  } catch {}
}

// CRUD
async function listRules(req, res) {
  const rules = await NotificationRule.find({ scholarUserId: req.user._id }).sort({ updatedAt: -1 });
  res.json({ rules });
}

async function createRule(req, res) {
  const body = req.body || {};
  const rule = await NotificationRule.create({ ...body, scholarUserId: req.user._id });
  res.status(201).json({ rule });
}

async function updateRule(req, res) {
  const { id } = req.params;
  const body = req.body || {};
  const rule = await NotificationRule.findOneAndUpdate({ _id: id, scholarUserId: req.user._id }, body, { new: true });
  if (!rule) return res.status(404).json({ error: 'Rule not found' });
  res.json({ rule });
}

async function deleteRule(req, res) {
  const { id } = req.params;
  await NotificationRule.deleteOne({ _id: id, scholarUserId: req.user._id });
  res.json({ success: true });
}

function isRuleDue(rule, now = new Date()) {
  if (!rule.isActive) return false;
  const { h, m } = parseTimeOfDay(rule.timeOfDay);
  const sameTime = now.getHours() === h && now.getMinutes() === m;
  if (!sameTime) return false;
  if (rule.trigger === 'daily') return true;
  if (rule.trigger === 'weekly') return Array.isArray(rule.daysOfWeek) && rule.daysOfWeek.includes(now.getDay());
  if (rule.trigger === 'monthly') return Number(rule.dayOfMonth) === now.getDate();
  return false;
}

async function runRule(rule) {
  const scholarUserId = rule.scholarUserId;
  let targets = [];
  if (rule.audience === 'all') {
    const scholarDoc = await Scholar.findOne({ user: scholarUserId }).select('_id');
    if (!scholarDoc) return { sent: 0 };
    const enrollments = await Enrollment.find({ scholar: scholarDoc._id, isActive: true }).select('student');
    targets = enrollments.map(e => e.student);
  } else {
    targets = rule.studentIds || [];
  }

  let sent = 0;
  for (const studentId of targets) {
    try {
      const chat = await ensureChat(studentId, scholarUserId);
      const msg = await Message.create({ sender: scholarUserId, chatId: chat._id, text: rule.messageTemplate, type: 'text', timestamp: new Date() });
      chat.messages.push(msg._id);
      chat.lastActivity = new Date();
      await chat.save();
      emitNewMessage(String(chat._id), { text: msg.text, senderId: String(scholarUserId), timestamp: msg.timestamp });
      emitNotification(String(studentId), { type: 'chat_message', text: msg.text, chatId: String(chat._id), from: String(scholarUserId), createdAt: msg.timestamp });
      await mirrorToHikmaChat(studentId, scholarUserId, msg.text);
      sent += 1;
    } catch {}
  }
  await NotificationRule.findByIdAndUpdate(rule._id, { lastRunAt: new Date() });
  return { sent };
}

async function runDueRules(req, res) {
  const now = new Date();
  const rules = await NotificationRule.find({ scholarUserId: req.user._id, isActive: true });
  const due = rules.filter(r => isRuleDue(r, now));
  const results = [];
  for (const r of due) {
    results.push(await runRule(r));
  }
  res.json({ success: true, processed: due.length, results });
}

// Admin/utility: run all my rules regardless of schedule
async function runAllNow(req, res) {
  const rules = await NotificationRule.find({ scholarUserId: req.user._id, isActive: true });
  const results = [];
  for (const r of rules) results.push(await runRule(r));
  res.json({ success: true, processed: rules.length, results });
}

module.exports = { listRules, createRule, updateRule, deleteRule, runDueRules, runAllNow };


