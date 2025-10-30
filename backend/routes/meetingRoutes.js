const express = require('express');
const { auth } = require('../middleware/auth');
const { 
  requestMeeting, 
  scheduleMeeting, 
  getChatMessages, 
  getUserChats, 
  sendMessage,
  getScholarDashboard,
  getUserScheduledMeetings,
  requestReschedule,
  respondReschedule,
  cancelMeeting
} = require('../controllers/meetingController');

const router = express.Router();

// GET routes - specific routes BEFORE parameterized routes
// Scholar dashboard data
router.get('/scholar/dashboard', auth, getScholarDashboard);

// Get user's scheduled meetings
router.get('/user/scheduled', auth, getUserScheduledMeetings);

// Get user's chats
router.get('/', auth, getUserChats);

// Get chat messages (parameterized - must come last among GET routes)
router.get('/:chatId', auth, getChatMessages);

// POST routes - specific routes BEFORE parameterized routes
// Request a meeting with a scholar
router.post('/request-meeting', auth, requestMeeting);

// Schedule a meeting (scholar only)
router.post('/schedule-meeting', auth, scheduleMeeting);

// Send a message
router.post('/send-message', auth, sendMessage);

// Reschedule request
router.post('/request-reschedule', auth, requestReschedule);

// Reschedule response (scholar)
router.post('/respond-reschedule', auth, respondReschedule);

// Cancel meeting (scholar)
router.post('/cancel-meeting', auth, cancelMeeting);

module.exports = router;
