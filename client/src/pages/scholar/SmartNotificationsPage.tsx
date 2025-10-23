import React from 'react';
import EnhancedFeatureLayout from '../../components/shared/EnhancedFeatureLayout';
import SmartNotifications from '../../components/scholar/SmartNotifications';

const SmartNotificationsPage: React.FC = () => {
  return (
    <EnhancedFeatureLayout
      title="Smart Notifications"
      description="Intelligent notification management and automation"
    >
      <SmartNotifications />
    </EnhancedFeatureLayout>
  );
};

export default SmartNotificationsPage;
