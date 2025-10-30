const express = require('express');
const { auth } = require('../middleware/auth');
const aiAgentController = require('../controllers/aiAgentController');

const router = express.Router();

// Parse natural language scheduling intent
router.post('/parse-intent', auth, (req, res) => aiAgentController.parseIntent(req, res));

// Generate AI-powered time suggestions
router.post('/generate-suggestions', auth, (req, res) => aiAgentController.generateSuggestions(req, res));

// Get booking insights and analytics
router.get('/insights/:scholarId', auth, (req, res) => aiAgentController.getInsights(req, res));

// Resolve scheduling conflicts intelligently
router.post('/resolve-conflicts', auth, (req, res) => aiAgentController.resolveConflicts(req, res));

// Get personalized recommendations
router.post('/personalized-recommendations', auth, (req, res) => aiAgentController.getPersonalizedRecommendations(req, res));

// Get optimal notification timing
router.post('/notification-timing', auth, (req, res) => aiAgentController.getNotificationTiming(req, res));

module.exports = router;
