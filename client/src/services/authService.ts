import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'scholar' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  async signup(data: { name: string; email: string; password: string; role?: string; scholarProfile?: any }): Promise<AuthResponse> {
    const res = await axios.post(`${API_URL}/auth/signup`, data);
    return res.data;
  },
  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await axios.post(`${API_URL}/auth/login`, data);
    return res.data;
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  saveSession(resp: AuthResponse) {
    localStorage.setItem('token', resp.token);
    localStorage.setItem('user', JSON.stringify(resp.user));
  },
  getUser(): AuthUser | null {
    try { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  getToken(): string | null {
    return localStorage.getItem('token');
  }
};
