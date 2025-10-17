const express = require('express');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const {
  submitFeedback,
  getUserFeedback,
  getFeedbackDetails,
  getAllFeedback,
  updateFeedbackStatus,
  getScholarFeedback,
  updateScholarFeedbackStatus
} = require('../controllers/feedbackController');

const router = express.Router();

// User routes
router.post('/submit', auth, submitFeedback);
router.get('/my-feedback', auth, getUserFeedback);
router.get('/my-feedback/:id', auth, getFeedbackDetails);

// Admin routes
router.get('/admin/all', auth, requireRole('admin'), getAllFeedback);
router.put('/admin/:id/status', auth, requireRole('admin'), updateFeedbackStatus);

// Scholar routes
router.get('/scholar/all', auth, requireRole('scholar'), getScholarFeedback);
router.put('/scholar/:id/status', auth, requireRole('scholar'), updateScholarFeedbackStatus);

module.exports = router;
