const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String },
  scheduledTime: { type: Date },
  link: { type: String },
  roomId: { type: String },
  status: { 
    type: String, 
    enum: ['requested', 'scheduled', 'link_sent', 'completed', 'cancelled'], 
    default: 'requested' 
  },
  rescheduleRequests: [{
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    proposedTime: { type: Date },
    note: { type: String },
    status: { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
