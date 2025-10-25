# Stripe Testing Guide

## Quick Setup for Testing

### 1. Backend Environment Variables

Create or update your `backend/.env` file with:

```env
# Stripe Test Keys (Get these from your Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Other existing variables...
MONGODB_URI=mongodb://localhost:27017/hikma-ai
JWT_SECRET=your_jwt_secret_here
```

### 2. Frontend Environment Variables

Create or update your `client/.env` file with:

```env
# Stripe Test Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Other existing variables...
VITE_API_URL=http://localhost:3000/api
```

### 3. Getting Stripe Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Make sure you're in **Test mode** (toggle in top-left)
3. Go to **Developers** → **API Keys**
4. Copy the **Publishable key** and **Secret key**
5. For webhooks, go to **Developers** → **Webhooks** and create an endpoint

### 4. Test Cards

Use these test card numbers:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined payment |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 9987` | Lost card |
| `4000 0000 0000 9979` | Stolen card |

**For all test cards:**
- Use any future expiry date (e.g., 12/25)
- Use any 3-digit CVC (e.g., 123)
- Use any billing address

### 5. Testing the Integration

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd client
   npm run dev
   ```

3. **Navigate to User Dashboard:**
   - Go to `http://localhost:5173`
   - Login as a user
   - Scroll down to "Sample Payment Invoice" section

4. **Test Payment Flow:**
   - Click any "Pay" button
   - Use test card: `4242 4242 4242 4242`
   - Complete the payment form
   - Verify success message

### 6. Sample Invoice Features

The sample invoice includes:

- **Hourly Consultation** - $50.00
- **Single Session** - $75.00  
- **Monthly Subscription** - $200.00

Each option has its own payment button for testing different scenarios.

### 7. Payment Modal Testing

- Click "Open Payment Modal" button
- Test different payment methods (Stripe, PayPal placeholder, Bank Transfer)
- Verify payment success/failure handling

### 8. Webhook Testing (Optional)

For production-like testing:

1. Install Stripe CLI: `npm install -g stripe`
2. Login: `stripe login`
3. Forward events: `stripe listen --forward-to localhost:3000/api/payments/stripe/webhook`
4. Copy the webhook secret to your `.env` file

### 9. Troubleshooting

**Common Issues:**

1. **"Stripe not loaded" error:**
   - Check `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
   - Ensure the key starts with `pk_test_`

2. **Payment intent creation fails:**
   - Check `STRIPE_SECRET_KEY` is set correctly
   - Ensure backend is running on port 3000
   - Check browser console for errors

3. **Payment form not showing:**
   - Check browser console for JavaScript errors
   - Ensure all dependencies are installed
   - Try refreshing the page

### 10. Success Indicators

When everything works correctly, you should see:

- Payment buttons load without errors
- Payment modal opens with Stripe form
- Test card payment completes successfully
- Success message appears
- Payment appears in Stripe Dashboard (test mode)

### 11. Next Steps

Once testing is complete:

1. Replace test keys with live keys for production
2. Set up proper webhook endpoints
3. Configure SSL certificates
4. Test with real payment methods
5. Monitor payment analytics

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check the backend logs for API errors
3. Verify all environment variables are set
4. Test with different test card numbers
5. Check Stripe Dashboard for payment attempts
