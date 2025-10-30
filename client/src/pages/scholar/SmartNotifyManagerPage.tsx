import React from 'react';
import SmartNotifyManager from '../../components/scholar/SmartNotifyManager';

const SmartNotifyManagerPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Smart Notify Manager</h1>
      <SmartNotifyManager />
    </div>
  );
};

export default SmartNotifyManagerPage;


