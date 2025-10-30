import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number; // in milliseconds
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 2000
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-200',
      icon: CheckCircleIcon,
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: XCircleIcon,
      iconColor: 'text-red-600 dark:text-red-400'
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/30',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-600 dark:text-blue-400'
    }
  };

  const styles = typeStyles[type];
  const Icon = styles.icon;

  return (
    <div className="fixed top-16 right-4 z-40 animate-fadeIn">
      <div className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md flex items-start gap-3`}>
        <Icon className={`h-5 w-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${styles.text}`}>
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`${styles.text} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="Close"
        >
          <XCircleIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;

