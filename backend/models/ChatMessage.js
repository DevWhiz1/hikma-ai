const mongoose = require('mongoose');

const aiChatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    sessionId: { type: String, index: true }, // optional grouping
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIChatMessage', aiChatMessageSchema);