const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
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
  plan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  features: [{
    name: String,
    included: Boolean,
    limit: Number
  }],
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer'],
    required: true
  },
  paymentId: {
    type: String,
    required: false
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  cancellationReason: {
    type: String,
    required: false
  },
  cancelledAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ scholar: 1, status: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });
subscriptionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
