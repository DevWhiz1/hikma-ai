const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scholar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholar',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentType: {
    type: String,
    enum: ['hourly', 'monthly', 'session', 'subscription'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'crypto'],
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: false
  },
  subscriptionId: {
    type: String,
    required: false
  },
  billingPeriod: {
    start: Date,
    end: Date
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ scholar: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
