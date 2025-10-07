const express = require('express');
const { auth } = require('../middleware/auth');
const { 
  requestMeeting, 
  scheduleMeeting, 
  getChatMessages, 
  getUserChats, 
  sendMessage,
  getScholarDashboard,
  requestReschedule,
  respondReschedule,
  cancelMeeting
} = require('../controllers/meetingController');

const router = express.Router();

// Request a meeting with a scholar
router.post('/request-meeting', auth, requestMeeting);

// Schedule a meeting (scholar only)
router.post('/schedule-meeting', auth, scheduleMeeting);

// Get chat messages
router.get('/:chatId', auth, getChatMessages);

// Get user's chats
router.get('/', auth, getUserChats);

// Send a message
router.post('/send-message', auth, sendMessage);

// Reschedule request
router.post('/request-reschedule', auth, requestReschedule);
// Reschedule response (scholar)
router.post('/respond-reschedule', auth, respondReschedule);
// Cancel meeting (scholar)
router.post('/cancel-meeting', auth, cancelMeeting);

// Scholar dashboard data
router.get('/scholar/dashboard', auth, getScholarDashboard);

module.exports = router;
