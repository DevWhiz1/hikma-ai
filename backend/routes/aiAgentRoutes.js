const express = require('express');
const { auth } = require('../middleware/auth');
const aiAgentController = require('../controllers/aiAgentController');

const router = express.Router();

// Parse natural language scheduling intent
router.post('/parse-intent', auth, aiAgentController.parseIntent);

// Generate AI-powered time suggestions
router.post('/generate-suggestions', auth, aiAgentController.generateSuggestions);

// Get booking insights and analytics
router.get('/insights/:scholarId', auth, aiAgentController.getInsights);

// Resolve scheduling conflicts intelligently
router.post('/resolve-conflicts', auth, aiAgentController.resolveConflicts);

// Get personalized recommendations
router.post('/personalized-recommendations', auth, aiAgentController.getPersonalizedRecommendations);

// Get optimal notification timing
router.post('/notification-timing', auth, aiAgentController.getNotificationTiming);

module.exports = router;
