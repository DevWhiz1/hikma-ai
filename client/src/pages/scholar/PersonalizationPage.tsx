import React from 'react';
import EnhancedFeatureLayout from '../../components/shared/EnhancedFeatureLayout';
import PersonalizationEngine from '../../components/scholar/PersonalizationEngine';
import { authService } from '../../services/authService';

const PersonalizationPage: React.FC = () => {
  const user = authService.getUser();

  const handleRecommendationsGenerated = (recommendations: any[]) => {
    console.log('Generated recommendations:', recommendations);
    // Implement recommendation handling logic
  };

  return (
    <EnhancedFeatureLayout
      title="Personalization Engine"
      description="AI-powered personalized scheduling for each student"
    >
      <PersonalizationEngine 
        scholarId={user?.id || ''} 
        onRecommendationsGenerated={handleRecommendationsGenerated} 
      />
    </EnhancedFeatureLayout>
  );
};

export default PersonalizationPage;
