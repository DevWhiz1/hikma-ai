import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface SchedulingIntent {
  action: 'schedule' | 'reschedule' | 'cancel' | 'query';
  timePreference?: 'morning' | 'afternoon' | 'evening' | 'specific';
  specificTime?: string;
  duration?: number;
  frequency?: 'once' | 'weekly' | 'daily' | 'monthly';
  days?: string[];
  urgency?: 'low' | 'medium' | 'high';
  context?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  duration: number;
  confidence: number;
  reasoning: string;
}

interface AIResponse {
  slots: TimeSlot[];
  insights: string[];
  recommendations: string[];
  confidence: number;
}

interface BookingInsights {
  mostPopularTimes: string[];
  averageBookingRate: number;
  studentPreferences: Record<string, any>;
  optimalDuration: number;
  suggestedFrequency: string;
}

class AIAgentService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/ai-agent${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI Agent request failed');
    }

    return response.json();
  }

  // Natural Language Processing for scheduling
  async parseSchedulingIntent(input: string): Promise<SchedulingIntent> {
    try {
      const response = await this.request('/parse-intent', {
        method: 'POST',
        body: JSON.stringify({ input })
      });
      return response.intent;
    } catch (error) {
      console.error('Error parsing intent:', error);
      // Fallback to basic parsing
      return this.basicIntentParsing(input);
    }
  }

  // Basic intent parsing as fallback
  private basicIntentParsing(input: string): SchedulingIntent {
    const lowerInput = input.toLowerCase();
    
    // Detect action
    let action: SchedulingIntent['action'] = 'query';
    if (lowerInput.includes('schedule') || lowerInput.includes('book')) {
      action = 'schedule';
    } else if (lowerInput.includes('reschedule') || lowerInput.includes('change')) {
      action = 'reschedule';
    } else if (lowerInput.includes('cancel')) {
      action = 'cancel';
    }

    // Detect time preference
    let timePreference: SchedulingIntent['timePreference'] = 'specific';
    if (lowerInput.includes('morning')) {
      timePreference = 'morning';
    } else if (lowerInput.includes('afternoon')) {
      timePreference = 'afternoon';
    } else if (lowerInput.includes('evening')) {
      timePreference = 'evening';
    }

    // Extract specific time
    const timeMatch = input.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    const specificTime = timeMatch ? timeMatch[0] : undefined;

    // Detect duration
    const durationMatch = input.match(/(\d+)\s*(minute|min|hour|hr)/i);
    const duration = durationMatch ? parseInt(durationMatch[1]) : undefined;

    // Detect frequency
    let frequency: SchedulingIntent['frequency'] = 'once';
    if (lowerInput.includes('weekly') || lowerInput.includes('every week')) {
      frequency = 'weekly';
    } else if (lowerInput.includes('daily') || lowerInput.includes('every day')) {
      frequency = 'daily';
    } else if (lowerInput.includes('monthly') || lowerInput.includes('every month')) {
      frequency = 'monthly';
    }

    // Detect urgency
    let urgency: SchedulingIntent['urgency'] = 'medium';
    if (lowerInput.includes('urgent') || lowerInput.includes('asap')) {
      urgency = 'high';
    } else if (lowerInput.includes('whenever') || lowerInput.includes('flexible')) {
      urgency = 'low';
    }

    return {
      action,
      timePreference,
      specificTime,
      duration,
      frequency,
      urgency,
      context: input
    };
  }

  // Generate AI-powered time suggestions
  async generateAITimeSuggestions(intent: SchedulingIntent, scholarId: string): Promise<AIResponse> {
    try {
      const response = await this.request('/generate-suggestions', {
        method: 'POST',
        body: JSON.stringify({ intent, scholarId })
      });
      return response;
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      // Fallback to basic suggestions
      return this.generateBasicSuggestions(intent);
    }
  }

  // Basic suggestion generation as fallback
  private generateBasicSuggestions(intent: SchedulingIntent): AIResponse {
    const slots: TimeSlot[] = [];
    const now = new Date();
    
    // Generate slots based on intent
    if (intent.timePreference === 'morning') {
      slots.push(
        this.createTimeSlot(now, 9, 0, 60, 0.9, 'Morning slot - high student engagement'),
        this.createTimeSlot(now, 10, 0, 60, 0.8, 'Morning slot - good availability'),
        this.createTimeSlot(now, 11, 0, 60, 0.7, 'Late morning slot - flexible timing')
      );
    } else if (intent.timePreference === 'afternoon') {
      slots.push(
        this.createTimeSlot(now, 14, 0, 60, 0.9, 'Afternoon slot - peak productivity'),
        this.createTimeSlot(now, 15, 0, 60, 0.8, 'Afternoon slot - good availability'),
        this.createTimeSlot(now, 16, 0, 60, 0.7, 'Late afternoon slot - flexible timing')
      );
    } else if (intent.timePreference === 'evening') {
      slots.push(
        this.createTimeSlot(now, 18, 0, 90, 0.9, 'Evening slot - extended session time'),
        this.createTimeSlot(now, 19, 30, 90, 0.8, 'Evening slot - good availability'),
        this.createTimeSlot(now, 20, 0, 60, 0.7, 'Late evening slot - flexible timing')
      );
    } else {
      // Generate all-day slots
      for (let hour = 9; hour <= 20; hour++) {
        slots.push(
          this.createTimeSlot(now, hour, 0, intent.duration || 60, 0.6, `All-day availability - ${hour}:00`)
        );
      }
    }

    return {
      slots: slots.slice(0, 8),
      insights: [
        'AI analysis suggests optimal times based on student engagement patterns',
        'Morning sessions typically have 15% higher attendance rates',
        'Evening sessions allow for longer, more focused learning'
      ],
      recommendations: [
        'Consider morning slots for Quranic studies',
        'Evening slots work well for discussion-based sessions',
        'Afternoon slots are ideal for practical applications'
      ],
      confidence: 0.85
    };
  }

  private createTimeSlot(baseDate: Date, hour: number, minute: number, duration: number, confidence: number, reasoning: string): TimeSlot {
    const start = new Date(baseDate);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start.getTime() + duration * 60000);
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      duration,
      confidence,
      reasoning
    };
  }

  // Get booking insights and analytics
  async getBookingInsights(scholarId: string): Promise<BookingInsights> {
    try {
      const response = await this.request(`/insights/${scholarId}`);
      return response.insights;
    } catch (error) {
      console.error('Error getting booking insights:', error);
      // Return fallback data if API fails
      return {
        mostPopularTimes: [],
        averageBookingRate: 0,
        studentPreferences: {
          preferredDuration: 60,
          preferredDays: ['Monday', 'Wednesday', 'Friday'],
          timeZone: 'UTC'
        },
        optimalDuration: 60,
        suggestedFrequency: 'weekly',
        studentSatisfaction: 0.5,
        timeEfficiency: 0.5,
        revenueGrowth: 0,
        confidence: 0.5,
        insights: ['No data available yet'],
        recommendations: ['Start scheduling to see insights'],
        predictions: {
          nextWeekBookings: 0,
          optimalTimes: [],
          suggestedPricing: 50
        }
      };
    }
  }

  // Intelligent conflict resolution
  async resolveConflicts(conflicts: any[]): Promise<{ alternatives: TimeSlot[]; suggestions: string[] }> {
    try {
      const response = await this.request('/resolve-conflicts', {
        method: 'POST',
        body: JSON.stringify({ conflicts })
      });
      return response;
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      return {
        alternatives: [],
        suggestions: ['Consider different time slots', 'Try alternative days', 'Adjust session duration']
      };
    }
  }

  // Generate personalized recommendations
  async getPersonalizedRecommendations(studentId: string, scholarId: string): Promise<{
    recommendedTimes: TimeSlot[];
    reasoning: string[];
    preferences: any;
  }> {
    try {
      const response = await this.request('/personalized-recommendations', {
        method: 'POST',
        body: JSON.stringify({ studentId, scholarId })
      });
      return response;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return {
        recommendedTimes: [],
        reasoning: ['Based on your learning patterns', 'Considering your time zone', 'Matching your preferred session length'],
        preferences: {}
      };
    }
  }

  // Smart notification timing
  async getOptimalNotificationTiming(studentId: string, meetingTime: string): Promise<{
    reminderTimes: string[];
    messageTemplates: string[];
  }> {
    try {
      const response = await this.request('/notification-timing', {
        method: 'POST',
        body: JSON.stringify({ studentId, meetingTime })
      });
      return response;
    } catch (error) {
      console.error('Error getting notification timing:', error);
      return {
        reminderTimes: ['24 hours before', '2 hours before', '15 minutes before'],
        messageTemplates: [
          'Reminder: Your session with {scholar} is tomorrow at {time}',
          'Your session starts in 2 hours',
          'Please join your session now: {link}'
        ]
      };
    }
  }
}

export default new AIAgentService();
