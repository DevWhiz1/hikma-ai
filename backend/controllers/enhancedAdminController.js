const User = require('../models/User');
const Scholar = require('../models/Scholar');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const Feedback = require('../models/Feedback');
const SensitiveLog = require('../models/SensitiveLog');

// Get all scholars with enhanced details
const getAllScholars = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, country, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (status) query.approved = status === 'approved';
    if (country) query.country = country;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const scholars = await Scholar.find(query)
      .populate('user', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Scholar.countDocuments(query);

    // Get analytics for each scholar
    const scholarsWithAnalytics = await Promise.all(
      scholars.map(async (scholar) => {
        const payments = await Payment.find({ scholar: scholar._id, status: 'completed' });
        const subscriptions = await Subscription.find({ scholar: scholar._id, status: 'active' });
        const feedback = await Feedback.find({ scholar: scholar._id });

        const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const activeSubscriptions = subscriptions.length;
        const averageRating = feedback.length > 0 
          ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
          : 0;

        return {
          ...scholar.toObject(),
          analytics: {
            totalEarnings,
            activeSubscriptions,
            averageRating: Math.round(averageRating * 10) / 10,
            totalSessions: payments.length
          }
        };
      })
    );

    res.json({
      success: true,
      scholars: scholarsWithAnalytics,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching scholars:', error);
    res.status(500).json({ error: 'Failed to fetch scholars' });
  }
};

// Get scholar details
const getScholarDetails = async (req, res) => {
  try {
    const { scholarId } = req.params;

    const scholar = await Scholar.findById(scholarId)
      .populate('user', 'name email createdAt');

    if (!scholar) {
      return res.status(404).json({ error: 'Scholar not found' });
    }

    // Get comprehensive analytics
    const payments = await Payment.find({ scholar: scholarId });
    const subscriptions = await Subscription.find({ scholar: scholarId });
    const feedback = await Feedback.find({ scholar: scholarId });

    const analytics = {
      totalEarnings: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
      totalSessions: payments.filter(p => p.paymentType === 'session').length,
      activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
      totalStudents: new Set(payments.map(p => p.user.toString())).size,
      averageRating: feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
        : 0,
      monthlyEarnings: payments
        .filter(p => p.status === 'completed' && p.createdAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, p) => sum + p.amount, 0)
    };

    res.json({
      success: true,
      scholar: {
        ...scholar.toObject(),
        analytics
      }
    });
  } catch (error) {
    console.error('Error fetching scholar details:', error);
    res.status(500).json({ error: 'Failed to fetch scholar details' });
  }
};

// Update scholar status
const updateScholarStatus = async (req, res) => {
  try {
    const { scholarId } = req.params;
    const { approved, isActive, isVerified } = req.body;

    const scholar = await Scholar.findById(scholarId);
    if (!scholar) {
      return res.status(404).json({ error: 'Scholar not found' });
    }

    if (approved !== undefined) scholar.approved = approved;
    if (isActive !== undefined) scholar.isActive = isActive;
    if (isVerified !== undefined) scholar.isVerified = isVerified;

    await scholar.save();

    // Update user role if approved
    if (approved) {
      await User.findByIdAndUpdate(scholar.user, { role: 'scholar' });
    }

    res.json({
      success: true,
      scholar
    });
  } catch (error) {
    console.error('Error updating scholar status:', error);
    res.status(500).json({ error: 'Failed to update scholar status' });
  }
};

// Remove scholar
const removeScholar = async (req, res) => {
  try {
    const { scholarId } = req.params;
    const { reason } = req.body;

    const scholar = await Scholar.findById(scholarId);
    if (!scholar) {
      return res.status(404).json({ error: 'Scholar not found' });
    }

    // Update user role back to user
    await User.findByIdAndUpdate(scholar.user, { role: 'user' });

    // Cancel all active subscriptions
    await Subscription.updateMany(
      { scholar: scholarId, status: 'active' },
      { status: 'cancelled', cancellationReason: reason, cancelledAt: new Date() }
    );

    // Delete scholar profile
    await Scholar.findByIdAndDelete(scholarId);

    res.json({
      success: true,
      message: 'Scholar removed successfully'
    });
  } catch (error) {
    console.error('Error removing scholar:', error);
    res.status(500).json({ error: 'Failed to remove scholar' });
  }
};

// Get payment analytics
const getPaymentAnalytics = async (req, res) => {
  try {
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
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          completedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          failedTransactions: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get top earning scholars
    const topScholars = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$scholar',
          totalEarnings: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'scholars',
          localField: '_id',
          foreignField: '_id',
          as: 'scholar'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'scholar.user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $sort: { totalEarnings: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      analytics: analytics[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        completedTransactions: 0,
        pendingTransactions: 0,
        failedTransactions: 0
      },
      topScholars
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ error: 'Failed to fetch payment analytics' });
  }
};

// Get subscription analytics
const getSubscriptionAnalytics = async (req, res) => {
  try {
    const analytics = await Subscription.aggregate([
      {
        $group: {
          _id: null,
          totalSubscriptions: { $sum: 1 },
          activeSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          cancelledSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, '$amount', 0] }
          }
        }
      }
    ]);

    // Get subscription trends by plan
    const planAnalytics = await Subscription.aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, '$amount', 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      analytics: analytics[0] || {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        cancelledSubscriptions: 0,
        totalRevenue: 0
      },
      planAnalytics
    });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({ error: 'Failed to fetch subscription analytics' });
  }
};

// Get platform overview
const getPlatformOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalScholars,
      totalPayments,
      totalSubscriptions,
      recentUsers,
      recentScholars,
      recentPayments
    ] = await Promise.all([
      User.countDocuments(),
      Scholar.countDocuments({ approved: true }),
      Payment.countDocuments({ status: 'completed' }),
      Subscription.countDocuments({ status: 'active' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
      Scholar.find({ approved: true }).populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
      Payment.find({ status: 'completed' }).populate('user', 'name').populate('scholar', 'user').populate('scholar.user', 'name').sort({ createdAt: -1 }).limit(5)
    ]);

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      overview: {
        totalUsers,
        totalScholars,
        totalPayments,
        totalSubscriptions,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentUsers,
        recentScholars,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Error fetching platform overview:', error);
    res.status(500).json({ error: 'Failed to fetch platform overview' });
  }
};

module.exports = {
  getAllScholars,
  getScholarDetails,
  updateScholarStatus,
  removeScholar,
  getPaymentAnalytics,
  getSubscriptionAnalytics,
  getPlatformOverview
};
