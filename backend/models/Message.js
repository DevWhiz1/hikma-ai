const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  text: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'meeting_request', 'meeting_scheduled', 'meeting_link', 'meeting_broadcast', 'meeting_booked'], 
    default: 'text' 
  },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    scheduledTime: Date,
    meetingLink: String,
    roomId: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
