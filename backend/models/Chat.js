const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  // Persistent chat: must remain active; enforce no hard delete in middleware
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure only one chat per student-scholar pair
chatSchema.index({ studentId: 1, scholarId: 1 }, { unique: true });

// Prevent hard deletions for persistent chats
chatSchema.pre('remove', function(next) {
  next(new Error('Persistent chats cannot be deleted.'));
});

chatSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  next(new Error('Persistent chats cannot be deleted.'));
});

chatSchema.pre('deleteMany', function(next) {
  next(new Error('Persistent chats cannot be deleted.'));
});

module.exports = mongoose.model('Chat', chatSchema);
