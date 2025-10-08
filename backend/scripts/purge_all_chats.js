// Purge ALL chats: AI ChatSession, direct Enrollment-linked sessions, and meeting Chat/Message/Meeting
// Usage: node scripts/purge_all_chats.js

const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/db');

(async () => {
  try {
    await connectDB();

    let removedSessions = 0;
    let removedEnrollments = 0;
    let removedMeetChats = 0;
    let removedMeetMessages = 0;
    let removedMeetMeetings = 0;

    try {
      const ChatSession = require('../models/ChatSession');
      removedSessions = await ChatSession.countDocuments({});
      await ChatSession.deleteMany({});
      console.log(`Deleted ChatSessions: ${removedSessions}`);
    } catch (e) {
      console.warn('ChatSession purge skipped:', e?.message || e);
    }

    try {
      const Enrollment = require('../models/Enrollment');
      removedEnrollments = await Enrollment.countDocuments({});
      await Enrollment.deleteMany({});
      console.log(`Deleted Enrollments: ${removedEnrollments}`);
    } catch (e) {
      console.warn('Enrollment purge skipped:', e?.message || e);
    }

    try {
      const Chat = require('../models/Chat');
      removedMeetChats = await Chat.countDocuments({});
      await Chat.deleteMany({});
      console.log(`Deleted Meeting Chats: ${removedMeetChats}`);
    } catch (e) {
      console.warn('Meeting Chat purge skipped:', e?.message || e);
    }

    try {
      const Message = require('../models/Message');
      removedMeetMessages = await Message.countDocuments({});
      await Message.deleteMany({});
      console.log(`Deleted Meeting Messages: ${removedMeetMessages}`);
    } catch (e) {
      console.warn('Meeting Message purge skipped:', e?.message || e);
    }

    try {
      const Meeting = require('../models/Meeting');
      removedMeetMeetings = await Meeting.countDocuments({});
      await Meeting.deleteMany({});
      console.log(`Deleted Meeting records: ${removedMeetMeetings}`);
    } catch (e) {
      console.warn('Meeting records purge skipped:', e?.message || e);
    }

    console.log('Full purge complete.');
    process.exit(0);
  } catch (e) {
    console.error('Full purge failed:', e?.message || e);
    process.exit(1);
  }
})();


