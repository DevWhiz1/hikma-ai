// Stripe Configuration (safe init if env is missing)
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } else {
    console.warn('[Stripe] STRIPE_SECRET_KEY is not set. Stripe features are disabled.');
  }
} catch (e) {
  console.error('[Stripe] Failed to initialize Stripe SDK:', e?.message || e);
  stripe = null;
}

// Validate Stripe public settings
if (!process.env.STRIPE_PUBLISHABLE_KEY) {
  console.warn('[Stripe] STRIPE_PUBLISHABLE_KEY is not set (client payments UI may not work).');
}

module.exports = {
  stripe,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
};
