import React, { useState } from 'react';
import { 
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import StripePaymentFormV2 from './StripePaymentFormV2';
import SimpleStripeForm from './SimpleStripeForm';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  scholarId: string;
  scholarName: string;
  amount: number;
  paymentType: 'hourly' | 'monthly' | 'session' | 'subscription';
  description: string;
  sessionId?: string;
  subscriptionId?: string;
  onPaymentSuccess?: (payment: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  scholarId,
  scholarName,
  amount,
  paymentType,
  description,
  sessionId,
  subscriptionId,
  onPaymentSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | 'bank_transfer'>('stripe');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (!isOpen) return null;

  const handlePaymentMethodSelect = (method: 'stripe' | 'paypal' | 'bank_transfer') => {
    setSelectedMethod(method);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (payment: any) => {
    onPaymentSuccess?.(payment);
    onClose();
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // You can add toast notification here
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPaymentTypeDescription = (type: string) => {
    switch (type) {
      case 'hourly':
        return 'Hourly consultation';
      case 'monthly':
        return 'Monthly subscription';
      case 'session':
        return 'Single session';
      case 'subscription':
        return 'Subscription service';
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Complete Payment
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pay {scholarName} for {getPaymentTypeDescription(paymentType)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Payment Summary */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(amount)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Scholar:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{scholarName}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="ml-2 text-gray-900 dark:text-white capitalize">{paymentType}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600 dark:text-gray-400">Description:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{description}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        {!showPaymentForm ? (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Choose Payment Method
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handlePaymentMethodSelect('stripe')}
                className="w-full flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <CreditCardIcon className="h-6 w-6 text-blue-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">Credit/Debit Card</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Visa, Mastercard, American Express</div>
                </div>
              </button>

              <button
                onClick={() => handlePaymentMethodSelect('paypal')}
                className="w-full flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <BanknotesIcon className="h-6 w-6 text-yellow-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">PayPal</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pay with your PayPal account</div>
                </div>
              </button>

              <button
                onClick={() => handlePaymentMethodSelect('bank_transfer')}
                className="w-full flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <DocumentTextIcon className="h-6 w-6 text-green-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">Bank Transfer</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Direct bank transfer</div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="text-emerald-600 hover:text-emerald-700 mr-2"
              >
                ← Back
              </button>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedMethod === 'stripe' && 'Card Payment'}
                {selectedMethod === 'paypal' && 'PayPal Payment'}
                {selectedMethod === 'bank_transfer' && 'Bank Transfer'}
              </h3>
            </div>

            {selectedMethod === 'stripe' && (
              <SimpleStripeForm
                scholarId={scholarId}
                amount={amount}
                paymentType={paymentType}
                description={description}
                sessionId={sessionId}
                subscriptionId={subscriptionId}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={() => setShowPaymentForm(false)}
              />
            )}

            {selectedMethod === 'paypal' && (
              <div className="text-center py-8">
                <BanknotesIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  PayPal Integration Coming Soon
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  PayPal payment integration is currently under development.
                </p>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Choose Different Method
                </button>
              </div>
            )}

            {selectedMethod === 'bank_transfer' && (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Bank Transfer Details
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 text-left">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Account Name:</span>
                      <span className="text-gray-900 dark:text-white">Hikma AI</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
                      <span className="text-gray-900 dark:text-white">1234567890</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Routing Number:</span>
                      <span className="text-gray-900 dark:text-white">021000021</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="text-gray-900 dark:text-white font-semibold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Reference:</span>
                      <span className="text-gray-900 dark:text-white">{scholarId.slice(-8)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Please include the reference number when making the transfer. 
                  Your payment will be processed within 1-2 business days.
                </p>
                <button
                  onClick={onClose}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  I'll Transfer the Amount
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
