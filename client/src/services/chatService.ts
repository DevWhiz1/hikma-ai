import axios from 'axios';

// Define API base URL - loaded from environment variable (see .env file)
const API_URL = import.meta.env.VITE_API_URL;

// Set auth header for all requests
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatSession {
  _id: string;
  title: string;
  messages: ChatMessage[];
  lastActivity: string;
  createdAt: string;
}

export const chatService = {
  async sendMessage(payload: { message: string; conversation: ChatMessage[]; sessionId?: string }) {
    const response = await axios.post(`${API_URL}/scholar-ai`, payload);
    return response.data;
  },

  async getSessions(): Promise<{ sessions: ChatSession[] }> {
    const response = await axios.get(`${API_URL}/chat/sessions`);
    return response.data;
  },

  async createSession(title?: string): Promise<{ session: ChatSession }> {
    const response = await axios.post(`${API_URL}/chat/sessions`, { title });
    return response.data;
  },

  async getSession(sessionId: string): Promise<{ session: ChatSession }> {
    const response = await axios.get(`${API_URL}/chat/sessions/${sessionId}`);
    return response.data;
  },

  async deleteSession(sessionId: string): Promise<{ success: boolean }> {
    const response = await axios.delete(`${API_URL}/chat/sessions/${sessionId}`);
    return response.data;
  },

  async getHistory(limit: number = 50) {
    const response = await axios.get(`${API_URL}/chat/history?limit=${limit}`);
    return response.data.messages as ChatMessage[];
  }
};