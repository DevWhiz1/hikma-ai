const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholar', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ratingValue: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null }
});

ratingSchema.index({ scholarId: 1, studentId: 1 }, { unique: false });

module.exports = mongoose.model('Rating', ratingSchema);


