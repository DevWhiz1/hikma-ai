const mongoose = require('mongoose');

const sensitiveLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  textSample: { type: String },
  redactedText: { type: String },
  endpoint: { type: String },
  type: { 
    type: String, 
    enum: ['meeting_link_blocked', 'phone_blocked', 'email_blocked', 'link_detected', 'sensitive_content'],
    default: 'sensitive_content'
  },
  metadata: { type: mongoose.Schema.Types.Mixed }, // Store additional data like links array
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('SensitiveLog', sensitiveLogSchema);


