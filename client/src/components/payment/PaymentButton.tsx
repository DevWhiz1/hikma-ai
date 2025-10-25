import React, { useState } from 'react';
import { 
  CurrencyDollarIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import PaymentModal from './PaymentModal';

interface PaymentButtonProps {
  scholarId: string;
  scholarName: string;
  amount: number;
  paymentType: 'hourly' | 'monthly' | 'session' | 'subscription';
  description: string;
  sessionId?: string;
  subscriptionId?: string;
  onPaymentSuccess?: (payment: any) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  scholarId,
  scholarName,
  amount,
  paymentType,
  description,
  sessionId,
  subscriptionId,
  onPaymentSuccess,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handlePaymentSuccess = (payment: any) => {
    setPaymentStatus('success');
    onPaymentSuccess?.(payment);
    setIsModalOpen(false);
    
    // Reset status after 3 seconds
    setTimeout(() => {
      setPaymentStatus('idle');
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error');
    console.error('Payment error:', error);
    
    // Reset status after 3 seconds
    setTimeout(() => {
      setPaymentStatus('idle');
    }, 3000);
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const variantClasses = {
      primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-emerald-600 text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500'
    };

    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getButtonContent = () => {
    if (paymentStatus === 'success') {
      return (
        <>
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          Paid
        </>
      );
    }

    if (paymentStatus === 'error') {
      return (
        <>
          <XCircleIcon className="h-4 w-4 mr-2" />
          Failed
        </>
      );
    }

    if (paymentStatus === 'processing') {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing...
        </>
      );
    }

    return (
      <>
        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
        Pay {formatCurrency(amount)}
      </>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || paymentStatus === 'processing'}
        className={getButtonClasses()}
      >
        {getButtonContent()}
      </button>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scholarId={scholarId}
        scholarName={scholarName}
        amount={amount}
        paymentType={paymentType}
        description={description}
        sessionId={sessionId}
        subscriptionId={subscriptionId}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default PaymentButton;
