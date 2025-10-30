import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const notificationService = {
  sendSmart: async (payload: { text: string; audience: 'all'|'selected'; studentIds?: string[] }) => {
    const res = await axios.post(`${API_URL}/notifications/smart`, payload, getAuthHeaders());
    return res.data;
  },
  listRules: async () => {
    const res = await axios.get(`${API_URL}/notifications/rules`, getAuthHeaders());
    return res.data;
  },
  createRule: async (rule: any) => {
    const res = await axios.post(`${API_URL}/notifications/rules`, rule, getAuthHeaders());
    return res.data;
  },
  updateRule: async (id: string, rule: any) => {
    const res = await axios.put(`${API_URL}/notifications/rules/${id}`, rule, getAuthHeaders());
    return res.data;
  },
  deleteRule: async (id: string) => {
    const res = await axios.delete(`${API_URL}/notifications/rules/${id}`, getAuthHeaders());
    return res.data;
  },
  runRulesNow: async () => {
    const res = await axios.post(`${API_URL}/notifications/rules/run`, {}, getAuthHeaders());
    return res.data;
  }
};

export default notificationService;


