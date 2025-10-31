const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholar', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reviewText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);


