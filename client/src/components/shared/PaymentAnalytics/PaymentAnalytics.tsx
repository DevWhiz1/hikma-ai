import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface PaymentAnalyticsProps {
  analytics: {
    totalAmount: number;
    totalTransactions: number;
    completedTransactions: number;
    pendingTransactions: number;
    failedTransactions: number;
    monthlyAmount?: number;
    averageTransactionValue?: number;
    topUsers?: number;
  };
  isScholar?: boolean;
  period?: '7d' | '30d' | '90d';
  onPeriodChange?: (period: '7d' | '30d' | '90d') => void;
}

const PaymentAnalytics: React.FC<PaymentAnalyticsProps> = ({ 
  analytics, 
  isScholar = false, 
  period = '30d',
  onPeriodChange 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>(period);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getCompletionRate = () => {
    if (analytics.totalTransactions === 0) return 0;
    return Math.round((analytics.completedTransactions / analytics.totalTransactions) * 100);
  };

  const getFailureRate = () => {
    if (analytics.totalTransactions === 0) return 0;
    return Math.round((analytics.failedTransactions / analytics.totalTransactions) * 100);
  };

  const getPendingRate = () => {
    if (analytics.totalTransactions === 0) return 0;
    return Math.round((analytics.pendingTransactions / analytics.totalTransactions) * 100);
  };

  const handlePeriodChange = (newPeriod: '7d' | '30d' | '90d') => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isScholar ? 'Earnings Analytics' : 'Spending Analytics'}
        </h3>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedPeriod === p
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-emerald-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isScholar ? 'Total Earnings' : 'Total Spent'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(analytics.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-teal-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isScholar ? 'Total Sessions' : 'Total Transactions'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.totalTransactions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-emerald-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.completedTransactions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-teal-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.pendingTransactions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-xl font-bold text-emerald-600">{getCompletionRate()}%</p>
            </div>
            <div className="flex items-center">
              <ArrowUpIcon className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getCompletionRate()}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failure Rate</p>
              <p className="text-xl font-bold text-lime-600">{getFailureRate()}%</p>
            </div>
            <div className="flex items-center">
              <ArrowDownIcon className="h-6 w-6 text-lime-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-lime-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getFailureRate()}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Rate</p>
              <p className="text-xl font-bold text-teal-600">{getPendingRate()}%</p>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 text-teal-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getPendingRate()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Extended Analytics */}
      {(analytics.monthlyAmount || analytics.averageTransactionValue || analytics.topUsers) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analytics.monthlyAmount && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-emerald-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isScholar ? 'Monthly Earnings' : 'Monthly Spending'}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(analytics.monthlyAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {analytics.averageTransactionValue && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-teal-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Transaction</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(analytics.averageTransactionValue)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {analytics.topUsers && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <ArrowUpIcon className="h-8 w-8 text-lime-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isScholar ? 'Active Students' : 'Top Scholars'}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {analytics.topUsers}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Status Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{analytics.completedTransactions}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <ClockIcon className="h-6 w-6 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-teal-600">{analytics.pendingTransactions}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircleIcon className="h-6 w-6 text-lime-600" />
            </div>
            <p className="text-2xl font-bold text-lime-600">{analytics.failedTransactions}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <ChartBarIcon className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-600">{analytics.totalTransactions}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAnalytics;
