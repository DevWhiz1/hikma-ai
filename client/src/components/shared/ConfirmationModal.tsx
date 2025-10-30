import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  confirmColor?: 'emerald' | 'red' | 'orange' | 'blue';
  icon?: string;
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmColor = 'emerald',
  icon,
  loading = false
}) => {
  if (!isOpen) return null;

  const colorClasses = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    red: 'bg-red-600 hover:bg-red-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    blue: 'bg-blue-600 hover:bg-blue-700'
  };

  const iconBgClasses = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30',
    red: 'bg-red-100 dark:bg-red-900/30',
    orange: 'bg-orange-100 dark:bg-orange-900/30',
    blue: 'bg-blue-100 dark:bg-blue-900/30'
  };

  const iconColorClasses = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-red-600 dark:text-red-400',
    orange: 'text-orange-600 dark:text-orange-400',
    blue: 'bg-blue-600 dark:text-blue-400'
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onCancel || (() => {})}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4 mb-4">
            {icon && (
              <div className={`p-3 ${iconBgClasses[confirmColor]} rounded-xl`}>
                <span className="text-2xl">{icon}</span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {title}
              </h3>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-line">
            {message}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-3 ${colorClasses[confirmColor]} text-white rounded-lg disabled:opacity-50 transition-colors font-medium`}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors font-medium"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmationModal;

