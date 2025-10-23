const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Scholar {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  bio: string;
  specializations: string[];
  languages: string[];
  experienceYears: number;
  qualifications: string;
  demoVideoUrl?: string;
  photoUrl?: string;
  approved: boolean;
  teachingPhilosophy?: string;
  availability?: string;
  hourlyRate: number;
  monthlyRate: number;
  certifications?: string;
  achievements?: string;
  socialMedia?: string;
  website?: string;
  country?: string;
  timezone?: string;
  averageRating: number;
  totalReviews: number;
  totalStudents: number;
  totalSessions: number;
  isActive: boolean;
  isVerified: boolean;
  verificationDocuments: string[];
  subscriptionPlans: Array<{
    name: string;
    price: number;
    duration: 'monthly' | 'quarterly' | 'yearly';
    features: string[];
    isActive: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
  analytics?: {
    totalEarnings: number;
    activeSubscriptions: number;
    averageRating: number;
    totalSessions: number;
  };
}

interface ScholarDetails extends Scholar {
  analytics: {
    totalEarnings: number;
    totalSessions: number;
    activeSubscriptions: number;
    totalStudents: number;
    averageRating: number;
    monthlyEarnings: number;
  };
}

interface PaymentAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
}

interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  totalRevenue: number;
}

interface PlatformOverview {
  totalUsers: number;
  totalScholars: number;
  totalPayments: number;
  totalSubscriptions: number;
  totalRevenue: number;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
  recentScholars: Array<{
    _id: string;
    user: {
      name: string;
      email: string;
    };
    specializations: string[];
    photoUrl?: string;
    createdAt: string;
  }>;
  recentPayments: Array<{
    _id: string;
    amount: number;
    status: string;
    user: {
      name: string;
    };
    scholar: {
      user: {
        name: string;
      };
    };
    createdAt: string;
  }>;
}

class EnhancedAdminService {
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
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async getAllScholars(params: {
    page?: number;
    limit?: number;
    status?: string;
    country?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    success: boolean;
    scholars: Scholar[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request(`/enhanced-admin/scholars?${queryParams.toString()}`);
  }

  async getScholarDetails(scholarId: string): Promise<{ success: boolean; scholar: ScholarDetails }> {
    return this.request(`/enhanced-admin/scholars/${scholarId}`);
  }

  async updateScholarStatus(scholarId: string, updates: {
    approved?: boolean;
    isActive?: boolean;
    isVerified?: boolean;
  }): Promise<{ success: boolean; scholar: Scholar }> {
    return this.request(`/enhanced-admin/scholars/${scholarId}/status`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async removeScholar(scholarId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/enhanced-admin/scholars/${scholarId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  async getPaymentAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<{
    success: boolean;
    analytics: PaymentAnalytics;
    topScholars: Array<{
      _id: string;
      totalEarnings: number;
      transactionCount: number;
      scholar: Scholar[];
      user: Array<{
        name: string;
        email: string;
      }>;
    }>;
  }> {
    return this.request(`/enhanced-admin/analytics/payments?period=${period}`);
  }

  async getSubscriptionAnalytics(): Promise<{
    success: boolean;
    analytics: SubscriptionAnalytics;
    planAnalytics: Array<{
      _id: string;
      count: number;
      revenue: number;
    }>;
  }> {
    return this.request('/enhanced-admin/analytics/subscriptions');
  }

  async getPlatformOverview(): Promise<{
    success: boolean;
    overview: PlatformOverview;
  }> {
    return this.request('/enhanced-admin/overview');
  }
}

export const enhancedAdminService = new EnhancedAdminService();
export type { Scholar, ScholarDetails, PaymentAnalytics, SubscriptionAnalytics, PlatformOverview };
