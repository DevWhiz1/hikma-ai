import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type Notification = {
  _id: string;
  userId: string;
  type: 'assignment' | 'quiz' | 'grade' | 'message' | 'meeting' | 'system';
  title: string;
  message: string;
  metadata?: {
    assignmentId?: string;
    submissionId?: string;
    enrollmentId?: string;
    scholarId?: string;
    scholarName?: string;
    assignmentTitle?: string;
    kind?: 'assignment' | 'quiz';
    dueDate?: string;
    durationMinutes?: number;
    score?: number;
  };
  read: boolean;
  readAt?: string;
  link?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  updatedAt?: string;
};

export const notificationService = {
  /**
   * Get all notifications for current user
   */
  async getAll(unreadOnly = false, page = 1, limit = 50) {
    const params = { unreadOnly: unreadOnly.toString(), page, limit };
    const res = await axios.get(`${API_URL}/notifications`, { params });
    return res.data as {
      ok: boolean;
      notifications: Notification[];
      unreadCount: number;
      pagination: { page: number; limit: number; total: number };
    };
  },

  /**
   * Get unread count
   */
  async getUnreadCount() {
    const res = await axios.get(`${API_URL}/notifications/unread-count`);
    return res.data as { ok: boolean; unreadCount: number };
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(id: string) {
    const res = await axios.put(`${API_URL}/notifications/${id}/read`);
    return res.data as { ok: boolean; notification: Notification };
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const res = await axios.put(`${API_URL}/notifications/all/read`);
    return res.data as { ok: boolean; message: string };
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: string) {
    const res = await axios.delete(`${API_URL}/notifications/${id}`);
    return res.data as { ok: boolean; message: string };
  },

  // Smart notification methods (from main branch)
  sendSmart: async (payload: { text: string; audience: 'all'|'selected'; studentIds?: string[] }) => {
    const res = await axios.post(`${API_URL}/notifications/smart`, payload);
    return res.data;
  },
  listRules: async () => {
    const res = await axios.get(`${API_URL}/notifications/rules`);
    return res.data;
  },
  createRule: async (rule: any) => {
    const res = await axios.post(`${API_URL}/notifications/rules`, rule);
    return res.data;
  },
  updateRule: async (id: string, rule: any) => {
    const res = await axios.put(`${API_URL}/notifications/rules/${id}`, rule);
    return res.data;
  },
  deleteRule: async (id: string) => {
    const res = await axios.delete(`${API_URL}/notifications/rules/${id}`);
    return res.data;
  },
  runRulesNow: async () => {
    const res = await axios.post(`${API_URL}/notifications/rules/run`, {});
    return res.data;
  }
};

export default notificationService;
