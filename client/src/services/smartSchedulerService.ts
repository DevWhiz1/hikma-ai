const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class SmartSchedulerService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/smart-scheduler${endpoint}`, {
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

  // Get optimal meeting times for a scholar
  async getOptimalTimes(duration = 60, daysAhead = 14) {
    return this.request(`/optimal-times?duration=${duration}&daysAhead=${daysAhead}`);
  }

  // Schedule a meeting using smart scheduler
  async scheduleSmartMeeting(data: {
    studentId: string;
    scheduledTime: string;
    duration?: number;
    topic?: string;
  }) {
    return this.request('/schedule-meeting', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Broadcast meeting times to all enrolled students
  async broadcastMeetingTimes(data: {
    meetingTimes: Array<{
      start: string;
      end: string;
      duration?: number;
      maxParticipants?: number;
    }>;
    title?: string;
    description?: string;
  }) {
    return this.request('/broadcast-times', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Handle student reschedule request
  async handleStudentRescheduleRequest(data: {
    chatId: string;
    proposedTime: string;
    note?: string;
  }) {
    return this.request('/reschedule-request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get scholar's upcoming meetings
  async getScholarUpcomingMeetings() {
    return this.request('/scholar/upcoming');
  }

  // Get student's upcoming meetings
  async getStudentUpcomingMeetings() {
    return this.request('/student/upcoming');
  }

  // Get scholar's availability for a date range
  async getScholarAvailability(startDate: string, endDate: string) {
    return this.request(`/availability?startDate=${startDate}&endDate=${endDate}`);
  }

  // Auto-schedule meetings based on student requests
  async autoScheduleMeetings(data: {
    studentRequests: Array<{
      studentId: string;
      topic?: string;
    }>;
  }) {
    return this.request('/auto-schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Book a meeting from broadcast
  async bookBroadcastMeeting(data: {
    broadcastId: string;
    timeIndex: number;
  }) {
    return this.request('/book-broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get available broadcast meetings for a student
  async getAvailableBroadcasts() {
    return this.request('/available-broadcasts');
  }

  // Get scholar's broadcast meetings
  async getScholarBroadcasts() {
    return this.request('/scholar/broadcasts');
  }

  // Cancel a broadcast meeting
  async cancelBroadcastMeeting(data: {
    broadcastId: string;
  }) {
    return this.request('/cancel-broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Validate meeting access based on time
  async validateMeetingAccess(meetingId: string) {
    return this.request(`/meeting/${meetingId}/access`);
  }
}

export default new SmartSchedulerService();
