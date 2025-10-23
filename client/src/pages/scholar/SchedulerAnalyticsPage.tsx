import React from 'react';
import EnhancedFeatureLayout from '../../components/shared/EnhancedFeatureLayout';
import SchedulerAnalytics from '../../components/scholar/SchedulerAnalytics';

const SchedulerAnalyticsPage: React.FC = () => {
  return (
    <EnhancedFeatureLayout
      title="Scheduler Analytics"
      description="Comprehensive analytics and insights for your scheduling performance"
    >
      <SchedulerAnalytics />
    </EnhancedFeatureLayout>
  );
};

export default SchedulerAnalyticsPage;
