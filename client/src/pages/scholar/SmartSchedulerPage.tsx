import React from 'react';
import EnhancedFeatureLayout from '../../components/shared/EnhancedFeatureLayout';
import SmartScheduler from '../../components/scholar/SmartScheduler';

const SmartSchedulerPage: React.FC = () => {
  return (
    <EnhancedFeatureLayout
      title="Smart Scheduler"
      description="AI-powered scheduling with templates and optimal time suggestions"
    >
      <SmartScheduler />
    </EnhancedFeatureLayout>
  );
};

export default SmartSchedulerPage;
