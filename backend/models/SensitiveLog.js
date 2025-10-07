const mongoose = require('mongoose');

const sensitiveLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  textSample: { type: String },
  redactedText: { type: String },
  endpoint: { type: String },
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('SensitiveLog', sensitiveLogSchema);


