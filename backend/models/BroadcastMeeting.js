const mongoose = require('mongoose');

const broadcastMeetingSchema = new mongoose.Schema({
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  meetingTimes: [{
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    duration: { type: Number, default: 60 }, // Duration in minutes
    maxParticipants: { type: Number, default: 1 },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isBooked: { type: Boolean, default: false },
    bookedAt: { type: Date }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  timezone: { type: String, default: 'UTC' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date } // When the broadcast expires
}, { timestamps: true });

// Index for efficient queries
broadcastMeetingSchema.index({ scholarId: 1, status: 1 });
broadcastMeetingSchema.index({ 'meetingTimes.start': 1 });
broadcastMeetingSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('BroadcastMeeting', broadcastMeetingSchema);
