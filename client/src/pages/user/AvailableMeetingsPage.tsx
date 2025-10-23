import React from 'react';
import EnhancedFeatureLayout from '../../components/shared/EnhancedFeatureLayout';
import BroadcastMeetings from '../../components/user/BroadcastMeetings';

const AvailableMeetingsPage: React.FC = () => {
  return (
    <EnhancedFeatureLayout
      title="Available Meetings"
      description="Book available meeting slots with your enrolled scholars"
      backTo="/user/dashboard"
    >
      <BroadcastMeetings />
    </EnhancedFeatureLayout>
  );
};

export default AvailableMeetingsPage;
