const express = require('express');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const {
  submitScholarFeedback,
  getUserScholarFeedback,
  getScholarFeedbackDetails,
  getScholarReceivedFeedback,
  updateScholarFeedbackStatus
} = require('../controllers/scholarFeedbackController');

const router = express.Router();

// User routes - submit feedback for a scholar
router.post('/submit', auth, submitScholarFeedback);
router.get('/my-feedback', auth, getUserScholarFeedback);
router.get('/my-feedback/:id', auth, getScholarFeedbackDetails);

// Scholar routes - manage feedback received about them
router.get('/received', auth, requireRole('scholar'), getScholarReceivedFeedback);
router.put('/received/:id/status', auth, requireRole('scholar'), updateScholarFeedbackStatus);

module.exports = router;
