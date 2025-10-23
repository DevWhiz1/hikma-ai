const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getMeetingAnalytics,
  optimizeMeetingSchedule,
  getTopicSuggestions,
  resolveSchedulingConflict,
  generateMeetingTemplates,
  getPrayerTimeAwareSchedule,
  setupSmartReminders,
  bookMeetingWithAI,
  getMeetingInsights
} = require('../controllers/enhancedMeetingController');

const router = express.Router();

// Get comprehensive meeting analytics
router.get('/analytics', auth, getMeetingAnalytics);

// AI-powered meeting schedule optimization
router.post('/optimize-schedule', auth, optimizeMeetingSchedule);

// Get AI-powered topic suggestions
router.post('/topic-suggestions', auth, getTopicSuggestions);

// Resolve scheduling conflicts with AI assistance
router.post('/resolve-conflict', auth, resolveSchedulingConflict);

// Generate meeting templates based on scholar expertise
router.post('/generate-templates', auth, generateMeetingTemplates);

// Get prayer time aware scheduling recommendations
router.post('/prayer-time-schedule', auth, getPrayerTimeAwareSchedule);

// Setup intelligent meeting reminders
router.post('/setup-reminders', auth, setupSmartReminders);

// Book meeting with AI assistance
router.post('/book-with-ai', auth, bookMeetingWithAI);

// Get meeting effectiveness insights
router.get('/insights', auth, getMeetingInsights);

module.exports = router;
