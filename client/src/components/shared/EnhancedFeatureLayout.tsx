import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';
import QuickNavigation from './QuickNavigation';
import { authService } from '../../services/authService';

interface EnhancedFeatureLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  backTo?: string;
}

const EnhancedFeatureLayout: React.FC<EnhancedFeatureLayoutProps> = ({
  title,
  description,
  children,
  showBackButton = true,
  backTo = '/scholar/dashboard'
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(backTo);
  };

  const handleHome = () => {
    navigate('/scholar/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button */}
            {showBackButton && (
              <button
                onClick={handleBack}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
            )}

            {/* Title */}
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {description}
                </p>
              )}
            </div>

            {/* Home Button */}
            <button
              onClick={handleHome}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Home
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuickNavigation userRole={authService.getUser()?.role} />
        {children}
      </div>
    </div>
  );
};

export default EnhancedFeatureLayout;
