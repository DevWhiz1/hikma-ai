// Purge all direct student-scholar chats by deleting Enrollments and their linked ChatSessions
// Usage: node scripts/purge_direct_chats.js

const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');

(async () => {
  try {
    await connectDB();
    const Enrollment = require('../models/Enrollment');
    const ChatSession = require('../models/ChatSession');

    const enrollments = await Enrollment.find({}).select('studentSession scholarSession');
    const sessionIds = [];
    enrollments.forEach((e) => {
      if (e.studentSession) sessionIds.push(e.studentSession);
      if (e.scholarSession) sessionIds.push(e.scholarSession);
    });

    if (sessionIds.length) {
      const del = await ChatSession.deleteMany({ _id: { $in: sessionIds } });
      console.log(`Deleted direct ChatSessions: ${del?.deletedCount || 0}`);
    } else {
      console.log('No direct ChatSessions found to delete.');
    }

    const delEnr = await Enrollment.deleteMany({});
    console.log(`Deleted Enrollments: ${delEnr?.deletedCount || 0}`);

    console.log('Purge complete.');
    process.exit(0);
  } catch (e) {
    console.error('Purge failed:', e?.message || e);
    process.exit(1);
  }
})();


