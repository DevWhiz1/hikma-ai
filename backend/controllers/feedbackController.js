const Feedback = require('../models/Feedback');
const User = require('../models/User');

// Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { rating, category, subject, message, contactEmail, priority } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!rating || !category || !subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: rating, category, subject, and message are required' 
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }

    // Validate category
    const validCategories = ['bug', 'feature', 'ui', 'performance', 'security', 'general'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category' 
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ 
        error: 'Invalid priority' 
      });
    }

    // Create feedback
    const feedback = new Feedback({
      user: userId,
      rating,
      category,
      subject,
      message,
      contactEmail: contactEmail || undefined,
      priority: priority || 'medium'
    });

    await feedback.save();

    // Populate user info for response
    await feedback.populate('user', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback._id,
        rating: feedback.rating,
        category: feedback.category,
        subject: feedback.subject,
        priority: feedback.priority,
        status: feedback.status,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      error: 'Failed to submit feedback' 
    });
  }
};

// Get user's feedback history
const getUserFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status, category } = req.query;

    // Build query - exclude scholar feedback copies
    const query = { 
      user: userId,
      subject: { $not: /^Scholar Feedback:/ } // Exclude scholar feedback copies
    };
    if (status) query.status = status;
    if (category) query.category = category;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get feedback with pagination
    const feedback = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-message -adminNotes') // Exclude sensitive fields
      .lean();

    // Get total count
    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      feedback,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({ 
      error: 'Failed to fetch feedback' 
    });
  }
};

// Get feedback details (for the user who submitted it)
const getFeedbackDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const feedback = await Feedback.findOne({ _id: id, user: userId })
      .populate('user', 'name email role')
      .lean();

    if (!feedback) {
      return res.status(404).json({ 
        error: 'Feedback not found' 
      });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Error fetching feedback details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch feedback details' 
    });
  }
};

// Admin: Get all feedback
const getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, priority } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get feedback with pagination
    const feedback = await Feedback.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Feedback.countDocuments(query);

    // Get statistics
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          byStatus: {
            $push: {
              status: '$status',
              category: '$category',
              priority: '$priority'
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      feedback,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || { totalFeedback: 0, averageRating: 0, byStatus: [] }
    });
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({ 
      error: 'Failed to fetch feedback' 
    });
  }
};

// Admin: Update feedback status
const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status' 
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user', 'name email role');

    if (!feedback) {
      return res.status(404).json({ 
        error: 'Feedback not found' 
      });
    }

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ 
      error: 'Failed to update feedback' 
    });
  }
};

// Scholar: Get feedback related to their teaching
const getScholarFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, priority } = req.query;

    // Build query - scholars can see all feedback (similar to admin but with scholar context)
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get feedback with pagination
    const feedback = await Feedback.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      feedback,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching scholar feedback:', error);
    res.status(500).json({ 
      error: 'Failed to fetch feedback' 
    });
  }
};

// Scholar: Update feedback status
const updateScholarFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scholarNotes } = req.body;

    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status' 
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (scholarNotes !== undefined) updateData.scholarNotes = scholarNotes;

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user', 'name email role');

    if (!feedback) {
      return res.status(404).json({ 
        error: 'Feedback not found' 
      });
    }

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ 
      error: 'Failed to update feedback' 
    });
  }
};

module.exports = {
  submitFeedback,
  getUserFeedback,
  getFeedbackDetails,
  getAllFeedback,
  updateFeedbackStatus,
  getScholarFeedback,
  updateScholarFeedbackStatus
};
