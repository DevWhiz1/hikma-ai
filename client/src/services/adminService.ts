import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL}/admin`;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const getUsers = () => axios.get(`${API}/users`, getAuthHeaders()).then(r=>r.data);
export const blockUser = (id: string) => axios.post(`${API}/users/${id}/block`, {}, getAuthHeaders()).then(r=>r.data);
export const unblockUser = (id: string) => axios.post(`${API}/users/${id}/unblock`, {}, getAuthHeaders()).then(r=>r.data);
export const getReviews = () => axios.get(`${API}/reviews`, getAuthHeaders()).then(r=>r.data);
export const getSensitiveLogs = () => axios.get(`${API}/sensitive-logs`, getAuthHeaders()).then(r=>r.data);
export const getScholarApplications = () => axios.get(`${API}/scholar-applications`, getAuthHeaders()).then(r=>r.data);
export const approveScholarApplication = (id: string) => axios.post(`${API}/scholar-applications/${id}/approve`, {}, getAuthHeaders()).then(r=>r.data);
export const rejectScholarApplication = (id: string) => axios.post(`${API}/scholar-applications/${id}/reject`, {}, getAuthHeaders()).then(r=>r.data);
export const removeScholar = (id: string) => axios.delete(`${API}/scholars/${id}`, getAuthHeaders()).then(r=>r.data);
export const removeScholarByUser = (userId: string) => axios.delete(`${API}/scholars/by-user/${userId}`, getAuthHeaders()).then(r=>r.data);
export const adminMessageUser = (userId: string, message: string) => axios.post(`${API}/users/${userId}/message`, { message }, getAuthHeaders()).then(r=>r.data);


