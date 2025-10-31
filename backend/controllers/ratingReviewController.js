const Rating = require('../models/Rating');
const Review = require('../models/Review');
const Scholar = require('../models/Scholar');
const Enrollment = require('../models/Enrollment');

// Submit rating and/or review in one call
async function submitRatingReview(req, res) {
  try {
    const { scholarId, ratingValue, comment } = req.body || {};
    const studentId = req.user._id;

    if (!scholarId) return res.status(400).json({ message: 'scholarId is required' });

    // Only students allowed
    if (req.user?.role !== 'user') {
      return res.status(403).json({ message: 'Only students can submit ratings or reviews.' });
    }

    // Ensure student is enrolled with this scholar
    const isEnrolled = await Enrollment.findOne({ student: studentId, scholar: scholarId, isActive: true }).lean();
    if (!isEnrolled) {
      return res.status(403).json({ message: 'You can only leave feedback for scholars you are enrolled with.' });
    }

    if (!ratingValue && (!comment || !String(comment).trim())) {
      return res.status(400).json({ message: 'Please provide at least a rating or a review.' });
    }

    const results = {};

    // Create rating if provided
    if (ratingValue) {
      const rv = Number(ratingValue);
      if (isNaN(rv) || rv < 1 || rv > 5) {
        return res.status(400).json({ message: 'ratingValue must be between 1 and 5' });
      }

      await Rating.create({ scholarId, studentId, ratingValue: rv, comment: comment ? String(comment).trim() : null });

      // Recompute average rating and total count on Scholar
      const stats = await Rating.aggregate([
        { $match: { scholarId: require('mongoose').Types.ObjectId.createFromHexString(String(scholarId)) } },
        { $group: { _id: '$scholarId', avg: { $avg: '$ratingValue' }, count: { $sum: 1 } } }
      ]);
      if (stats && stats[0]) {
        await Scholar.findByIdAndUpdate(scholarId, { averageRating: Number(stats[0].avg.toFixed(2)), totalReviews: stats[0].count });
      }
      results.ratingSaved = true;
    }

    // Create review if provided and non-empty
    if (comment && String(comment).trim()) {
      await Review.create({ scholarId, studentId, reviewText: String(comment).trim() });
      results.reviewSaved = true;
    }

    return res.json({ success: true, ...results });
  } catch (e) {
    console.error('submitRatingReview error', e);
    return res.status(500).json({ message: 'Failed to submit rating/review' });
  }
}

module.exports = { submitRatingReview };
// Get rating overview and distribution
async function getScholarOverview(req, res) {
  try {
    const { scholarId } = req.params;
    const mongoose = require('mongoose');
    const sid = mongoose.Types.ObjectId.createFromHexString(String(scholarId));
    const agg = await Rating.aggregate([
      { $match: { scholarId: sid } },
      { $group: { _id: '$ratingValue', count: { $sum: 1 } } }
    ]);
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0; let sum = 0;
    agg.forEach(r => { dist[r._id] = r.count; total += r.count; sum += r._id * r.count; });
    const average = total ? Number((sum / total).toFixed(2)) : 0;
    return res.json({ success: true, average, totalReviews: total, distribution: dist });
  } catch (e) {
    console.error('getScholarOverview error', e);
    return res.status(500).json({ message: 'Failed to load rating overview' });
  }
}

// Get reviews list with student name and their rating if available
async function getScholarReviews(req, res) {
  try {
    const { scholarId } = req.params;
    const reviews = await Review.find({ scholarId })
      .populate('studentId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    // Map ratings by student for quick lookup
    const studentIds = [...new Set(reviews.map(r => String(r.studentId?._id)))];
    const ratings = await Rating.find({ scholarId, studentId: { $in: studentIds } }).lean();
    const rmap = new Map(ratings.map(r => [String(r.studentId), r.ratingValue]));
    const items = reviews.map(r => ({
      id: r._id,
      studentName: r.studentId?.name || 'Student',
      reviewText: r.reviewText,
      ratingValue: rmap.get(String(r.studentId?._id)) || null,
      createdAt: r.createdAt
    }));
    return res.json({ success: true, items });
  } catch (e) {
    console.error('getScholarReviews error', e);
    return res.status(500).json({ message: 'Failed to load reviews' });
  }
}

module.exports.getScholarOverview = getScholarOverview;
module.exports.getScholarReviews = getScholarReviews;


