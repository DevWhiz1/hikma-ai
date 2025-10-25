# Stripe Payment Integration

This document explains how to set up and use the Stripe payment integration in the Hikma AI application.

## Overview

The Stripe integration provides secure payment processing for:
- Hourly consultations
- Single sessions
- Monthly subscriptions
- Premium subscriptions

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install stripe
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Stripe Configuration

The Stripe configuration is handled in `backend/config/stripeConfig.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### 4. API Endpoints

The following endpoints are available:

- `POST /api/payments/stripe/create-intent` - Create a payment intent
- `POST /api/payments/stripe/confirm` - Confirm a payment
- `POST /api/payments/stripe/webhook` - Handle Stripe webhooks

## Frontend Setup

### 1. Install Dependencies

```bash
cd client
npm install @stripe/stripe-js
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 3. Configuration

The Stripe configuration is handled in `client/src/config/stripe.ts`:

```typescript
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
};
```

## Usage

### 1. Simple Payment Button

Use the `PaymentButton` component for simple payment flows:

```tsx
import PaymentButton from './components/payment/PaymentButton';

<PaymentButton
  scholarId="scholar123"
  scholarName="Dr. Ahmed"
  amount={50}
  paymentType="hourly"
  description="1-hour consultation"
  onPaymentSuccess={(payment) => {
    console.log('Payment successful:', payment);
  }}
/>
```

### 2. Payment Modal

Use the `PaymentModal` component for more complex payment flows:

```tsx
import PaymentModal from './components/payment/PaymentModal';

<PaymentModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  scholarId="scholar123"
  scholarName="Dr. Ahmed"
  amount={50}
  paymentType="hourly"
  description="1-hour consultation"
  onPaymentSuccess={(payment) => {
    console.log('Payment successful:', payment);
  }}
/>
```

### 3. Custom Stripe Form

Use the `StripePaymentForm` component for custom payment forms:

```tsx
import StripePaymentForm from './components/payment/StripePaymentForm';

<StripePaymentForm
  scholarId="scholar123"
  amount={50}
  paymentType="hourly"
  description="1-hour consultation"
  onSuccess={(payment) => {
    console.log('Payment successful:', payment);
  }}
  onError={(error) => {
    console.error('Payment failed:', error);
  }}
/>
```

## Payment Types

The system supports the following payment types:

- `hourly` - Hourly consultation sessions
- `session` - Single focused sessions
- `monthly` - Monthly subscriptions
- `subscription` - Premium subscriptions

## Security Features

### 1. Server-Side Validation

All payment intents are created on the server to ensure security.

### 2. Webhook Handling

Stripe webhooks are properly handled to update payment statuses:

- `payment_intent.succeeded` - Marks payment as completed
- `payment_intent.payment_failed` - Marks payment as failed

### 3. Environment Variables

Sensitive keys are stored in environment variables and never exposed to the client.

## Testing

### 1. Test Cards

Use Stripe test cards for testing:

- `4242 4242 4242 4242` - Successful payment
- `4000 0000 0000 0002` - Declined payment
- `4000 0000 0000 9995` - Insufficient funds

### 2. Test Mode

Ensure you're using test keys (starting with `sk_test_` and `pk_test_`) for development.

## Error Handling

The system includes comprehensive error handling:

- Network errors
- Payment failures
- Validation errors
- Stripe API errors

## Webhook Setup

1. Go to your Stripe Dashboard
2. Navigate to Webhooks
3. Add endpoint: `https://yourdomain.com/api/payments/stripe/webhook`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the webhook secret to your environment variables

## Production Deployment

### 1. Environment Variables

Update your environment variables with production keys:

```env
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### 2. Webhook Configuration

Update your webhook endpoint to use your production domain.

### 3. SSL Certificate

Ensure your production domain has a valid SSL certificate for secure payment processing.

## Troubleshooting

### Common Issues

1. **"Stripe not loaded" error**
   - Check that `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
   - Ensure the Stripe script is loaded

2. **Payment intent creation fails**
   - Check that `STRIPE_SECRET_KEY` is set correctly
   - Verify the backend is running and accessible

3. **Webhook not working**
   - Check that `STRIPE_WEBHOOK_SECRET` is set correctly
   - Verify the webhook endpoint is accessible
   - Check Stripe Dashboard for webhook delivery logs

### Debug Mode

Enable debug mode by setting:

```env
NODE_ENV=development
```

This will provide additional logging for troubleshooting.

## Support

For additional support:

1. Check the Stripe documentation
2. Review the application logs
3. Test with Stripe's test cards
4. Verify environment variables are set correctly

## Security Best Practices

1. Never expose secret keys to the client
2. Always validate payment amounts on the server
3. Use HTTPS in production
4. Regularly rotate API keys
5. Monitor webhook delivery and failures
6. Implement proper error handling and logging
