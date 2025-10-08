const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
// Removed Google Meet link generation and encryption
const Enrollment = require('../models/Enrollment');
const ChatSession = require('../models/ChatSession');

const router = express.Router();

router.post('/create', auth, async (req, res) => {
  try {
    const { scholarId, studentId, topic } = req.body;
    const scholar = await User.findById(scholarId);
    const student = await User.findById(studentId);
    if (!scholar || !student) return res.status(404).json({ message: 'User not found' });

    // Scholar will generate and paste their Meet link; we do not create one here

    // Ensure enrollment and sessions exist; then post the meet link into both chats
    let enrollment = null;
    try {
      const Scholar = require('../models/Scholar');
      let scholarDoc = await Scholar.findOne({ user: scholarId }).populate('user', 'name');
      if (!scholarDoc) {
        // Auto-create a minimal scholar profile to allow enrollment
        scholarDoc = await Scholar.create({ user: scholarId, approved: true, bio: '', specializations: [], languages: [] });
        scholarDoc = await Scholar.findById(scholarDoc._id).populate('user', 'name');
      }
      enrollment = scholarDoc ? await Enrollment.findOne({ student: studentId, scholar: scholarDoc._id }) : null;
      if (!enrollment && scholarDoc) {
        // Create sessions and enrollment
        const studentSession = await ChatSession.create({ user: studentId, title: `Chat with ${scholar.name || 'Scholar'} (Scholar)`, messages: [], kind: 'direct' });
        const scholarSession = await ChatSession.create({ user: scholarId, title: `Chat with ${student.name || 'Student'} (Student)`, messages: [], kind: 'direct' });
        enrollment = await Enrollment.create({ student: studentId, scholar: scholarDoc._id, studentSession: studentSession._id, scholarSession: scholarSession._id });
      }

      const studentNote = `Meeting requested for topic: ${topic}. The scholar will share a Google Meet code/link here shortly.`;
      const scholarNote = `Student requested a meeting for topic: ${topic}. Please provide the student with your Google Meet code/link in this chat.`;
      if (enrollment?.studentSession) {
        await ChatSession.findByIdAndUpdate(enrollment.studentSession, {
          $push: { messages: { role: 'assistant', content: studentNote } },
          $set: { lastActivity: new Date() }
        });
      }
      if (enrollment?.scholarSession) {
        await ChatSession.findByIdAndUpdate(enrollment.scholarSession, {
          $push: { messages: { role: 'assistant', content: scholarNote } },
          $set: { lastActivity: new Date() }
        });
      }
    } catch {}

    res.json({ studentSessionId: enrollment?.studentSession, scholarSessionId: enrollment?.scholarSession });
  } catch (e) {
    // Fail-soft to avoid breaking UX; frontend will navigate to chat if possible
    try { console.error('MEET_CREATE_ERROR', e?.message); } catch {}
    res.json({ studentSessionId: null, scholarSessionId: null });
  }
});

module.exports = router;


