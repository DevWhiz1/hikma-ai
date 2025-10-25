const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getOptimalTimes,
  scheduleSmartMeeting,
  broadcastMeetingTimes,
  handleStudentRescheduleRequest,
  getScholarUpcomingMeetings,
  getStudentUpcomingMeetings,
  getScholarAvailability,
  autoScheduleMeetings,
  bookBroadcastMeeting,
  getAvailableBroadcasts,
  getScholarBroadcasts,
  cancelBroadcastMeeting,
  validateMeetingAccess
} = require('../controllers/smartSchedulerController');

const router = express.Router();

// Get optimal meeting times for a scholar
router.get('/optimal-times', auth, getOptimalTimes);

// Schedule a meeting using smart scheduler
router.post('/schedule-meeting', auth, scheduleSmartMeeting);

// Broadcast meeting times to all enrolled students
router.post('/broadcast-times', auth, broadcastMeetingTimes);

// Handle student reschedule request
router.post('/reschedule-request', auth, handleStudentRescheduleRequest);

// Get scholar's upcoming meetings
router.get('/scholar/upcoming', auth, getScholarUpcomingMeetings);

// Get student's upcoming meetings
router.get('/student/upcoming', auth, getStudentUpcomingMeetings);

// Get scholar's availability for a date range
router.get('/availability', auth, getScholarAvailability);

// Auto-schedule meetings based on student requests
router.post('/auto-schedule', auth, autoScheduleMeetings);

// Book a meeting from broadcast
router.post('/book-broadcast', auth, bookBroadcastMeeting);

// Get available broadcast meetings for a student
router.get('/available-broadcasts', auth, getAvailableBroadcasts);

// Get scholar's broadcast meetings
router.get('/scholar/broadcasts', auth, getScholarBroadcasts);

// Cancel a broadcast meeting
router.post('/cancel-broadcast', auth, cancelBroadcastMeeting);

// Validate meeting access based on time
router.get('/meeting/:meetingId/access', auth, validateMeetingAccess);

module.exports = router;
