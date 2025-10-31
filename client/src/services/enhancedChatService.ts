const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ChatSession {
  _id: string;
  title: string;
  lastMessage?: string;
  lastActivity: string;
  messageCount: number;
  kind: 'ai' | 'direct';
  messages?: ChatMessage[];
  createdAt?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  type?: 'text' | 'meeting_request' | 'meeting_scheduled' | 'meeting_link';
  metadata?: {
    scheduledTime?: string | Date;
    meetingLink?: string;
    meetLink?: string;
    roomId?: string;
  };
}

interface Scholar {
  _id: string;
  name: string;
  email: string;
  photoUrl?: string;
  specializations: string[];
  isActive: boolean;
  averageRating: number;
}

interface ScholarStatus {
  _id: string;
  name: string;
  isOnline: boolean;
  lastSeen: string;
  isActive: boolean;
}

class EnhancedChatService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || 'Request failed';
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.status === 404 ? 'Session not found' : response.statusText || 'Request failed';
      }
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }

  // Get chat sessions (filtered by type)
  async getSessions(type?: 'ai' | 'scholar'): Promise<{ success: boolean; sessions: ChatSession[] }> {
    const queryParams = type ? `?type=${type}` : '';
    return this.request(`/enhanced-chat/sessions${queryParams}`);
  }

  // Get a specific chat session
  async getSession(sessionId: string): Promise<{ success: boolean; session: ChatSession }> {
    return this.request(`/enhanced-chat/sessions/${sessionId}`);
  }

  // Send AI message
  async sendAIMessage(data: {
    sessionId?: string;
    message: string;
    conversation?: ChatMessage[];
  }): Promise<{ success: boolean; session: ChatSession; generated_text: string }> {
    return this.request('/enhanced-chat/ai/message', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Send scholar message
  async sendScholarMessage(data: {
    sessionId: string;
    message: string;
  }): Promise<{ success: boolean; session: ChatSession }> {
    return this.request('/enhanced-chat/scholar/message', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Start direct chat with scholar
  async startDirectChat(scholarId: string): Promise<{
    success: boolean;
    studentSessionId: string;
    scholarSessionId: string;
    scholar: Scholar;
  }> {
    return this.request('/enhanced-chat/scholar/start', {
      method: 'POST',
      body: JSON.stringify({ scholarId }),
    });
  }

  // Get scholar status
  async getScholarStatus(scholarId: string): Promise<{ success: boolean; scholar: ScholarStatus }> {
    return this.request(`/enhanced-chat/scholar/${scholarId}/status`);
  }

  // Delete chat session
  async deleteSession(sessionId: string): Promise<{ success: boolean }> {
    return this.request(`/enhanced-chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Legacy methods for backward compatibility
  async createSession(): Promise<{ session: ChatSession }> {
    const response = await this.sendAIMessage({ message: 'Hello' });
    return { session: response.session };
  }

  async sendMessage(data: {
    message: string;
    conversation: ChatMessage[];
    sessionId: string;
  }): Promise<{ generated_text: string; session?: ChatSession }> {
    const response = await this.sendAIMessage(data);
    return {
      generated_text: response.generated_text,
      session: response.session
    };
  }

  async sendDirectMessage(sessionId: string, message: string): Promise<void> {
    await this.sendScholarMessage({ sessionId, message });
  }
}

export const enhancedChatService = new EnhancedChatService();
export type { ChatSession, ChatMessage, Scholar, ScholarStatus };
