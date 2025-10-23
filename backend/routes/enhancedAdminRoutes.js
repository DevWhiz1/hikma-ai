const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllScholars,
  getScholarDetails,
  updateScholarStatus,
  removeScholar,
  getPaymentAnalytics,
  getSubscriptionAnalytics,
  getPlatformOverview
} = require('../controllers/enhancedAdminController');

// Enhanced admin routes
router.get('/scholars', authenticateToken, requireAdmin, getAllScholars);
router.get('/scholars/:scholarId', authenticateToken, requireAdmin, getScholarDetails);
router.put('/scholars/:scholarId/status', authenticateToken, requireAdmin, updateScholarStatus);
router.delete('/scholars/:scholarId', authenticateToken, requireAdmin, removeScholar);

// Analytics routes
router.get('/analytics/payments', authenticateToken, requireAdmin, getPaymentAnalytics);
router.get('/analytics/subscriptions', authenticateToken, requireAdmin, getSubscriptionAnalytics);
router.get('/overview', authenticateToken, requireAdmin, getPlatformOverview);

module.exports = router;
