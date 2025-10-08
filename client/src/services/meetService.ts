import axios from 'axios';
const API = `${import.meta.env.VITE_API_URL}/meet`;

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const createMeet = (scholarId: string, studentId: string, topic: string) =>
  axios.post(`${API}/create`, { scholarId, studentId, topic }, { headers: authHeader() }).then(r => r.data);


