const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  type: { 
    type: String, 
    enum: ['assignment', 'quiz', 'grade', 'message', 'meeting', 'system'], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  metadata: {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
    scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholar' },
    scholarName: String,
    assignmentTitle: String,
    kind: String, // 'assignment' or 'quiz'
    dueDate: Date,
    durationMinutes: Number
  },
  read: { 
    type: Boolean, 
    default: false,
    index: true
  },
  readAt: Date,
  link: String, // direct link to relevant page
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
}, { 
  timestamps: true 
});

// Compound index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Auto-expire old read notifications after 30 days (optional)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { read: true } });

module.exports = mongoose.model('Notification', notificationSchema);
