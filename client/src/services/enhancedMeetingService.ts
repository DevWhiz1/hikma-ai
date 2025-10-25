const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class EnhancedMeetingService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/enhanced-meetings${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Get comprehensive meeting analytics
  async getMeetingAnalytics(timeRange = 30, scholarId?: string) {
    const params = new URLSearchParams();
    params.append('timeRange', timeRange.toString());
    if (scholarId) params.append('scholarId', scholarId);
    
    return this.request(`/analytics?${params.toString()}`);
  }

  // AI-powered meeting schedule optimization
  async optimizeMeetingSchedule(data: {
    scholarId?: string;
    studentPreferences?: {
      preferredTimes?: string[];
      timezone?: string;
      learningStyle?: string;
      interests?: string[];
    };
  }) {
    return this.request('/optimize-schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get AI-powered topic suggestions
  async getTopicSuggestions(data: {
    scholarId?: string;
    studentId?: string;
    context?: {
      duration?: number;
      studentLevel?: string;
      interests?: string[];
      recentQuestions?: string[];
    };
  }) {
    return this.request('/topic-suggestions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Resolve scheduling conflicts with AI assistance
  async resolveSchedulingConflict(data: {
    scholarId: string;
    studentId: string;
    proposedTime: string;
    conflictReason: string;
    alternativeTimes?: string[];
  }) {
    return this.request('/resolve-conflict', {
      method: 'POST',
      body: JSON.stringify({ conflictData: data }),
    });
  }

  // Generate meeting templates based on scholar expertise
  async generateMeetingTemplates(scholarId?: string) {
    return this.request('/generate-templates', {
      method: 'POST',
      body: JSON.stringify({ scholarId }),
    });
  }

  // Get prayer time aware scheduling recommendations
  async getPrayerTimeAwareSchedule(data: {
    scholarId?: string;
    dateRange?: number;
  }) {
    return this.request('/prayer-time-schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Setup intelligent meeting reminders
  async setupSmartReminders(data: {
    meetingId: string;
    reminderTypes?: string[];
  }) {
    return this.request('/setup-reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Book meeting with AI assistance
  async bookMeetingWithAI(data: {
    broadcastId: string;
    timeIndex: number;
    preferences?: {
      learningStyle?: string;
      interests?: string[];
      previousTopics?: string[];
    };
  }) {
    return this.request('/book-with-ai', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get meeting effectiveness insights
  async getMeetingInsights(scholarId?: string, timeRange = 30) {
    const params = new URLSearchParams();
    if (scholarId) params.append('scholarId', scholarId);
    params.append('timeRange', timeRange.toString());
    
    return this.request(`/insights?${params.toString()}`);
  }

  // Validate all system credentials
  async validateCredentials() {
    const response = await fetch(`${API_URL}/validate-credentials`);
    if (!response.ok) {
      throw new Error('Failed to validate credentials');
    }
    return response.json();
  }
}

export default new EnhancedMeetingService();
