import React from 'react';
import EnhancedFeatureLayout from '../../components/shared/EnhancedFeatureLayout';
import AIAnalytics from '../../components/scholar/AIAnalytics';

const AIAnalyticsPage: React.FC = () => {
  return (
    <EnhancedFeatureLayout
      title="AI Analytics"
      description="AI-powered insights, predictions, and performance analytics"
    >
      <AIAnalytics />
    </EnhancedFeatureLayout>
  );
};

export default AIAnalyticsPage;
