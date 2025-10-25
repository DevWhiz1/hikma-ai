// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
};

// Validate Stripe configuration
if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
  console.warn('Warning: VITE_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
}
