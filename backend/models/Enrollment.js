const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  scholar: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholar', required: true, index: true },
  studentSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession' },
  scholarSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  feedback: [
    {
      text: { type: String },
      rating: { type: Number, min: 1, max: 5 },
      anonymous: { type: Boolean, default: true },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      submittedAt: { type: Date, default: Date.now }
    }
  ]
});

// Enforce single enrollment (single direct chat) per student-scholar pair
enrollmentSchema.index({ student: 1, scholar: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);


