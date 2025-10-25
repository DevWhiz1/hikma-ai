const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Payment {
  _id: string;
  user: string;
  scholar: {
    _id: string;
    user: {
      name: string;
      email: string;
    };
    photoUrl?: string;
    specializations: string[];
  };
  amount: number;
  currency: string;
  paymentType: 'hourly' | 'monthly' | 'session' | 'subscription';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'crypto';
  transactionId: string;
  description: string;
  sessionId?: string;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  _id: string;
  user: string;
  scholar: {
    _id: string;
    user: {
      name: string;
      email: string;
    };
    photoUrl?: string;
    specializations: string[];
  };
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'pending';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  features: Array<{
    name: string;
    included: boolean;
    limit: number;
  }>;
  paymentMethod: string;
  autoRenew: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentAnalytics {
  totalAmount: number;
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
}

interface CreatePaymentRequest {
  scholarId: string;
  amount: number;
  paymentType: 'hourly' | 'monthly' | 'session' | 'subscription';
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'crypto';
  description: string;
  sessionId?: string;
  subscriptionId?: string;
}

class PaymentService {
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

  async createPayment(paymentData: CreatePaymentRequest): Promise<{ success: boolean; payment: Payment }> {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getUserPayments(params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentType?: string;
  } = {}): Promise<{
    success: boolean;
    payments: Payment[];
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

    return this.request(`/payments/user?${queryParams.toString()}`);
  }

  async getScholarPayments(params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentType?: string;
  } = {}): Promise<{
    success: boolean;
    payments: Payment[];
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

    return this.request(`/payments/scholar?${queryParams.toString()}`);
  }

  async updatePaymentStatus(paymentId: string, status: string, transactionId?: string): Promise<{ success: boolean; payment: Payment }> {
    return this.request(`/payments/${paymentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, transactionId }),
    });
  }

  async getPaymentAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<{ success: boolean; analytics: PaymentAnalytics }> {
    return this.request(`/payments/analytics?period=${period}`);
  }

  async getSubscriptions(status?: string): Promise<{ success: boolean; subscriptions: Subscription[] }> {
    const queryParams = status ? `?status=${status}` : '';
    return this.request(`/payments/subscriptions${queryParams}`);
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<{ success: boolean; subscription: Subscription }> {
    return this.request(`/payments/subscriptions/${subscriptionId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  // Stripe payment methods
  async createStripePaymentIntent(paymentData: {
    scholarId: string;
    amount: number;
    paymentType: 'hourly' | 'monthly' | 'session' | 'subscription';
    description: string;
    sessionId?: string;
    subscriptionId?: string;
  }): Promise<{ success: boolean; clientSecret: string; paymentId: string }> {
    return this.request('/payments/stripe/create-intent', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async confirmStripePayment(paymentIntentId: string): Promise<{ success: boolean; status: string; payment?: Payment }> {
    return this.request('/payments/stripe/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId }),
    });
  }
}

export const paymentService = new PaymentService();
export type { Payment, Subscription, PaymentAnalytics, CreatePaymentRequest };
