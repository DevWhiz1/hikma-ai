import React from 'react';
import EnhancedFeatureLayout from '../../components/shared/EnhancedFeatureLayout';
import RecurringMeetings from '../../components/scholar/RecurringMeetings';

const RecurringMeetingsPage: React.FC = () => {
  return (
    <EnhancedFeatureLayout
      title="Recurring Meetings"
      description="Set up and manage automated meeting series"
    >
      <RecurringMeetings />
    </EnhancedFeatureLayout>
  );
};

export default RecurringMeetingsPage;
