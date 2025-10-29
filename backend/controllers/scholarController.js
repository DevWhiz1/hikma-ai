const Scholar = require('../models/Scholar');
const Enrollment = require('../models/Enrollment');
const ChatSession = require('../models/ChatSession');

async function applyScholar(req, res) {
  try {
    const exists = await Scholar.findOne({ user: req.user._id });
    if (exists) return res.status(400).json({ message: 'Already applied' });
    const {
      bio,
      specializations,
      languages,
      experienceYears,
      qualifications,
      demoVideoUrl,
      photoUrl
    } = req.body || {};

    function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }
    function isNonEmptyArray(a) { return Array.isArray(a) && a.filter(s => isNonEmptyString(s)).length > 0; }
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/i;

    if (!isNonEmptyString(bio)
      || !isNonEmptyArray(specializations)
      || !isNonEmptyArray(languages)
      || (typeof experienceYears !== 'number' || isNaN(experienceYears))
      || !isNonEmptyString(qualifications)
      || !isNonEmptyString(demoVideoUrl)
      || !isNonEmptyString(photoUrl)) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!ytRegex.test(String(demoVideoUrl))) {
      return res.status(400).json({ message: 'Demo video must be a valid YouTube URL' });
    }

    const scholar = await Scholar.create({
      user: req.user._id,
      bio: bio.trim(),
      specializations: specializations.map((s) => String(s).trim()).filter(Boolean),
      languages: languages.map((s) => String(s).trim()).filter(Boolean),
      experienceYears,
      qualifications: qualifications.trim(),
      demoVideoUrl: String(demoVideoUrl).trim(),
      photoUrl: String(photoUrl).trim(),
      approved: false
    });
    res.json({ success: true, scholar });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function listScholars(_req, res) {
  try {
    const scholars = await Scholar.find({ approved: true })
      .populate('user', 'name lockUntil _id')
      .select('user bio specializations languages experienceYears qualifications demoVideoUrl photoUrl approved averageRating totalReviews totalStudents totalSessions isActive isVerified country hourlyRate monthlyRate createdAt updatedAt');
    res.json(scholars);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function enrollScholar(req, res) {
  try {
    const { scholarId } = req.body;
    // Reuse existing inactive enrollment if present; otherwise create new
    let existing = await Enrollment.findOne({ student: req.user._id, scholar: scholarId });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        // Ensure sessions exist; if missing, create them
        if (!existing.studentSession || !existing.scholarSession) {
          const scholar = await Scholar.findById(scholarId).populate('user', 'name');
          if (!scholar) return res.status(404).json({ message: 'Scholar not found' });
          const studentSession = await ChatSession.create({
            user: req.user._id,
            title: `Chat with ${scholar.user.name || 'Scholar'} (Scholar)`,
            messages: [],
            kind: 'direct'
          });
          const scholarSession = await ChatSession.create({
            user: scholar.user._id,
            title: `Chat with ${req.user.name || 'Student'} (Student)`,
            messages: [],
            kind: 'direct'
          });
          existing.studentSession = studentSession._id;
          existing.scholarSession = scholarSession._id;
        }
        await existing.save();
        return res.json({ success: true, enrollment: existing, studentSessionId: existing.studentSession, scholarSessionId: existing.scholarSession });
      }
      return res.status(400).json({ message: 'Already enrolled' });
    }

    const scholar = await Scholar.findById(scholarId).populate('user', 'name');
    if (!scholar) return res.status(404).json({ message: 'Scholar not found' });

    // Create mirrored chat sessions for student and scholar with names
    const studentSession = await ChatSession.create({
      user: req.user._id,
      title: `Chat with ${scholar.user.name || 'Scholar'} (Scholar)`,
      messages: [],
      kind: 'direct'
    });
    const scholarSession = await ChatSession.create({
      user: scholar.user._id,
      title: `Chat with ${req.user.name || 'Student'} (Student)`,
      messages: [],
      kind: 'direct'
    });

    const enrollment = await Enrollment.create({
      student: req.user._id,
      scholar: scholarId,
      studentSession: studentSession._id,
      scholarSession: scholarSession._id
    });

    // Update user's enrolledScholars list with denormalized name for quick sidebar display
    try {
      const User = require('../models/User');
      const scholarName = scholar.user?.name || 'Scholar';
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { enrolledScholars: { scholar: scholarId, name: scholarName } }
      });
    } catch {}

    res.json({ success: true, enrollment, studentSessionId: studentSession._id, scholarSessionId: scholarSession._id });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function leaveFeedback(req, res) {
  try {
    const { scholarId, text, rating } = req.body;
    const enrollment = await Enrollment.findOne({ student: req.user._id, scholar: scholarId });
    if (!enrollment) return res.status(403).json({ message: 'Not enrolled' });
    enrollment.feedback.push({ text, rating, submittedBy: req.user._id });
    await enrollment.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

async function myEnrollments(req, res) {
  try {
    // Prefer denormalized list for performance if present
    const User = require('../models/User');
    const u = await User.findById(req.user._id).select('enrolledScholars').lean();
    if (u && Array.isArray(u.enrolledScholars) && u.enrolledScholars.length) {
      const mapped = u.enrolledScholars.map(es => ({ scholar: { _id: es.scholar, user: { name: es.name } } }));
      return res.json(mapped);
    }
    // Fallback to live lookup from enrollments
    const list = await Enrollment.find({ student: req.user._id })
      .populate({ path: 'scholar', populate: { path: 'user', select: 'name email _id' } })
      .select('scholar studentSession')
      .lean();
    // Backfill user's enrolledScholars for future fast loads
    try {
      const entries = list
        .filter(e => e?.scholar?._id && e?.scholar?.user?.name)
        .map(e => ({ scholar: e.scholar._id, name: e.scholar.user.name }));
      if (entries.length) {
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { enrolledScholars: { $each: entries } }
        });
      }
    } catch {}
    res.json(list);
  } catch (e) { res.status(500).json({ message: e.message }); }
}

