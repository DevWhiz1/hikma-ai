const ScholarFeedback = require('../models/ScholarFeedback');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// Submit feedback for a scholar
const submitScholarFeedback = async (req, res) => {
  try {
    const { scholarId, rating, category, subject, message, contactEmail, priority } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!scholarId || !rating || !category || !subject || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: scholarId, rating, category, subject, and message are required' 
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }

    // Validate category
    const validCategories = ['teaching_quality', 'communication', 'knowledge', 'availability', 'patience', 'general'];
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

    // Check if scholar exists
    const scholar = await User.findById(scholarId);
    if (!scholar || scholar.role !== 'scholar') {
      return res.status(404).json({ 
        error: 'Scholar not found' 
      });
    }

    // Create feedback
    const feedback = new ScholarFeedback({
      user: userId,
      scholar: scholarId,
      rating,
      category,
      subject,
      message,
      contactEmail: contactEmail || undefined,
      priority: priority || 'medium'
    });

    await feedback.save();

    // Create a copy in the general feedback system for admin visibility
    try {
      const adminFeedback = new Feedback({
        user: userId,
        rating,
        category: 'general', // Map to general category for admin
        subject: `Scholar Feedback: ${subject}`,
        message: `Scholar: ${scholar.name}\n\n${message}`,
        contactEmail: contactEmail || undefined,
        priority: priority || 'medium',
        status: 'pending',
        adminNotes: `Original scholar feedback ID: ${feedback._id}`
      });
      await adminFeedback.save();
    } catch (adminError) {
      console.error('Error creating admin copy of scholar feedback:', adminError);
      // Don't fail the main request if admin copy fails
    }


    // Populate user and scholar info for response
    await feedback.populate('user', 'name email role');
    await feedback.populate('scholar', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Scholar feedback submitted successfully',
      feedback: {
        id: feedback._id,
        rating: feedback.rating,
        category: feedback.category,
        subject: feedback.subject,
        priority: feedback.priority,
        status: feedback.status,
        scholar: feedback.scholar,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error('Error submitting scholar feedback:', error);
    res.status(500).json({ 
      error: 'Failed to submit scholar feedback' 
    });
  }
};

// Get user's scholar feedback history
const getUserScholarFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status, category } = req.query;

    // Build query
    const query = { user: userId };
    if (status) query.status = status;
    if (category) query.category = category;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get feedback with pagination
    const feedback = await ScholarFeedback.find(query)
      .populate('scholar', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-message -scholarNotes') // Exclude sensitive fields
      .lean();

    // Get total count
    const total = await ScholarFeedback.countDocuments(query);

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
    console.error('Error fetching user scholar feedback:', error);
    res.status(500).json({ 
      error: 'Failed to fetch scholar feedback' 
    });
  }
};

// Get feedback details (for the user who submitted it)
const getScholarFeedbackDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const feedback = await ScholarFeedback.findOne({ _id: id, user: userId })
      .populate('user', 'name email role')
      .populate('scholar', 'name email role')
      .lean();

    if (!feedback) {
      return res.status(404).json({ 
        error: 'Scholar feedback not found' 
      });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Error fetching scholar feedback details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch scholar feedback details' 
    });
  }
};

// Scholar: Get feedback received about them
const getScholarReceivedFeedback = async (req, res) => {
  try {
    const scholarId = req.user._id;
    const { page = 1, limit = 20, status, category, priority } = req.query;

    // Build query
    const query = { scholar: scholarId };
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get feedback with pagination
    const feedback = await ScholarFeedback.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await ScholarFeedback.countDocuments(query);

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
    console.error('Error fetching scholar received feedback:', error);
    res.status(500).json({ 
      error: 'Failed to fetch scholar feedback' 
    });
  }
};

// Scholar: Update feedback status
const updateScholarFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scholarNotes } = req.body;
    const scholarId = req.user._id;

    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status' 
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (scholarNotes !== undefined) updateData.scholarNotes = scholarNotes;

    const feedback = await ScholarFeedback.findOneAndUpdate(
      { _id: id, scholar: scholarId },
      updateData,
      { new: true }
    ).populate('user', 'name email role').populate('scholar', 'name email role');

    if (!feedback) {
      return res.status(404).json({ 
        error: 'Scholar feedback not found or you are not authorized to update it' 
      });
    }

    res.json({
      success: true,
      message: 'Scholar feedback updated successfully',
      feedback
    });
  } catch (error) {
    console.error('Error updating scholar feedback:', error);
    res.status(500).json({ 
      error: 'Failed to update scholar feedback' 
    });
  }
};

module.exports = {
  submitScholarFeedback,
  getUserScholarFeedback,
  getScholarFeedbackDetails,
  getScholarReceivedFeedback,
  updateScholarFeedbackStatus
};
