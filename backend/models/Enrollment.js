const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  scholar: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholar', required: true, index: true },
  studentSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession' },
  scholarSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession' },
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

module.exports = mongoose.model('Enrollment', enrollmentSchema);


