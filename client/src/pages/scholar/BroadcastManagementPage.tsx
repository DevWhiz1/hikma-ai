import React from 'react';
import EnhancedFeatureLayout from '../../components/shared/EnhancedFeatureLayout';
import BroadcastManagement from '../../components/scholar/BroadcastManagement';

const BroadcastManagementPage: React.FC = () => {
  return (
    <EnhancedFeatureLayout
      title="Broadcast Management"
      description="Manage your meeting broadcasts and track student bookings"
    >
      <BroadcastManagement />
    </EnhancedFeatureLayout>
  );
};

export default BroadcastManagementPage;
