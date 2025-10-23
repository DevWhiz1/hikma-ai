const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createPayment,
  getUserPayments,
  getScholarPayments,
  updatePaymentStatus,
  getPaymentAnalytics,
  getSubscriptions,
  cancelSubscription
} = require('../controllers/paymentController');

// Payment routes
router.post('/', authenticateToken, createPayment);
router.get('/user', authenticateToken, getUserPayments);
router.get('/scholar', authenticateToken, getScholarPayments);
router.put('/:paymentId/status', authenticateToken, updatePaymentStatus);
router.get('/analytics', authenticateToken, getPaymentAnalytics);

// Subscription routes
router.get('/subscriptions', authenticateToken, getSubscriptions);
router.put('/subscriptions/:subscriptionId/cancel', authenticateToken, cancelSubscription);

module.exports = router;
