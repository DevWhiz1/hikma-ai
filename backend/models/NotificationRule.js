const mongoose = require('mongoose');

const notificationRuleSchema = new mongoose.Schema({
  scholarUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  name: { type: String, required: true },
  messageTemplate: { type: String, required: true },
  audience: { type: String, enum: ['all', 'selected'], default: 'all' },
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  trigger: { type: String, enum: ['daily', 'weekly', 'monthly', 'onNewEnrollment'], required: true },
  timeOfDay: { type: String }, // "HH:MM" 24h for daily/weekly/monthly
  daysOfWeek: [{ type: Number }], // 0..6 if weekly
  dayOfMonth: { type: Number }, // 1..31 if monthly
  isActive: { type: Boolean, default: true },
  lastRunAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

notificationRuleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('NotificationRule', notificationRuleSchema);