async function unenroll(req, res) {
  try {
    const { scholarId } = req.body;
    const enr = await Enrollment.findOne({ student: req.user._id, scholar: scholarId });
    if (!enr) return res.status(404).json({ message: 'Not enrolled' });
    enr.isActive = false; // soft-unenroll; retain sessions
    await enr.save();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

async function getMyScholarProfile(req, res) {
  try {
    const s = await Scholar.findOne({ user: req.user._id });
    if (!s) return res.status(404).json({ message: 'Scholar profile not found' });
    res.json(s);
  } catch (e) { res.status(500).json({ message: e.message }); }
}

async function updateMyScholarProfile(req, res) {
  try {
    const s = await Scholar.findOne({ user: req.user._id });
    if (!s) return res.status(404).json({ message: 'Scholar profile not found' });
    if (!s.approved) return res.status(403).json({ message: 'Profile editing allowed after approval only' });

    const allowed = ['bio', 'specializations', 'languages', 'experienceYears', 'qualifications', 'demoVideoUrl', 'photoUrl'];
    const update = {};
    for (const k of allowed) {
      if (k in req.body) update[k] = req.body[k];
    }
    if ('demoVideoUrl' in update) {
      const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$/i;
      if (update.demoVideoUrl && !ytRegex.test(String(update.demoVideoUrl))) {
        return res.status(400).json({ message: 'Demo video must be a valid YouTube URL' });
      }
    }

    const saved = await Scholar.findByIdAndUpdate(s._id, update, { new: true });
    res.json({ success: true, scholar: saved });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

async function deleteMyScholarProfile(req, res) {
  try {
    const s = await Scholar.findOne({ user: req.user._id });
    if (!s) return res.status(404).json({ message: 'Scholar profile not found' });
    await Scholar.findByIdAndDelete(s._id);
    try {
      const User = require('../models/User');
      if (req.user.role === 'scholar') {
        await User.findByIdAndUpdate(req.user._id, { role: 'user' });
      }
    } catch {}
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

// Ensure a direct chat exists between the current user (student) and a scholar, and return the student's session id
async function startDirectChat(req, res) {
  try {
    const { scholarId } = req.body;
    if (!scholarId) return res.status(400).json({ message: 'scholarId required' });
    const Scholar = require('../models/Scholar');
    const Enrollment = require('../models/Enrollment');
    const ChatSession = require('../models/ChatSession');
    const scholarDoc = await Scholar.findById(scholarId).populate('user', 'name');
    if (!scholarDoc) return res.status(404).json({ message: 'Scholar not found' });

    // Guard against duplicates
    const dupCount = await Enrollment.countDocuments({ student: req.user._id, scholar: scholarDoc._id });
    if (dupCount > 1) {
      return res.status(409).json({ message: 'Too many chats exist for this scholar. Please contact support to clean up duplicates.' });
    }

    let enrollment = await Enrollment.findOne({ student: req.user._id, scholar: scholarDoc._id });
    if (!enrollment) {
      const studentSession = await ChatSession.create({ user: req.user._id, title: `Chat with ${scholarDoc.user?.name || 'Scholar'} (Scholar)`, messages: [], kind: 'direct' });
      const scholarSession = await ChatSession.create({ user: scholarDoc.user._id, title: `Chat with ${req.user.name || 'Student'} (Student)`, messages: [], kind: 'direct' });
      enrollment = await Enrollment.create({ student: req.user._id, scholar: scholarDoc._id, studentSession: studentSession._id, scholarSession: scholarSession._id });
      // Notify scholar that the student started a chat
      try {
        await ChatSession.findByIdAndUpdate(enrollment.scholarSession, {
          $push: { messages: { role: 'assistant', content: 'Student started a new chat with you.' } },
          $set: { lastActivity: new Date() }
        });
      } catch {}
    } else {
      // Reuse existing chat sessions - don't create new ones
      // Just update last activity to show it's been accessed
      try {
        await ChatSession.findByIdAndUpdate(enrollment.studentSession, {
          $set: { lastActivity: new Date() }
        });
        await ChatSession.findByIdAndUpdate(enrollment.scholarSession, {
          $set: { lastActivity: new Date() }
        });
      } catch {}
    }
    return res.json({ success: true, studentSessionId: enrollment.studentSession, scholarSessionId: enrollment.scholarSession });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

// 🚀 NEW: Get enrollments where current user is the SCHOLAR (for assignment creation)
async function getScholarEnrollments(req, res) {
  try {
    const Scholar = require('../models/Scholar');
    
    // Find the scholar document for this user
    const scholar = await Scholar.findOne({ user: req.user._id });
    if (!scholar) {
      return res.json({ enrollments: [] });
    }

    // Get all enrollments where this user is the scholar
    const enrollments = await Enrollment.find({ 
      scholar: scholar._id,
      isActive: true 
    })
      .populate('student', 'name email _id')
      .lean();

    res.json({ enrollments });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}

module.exports = { applyScholar, listScholars, enrollScholar, leaveFeedback, myEnrollments, unenroll, getMyScholarProfile, updateMyScholarProfile, deleteMyScholarProfile, startDirectChat, getScholarEnrollments };


