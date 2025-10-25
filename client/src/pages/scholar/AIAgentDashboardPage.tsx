import React from 'react';
import EnhancedFeatureLayout from '../../components/shared/EnhancedFeatureLayout';
import AIAgentDashboard from '../../components/scholar/AIAgentDashboard';
import { authService } from '../../services/authService';

const AIAgentDashboardPage: React.FC = () => {
  const user = authService.getUser();

  return (
    <EnhancedFeatureLayout
      title="AI Agent Dashboard"
      description="Complete AI-powered scheduling solution with all intelligent features"
    >
      <AIAgentDashboard scholarId={user?.id || ''} />
    </EnhancedFeatureLayout>
  );
};

export default AIAgentDashboardPage;
