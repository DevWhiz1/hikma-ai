import React from 'react';
import EnhancedFeatureLayout from '../../components/shared/EnhancedFeatureLayout';
import AISmartScheduler from '../../components/scholar/AISmartScheduler';

const AISmartSchedulerPage: React.FC = () => {
  return (
    <EnhancedFeatureLayout
      title="AI Smart Scheduler"
      description="Natural language scheduling with AI-powered insights and recommendations"
    >
      <AISmartScheduler />
    </EnhancedFeatureLayout>
  );
};

export default AISmartSchedulerPage;
