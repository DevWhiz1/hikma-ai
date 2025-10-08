const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 100 },
  messages: [messageSchema],
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  kind: { type: String, enum: ['ai', 'direct'], default: 'ai', index: true }
}, {
  timestamps: true
});

// Update lastActivity when messages are added
chatSessionSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    this.lastActivity = new Date();
  }
  next();
});

// Auto-generate title from first user message
chatSessionSchema.methods.generateTitle = function() {
  const firstUserMessage = this.messages.find(msg => msg.role === 'user');
  if (firstUserMessage) {
    let title = firstUserMessage.content.substring(0, 50);
    if (firstUserMessage.content.length > 50) title += '...';
    this.title = title;
  }
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);
