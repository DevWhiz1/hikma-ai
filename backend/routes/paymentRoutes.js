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
  cancelSubscription,
  createStripePaymentIntent,
  confirmStripePayment,
  handleStripeWebhook
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

// Stripe payment routes
router.post('/stripe/create-intent', authenticateToken, createStripePaymentIntent);
router.post('/stripe/confirm', authenticateToken, confirmStripePayment);
router.post('/stripe/webhook', handleStripeWebhook);

module.exports = router;
