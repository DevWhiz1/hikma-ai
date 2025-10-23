const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const Scholar = require('../models/Scholar');
const User = require('../models/User');
const Meeting = require('../models/Meeting');

// Create a new payment
const createPayment = async (req, res) => {
  try {
    const { scholarId, amount, paymentType, paymentMethod, description, sessionId, subscriptionId } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!scholarId || !amount || !paymentType || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if scholar exists and is approved
    const scholar = await Scholar.findById(scholarId).populate('user');
    if (!scholar || !scholar.approved) {
      return res.status(404).json({ error: 'Scholar not found or not approved' });
    }

    // Generate transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payment = new Payment({
      user: userId,
      scholar: scholarId,
      amount,
      paymentType,
      paymentMethod,
      transactionId,
      description,
      sessionId,
      subscriptionId,
      status: 'pending'
    });

    await payment.save();

    // If it's a subscription payment, create subscription
    if (paymentType === 'subscription' && subscriptionId) {
      const subscription = new Subscription({
        user: userId,
        scholar: scholarId,
        plan: 'basic', // Default plan
        amount,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentMethod,
        paymentId: transactionId
      });

      await subscription.save();
    }

    res.status(201).json({
      success: true,
      payment: {
        id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

// Get user payments
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, paymentType } = req.query;

    const query = { user: userId };
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;

    const payments = await Payment.find(query)
      .populate('scholar', 'user photoUrl specializations')
      .populate('scholar.user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

// Get scholar payments
const getScholarPayments = async (req, res) => {
  try {
    const scholarId = req.user.scholarId;
    const { page = 1, limit = 10, status, paymentType } = req.query;

    const query = { scholar: scholarId };
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;

    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching scholar payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, transactionId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = status;
    if (transactionId) payment.transactionId = transactionId;
    await payment.save();

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
};

// Get payment analytics
const getPaymentAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    let startDate;
    const now = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const analytics = await Payment.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: analytics[0] || {
        totalAmount: 0,
        totalPayments: 0,
        completedPayments: 0,
        pendingPayments: 0
      }
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ error: 'Failed to fetch payment analytics' });
  }
};

// Get subscriptions
const getSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { user: userId };
    if (status) query.status = status;

    const subscriptions = await Subscription.find(query)
      .populate('scholar', 'user photoUrl specializations')
      .populate('scholar.user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    subscription.status = 'cancelled';
    subscription.cancellationReason = reason;
    subscription.cancelledAt = new Date();
    await subscription.save();

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

module.exports = {
  createPayment,
  getUserPayments,
  getScholarPayments,
  updatePaymentStatus,
  getPaymentAnalytics,
  getSubscriptions,
  cancelSubscription
};
