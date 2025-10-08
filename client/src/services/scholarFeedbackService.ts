const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ScholarFeedbackData {
  scholarId: string;
  rating: number;
  category: string;
  subject: string;
  message: string;
  contactEmail?: string;
  priority: string;
}

interface ScholarFeedbackResponse {
  success: boolean;
  message: string;
  feedback: {
    id: string;
    rating: number;
    category: string;
    subject: string;
    priority: string;
    status: string;
    scholar: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    createdAt: string;
  };
}

interface ScholarFeedbackListResponse {
  success: boolean;
  feedback: Array<{
    _id: string;
    rating: number;
    category: string;
    subject: string;
    priority: string;
    status: string;
    scholar?: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    user?: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ScholarFeedbackService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async submitScholarFeedback(data: ScholarFeedbackData): Promise<ScholarFeedbackResponse> {
    const response = await fetch(`${API_URL}/scholar-feedback/submit`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit scholar feedback');
    }

    return response.json();
  }

  async getUserScholarFeedback(page: number = 1, limit: number = 10, filters?: {
    status?: string;
    category?: string;
  }): Promise<ScholarFeedbackListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.category && { category: filters.category })
    });

    const response = await fetch(`${API_URL}/scholar-feedback/my-feedback?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch scholar feedback');
    }

    return response.json();
  }

  async getScholarFeedbackDetails(id: string) {
    const response = await fetch(`${API_URL}/scholar-feedback/my-feedback/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch scholar feedback details');
    }

    return response.json();
  }

  // Scholar methods - get feedback received about them
  async getScholarReceivedFeedback(page: number = 1, limit: number = 20, filters?: {
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

    const response = await fetch(`${API_URL}/scholar-feedback/received?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch received feedback');
    }

    return response.json();
  }

  async updateScholarFeedbackStatus(id: string, status: string, scholarNotes?: string) {
    const response = await fetch(`${API_URL}/scholar-feedback/received/${id}/status`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, scholarNotes })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update scholar feedback status');
    }

    return response.json();
  }
}

export const scholarFeedbackService = new ScholarFeedbackService();
export type { ScholarFeedbackData, ScholarFeedbackResponse, ScholarFeedbackListResponse };
