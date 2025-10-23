import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import EnhancedScholarSelection from './EnhancedScholarSelection';

const EnhancedScholarsPage: React.FC = () => {
  const user = authService.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20">
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Islamic Scholars</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with verified Islamic scholars for personalized learning and guidance
              </p>
            </div>
            {user?.role !== 'scholar' && (
              <Link 
                to="/scholars/apply" 
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Apply as Scholar
              </Link>
            )}
          </div>
        </div>

        {/* Enhanced Scholar Selection */}
        <EnhancedScholarSelection />
      </div>
    </div>
  );
};

export default EnhancedScholarsPage;
