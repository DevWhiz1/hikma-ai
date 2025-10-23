import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { paymentService } from '../../../services/paymentService';

interface PaymentSummaryProps {
  isScholar?: boolean;
  compact?: boolean;
  onViewDetails?: () => void;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({ 
  isScholar = false, 
  compact = false,
  onViewDetails 
}) => {
  const [analytics, setAnalytics] = useState({
    totalAmount: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    monthlyAmount: 0,
    previousMonthAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentAnalytics('30d');
      setAnalytics(response?.analytics || {
        totalAmount: 0,
        totalTransactions: 0,
        completedTransactions: 0,
        pendingTransactions: 0,
        monthlyAmount: 0,
        previousMonthAmount: 0
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getMonthlyChange = () => {
    if (analytics.previousMonthAmount === 0) return 0;
    return Math.round(((analytics.monthlyAmount - analytics.previousMonthAmount) / analytics.previousMonthAmount) * 100);
  };

  const monthlyChange = getMonthlyChange();
  const isPositiveChange = monthlyChange >= 0;

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-${compact ? '4' : '6'}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isScholar ? 'Total Earnings' : 'Total Spent'}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(analytics.totalAmount)}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center">
              {isPositiveChange ? (
                <ArrowUpIcon className="h-4 w-4 text-emerald-600 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-lime-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${isPositiveChange ? 'text-emerald-600' : 'text-lime-600'}`}>
                {Math.abs(monthlyChange)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">vs last month</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isScholar ? 'Earnings Overview' : 'Spending Overview'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isScholar ? 'Your teaching earnings and performance' : 'Your payment history and spending'}
          </p>
        </div>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex items-center px-3 py-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View Details
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="flex items-center mb-2">
            <CurrencyDollarIcon className="h-6 w-6 text-emerald-600 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isScholar ? 'Total Earnings' : 'Total Spent'}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(analytics.totalAmount)}
          </p>
        </div>

        <div>
          <div className="flex items-center mb-2">
            <CalendarIcon className="h-6 w-6 text-teal-600 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isScholar ? 'This Month' : 'This Month'}
            </span>
          </div>
          <div className="flex items-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white mr-2">
              {formatCurrency(analytics.monthlyAmount)}
            </p>
            <div className="flex items-center">
              {isPositiveChange ? (
                <ArrowUpIcon className="h-4 w-4 text-emerald-600 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-lime-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${isPositiveChange ? 'text-emerald-600' : 'text-lime-600'}`}>
                {Math.abs(monthlyChange)}%
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isScholar ? 'Completed Sessions' : 'Completed Payments'}
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {analytics.completedTransactions}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {analytics.pendingTransactions} pending
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Success Rate</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {analytics.totalTransactions > 0 
              ? Math.round((analytics.completedTransactions / analytics.totalTransactions) * 100)
              : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${analytics.totalTransactions > 0 
                ? (analytics.completedTransactions / analytics.totalTransactions) * 100 
                : 0}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
