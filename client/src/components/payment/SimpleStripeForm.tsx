import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElements, Elements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/stripe-js';
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { paymentService } from '../../services/paymentService';
import { STRIPE_CONFIG } from '../../config/stripe';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

interface SimpleStripeFormProps {
  scholarId: string;
  amount: number;
  paymentType: 'hourly' | 'monthly' | 'session' | 'subscription';
  description: string;
  sessionId?: string;
  subscriptionId?: string;
  onSuccess?: (payment: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const SimpleStripeForm: React.FC<SimpleStripeFormProps> = ({
  scholarId,
  amount,
  paymentType,
  description,
  sessionId,
  subscriptionId,
  onSuccess,
  onError,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      setError('');

      const paymentData = {
        scholarId,
        amount,
        paymentType,
        description,
        sessionId,
        subscriptionId
      };

      const response = await paymentService.createStripePaymentIntent(paymentData);
      
      if (response.success) {
        setClientSecret(response.clientSecret);
        setPaymentId(response.paymentId);
      } else {
        setError('Failed to create payment intent');
        onError?.('Failed to create payment intent');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create payment intent');
      onError?.(err.message || 'Failed to create payment intent');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!clientSecret) {
      setError('Payment intent not ready');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe not loaded');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            number: (document.getElementById('card-number') as HTMLInputElement)?.value,
            exp_month: parseInt((document.getElementById('card-expiry') as HTMLInputElement)?.value.split('/')[0] || '0'),
            exp_year: parseInt((document.getElementById('card-expiry') as HTMLInputElement)?.value.split('/')[1] || '0'),
            cvc: (document.getElementById('card-cvc') as HTMLInputElement)?.value,
          }
        }
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        onError?.(stripeError.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        setSuccess(true);
        onSuccess?.(paymentIntent);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      onError?.(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Payment Successful!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your payment of {formatCurrency(amount)} has been processed successfully.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <CreditCardIcon className="h-8 w-8 text-emerald-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Complete Payment
          </h3>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(amount)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
            <span className="text-sm text-gray-900 dark:text-white capitalize">
              {paymentType}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Description</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {description}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Card Information
          </label>
          <div className="space-y-3">
            <div>
              <input
                id="card-number"
                type="text"
                placeholder="1234 1234 1234 1234"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                maxLength={19}
                onChange={(e) => {
                  let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                  let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                  e.target.value = formattedValue;
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                id="card-expiry"
                type="text"
                placeholder="MM/YY"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                maxLength={5}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                  }
                  e.target.value = value;
                }}
              />
              <input
                id="card-cvc"
                type="text"
                placeholder="CVC"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                maxLength={4}
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !clientSecret}
            className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                Pay {formatCurrency(amount)}
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>Your payment information is secure and encrypted.</p>
        <p>Powered by Stripe</p>
      </div>
    </div>
  );
};

export default SimpleStripeForm;
