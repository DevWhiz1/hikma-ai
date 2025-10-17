const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface FeedbackData {
  rating: number;
  category: string;
  subject: string;
  message: string;
  contactEmail?: string;
  priority: string;
}

interface FeedbackResponse {
  success: boolean;
  message: string;
  feedback: {
    id: string;
    rating: number;
    category: string;
    subject: string;
    priority: string;
    status: string;
    createdAt: string;
  };
}

interface FeedbackListResponse {
  success: boolean;
  feedback: Array<{
    _id: string;
    rating: number;
    category: string;
    subject: string;
    priority: string;
    status: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class FeedbackService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async submitFeedback(data: FeedbackData): Promise<FeedbackResponse> {
    const response = await fetch(`${API_URL}/feedback/submit`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit feedback');
    }

    return response.json();
  }

  async getUserFeedback(page: number = 1, limit: number = 10, filters?: {
    status?: string;
    category?: string;
  }): Promise<FeedbackListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.category && { category: filters.category })
    });

    const response = await fetch(`${API_URL}/feedback/my-feedback?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch feedback');
    }

    return response.json();
  }

  async getFeedbackDetails(id: string) {
    const response = await fetch(`${API_URL}/feedback/my-feedback/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch feedback details');
    }

    return response.json();
  }

  // Admin methods
  async getAllFeedback(page: number = 1, limit: number = 20, filters?: {
    status?: string;
    category?: string;
    priority?: string;
  }) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.priority && { priority: filters.priority })
    });

    console.log('Making request to:', `${API_URL}/feedback/admin/all?${params}`);
    console.log('Headers:', this.getAuthHeaders());

    const response = await fetch(`${API_URL}/feedback/admin/all?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const error = await response.json();
      console.error('API Error:', error);
      throw new Error(error.error || 'Failed to fetch all feedback');
    }

    const data = await response.json();
    console.log('API Response data:', data);
    return data;
  }

  async updateFeedbackStatus(id: string, status: string, adminNotes?: string) {
    const response = await fetch(`${API_URL}/feedback/admin/${id}/status`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, adminNotes })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update feedback status');
    }

    return response.json();
  }

  // Scholar methods - get feedback related to their teaching
  async getScholarFeedback(page: number = 1, limit: number = 20, filters?: {
    status?: string;
    category?: string;
    priority?: string;
  }) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.priority && { priority: filters.priority })
    });

    const response = await fetch(`${API_URL}/feedback/scholar/all?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch scholar feedback');
    }

    return response.json();
  }

  async updateScholarFeedbackStatus(id: string, status: string, scholarNotes?: string) {
    const response = await fetch(`${API_URL}/feedback/scholar/${id}/status`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, scholarNotes })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update feedback status');
    }

    return response.json();
  }
}

export const feedbackService = new FeedbackService();
export type { FeedbackData, FeedbackResponse, FeedbackListResponse };
