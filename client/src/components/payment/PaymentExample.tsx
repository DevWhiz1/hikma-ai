import React, { useState } from 'react';
import { 
  CurrencyDollarIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import PaymentButton from './PaymentButton';
import PaymentModal from './PaymentModal';

interface PaymentExampleProps {
  scholarId: string;
  scholarName: string;
  scholarPhoto?: string;
  specializations?: string[];
}

const PaymentExample: React.FC<PaymentExampleProps> = ({
  scholarId,
  scholarName,
  scholarPhoto,
  specializations = []
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>>([]);

  // Example payment options
  const paymentOptions = [
    {
      id: 'monthly',
      type: 'monthly' as const,
      amount: 200,
      description: 'Monthly subscription with 15 sessions',
      title: 'Monthly Subscription',
      duration: '15 sessions/month'
    },
  ];

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only last 5 notifications
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const handlePaymentSuccess = (payment: any) => {
    setPaymentHistory(prev => [payment, ...prev]);
    addNotification('success', `Payment of $${payment.amount} completed successfully!`);
  };

  const handlePaymentError = (error: string) => {
    addNotification('error', `Payment failed: ${error}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Integration Example
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          This demonstrates how to integrate Stripe payments into your application.
        </p>
      </div>

      {/* Scholar Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center mb-4">
          <img
            src={scholarPhoto || 'https://via.placeholder.com/60x60?text=S'}
            alt={scholarName}
            className="h-15 w-15 rounded-full object-cover mr-4"
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {scholarName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Islamic Scholar & Spiritual Guide
            </p>
            {specializations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {specializations.map((spec, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-full"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${getNotificationBgColor(notification.type)}`}
            >
              <div className="flex items-center">
                {getNotificationIcon(notification.type)}
                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                  {notification.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {paymentOptions.map((option) => (
          <div
            key={option.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {option.duration}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(option.amount)}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {option.description}
            </p>

            <div className="flex space-x-3">
              <PaymentButton
                scholarId={scholarId}
                scholarName={scholarName}
                amount={option.amount}
                paymentType={option.type}
                description={option.description}
                onPaymentSuccess={handlePaymentSuccess}
                className="flex-1"
                variant="primary"
                size="md"
              />
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                More Options
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Payments
          </h3>
          <div className="space-y-3">
            {paymentHistory.slice(0, 5).map((payment, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {payment.description || 'Payment completed'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(payment.amount || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        scholarId={scholarId}
        scholarName={scholarName}
        amount={50} // Default amount
        paymentType="hourly"
        description="Consultation session"
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Integration Instructions */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Integration Instructions
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                <strong>1. Environment Variables:</strong> Set up your Stripe keys in your environment variables.
              </p>
              <p>
                <strong>2. Backend:</strong> Ensure your backend has the Stripe webhook endpoint configured.
              </p>
              <p>
                <strong>3. Frontend:</strong> Use the PaymentButton component for simple payments or PaymentModal for more complex flows.
              </p>
              <p>
                <strong>4. Testing:</strong> Use Stripe test cards (4242 4242 4242 4242) for testing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentExample;
