// Stripe Configuration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Validate Stripe configuration
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY is not set in environment variables');
}

if (!process.env.STRIPE_PUBLISHABLE_KEY) {
  console.warn('Warning: STRIPE_PUBLISHABLE_KEY is not set in environment variables');
}

module.exports = {
  stripe,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
};
