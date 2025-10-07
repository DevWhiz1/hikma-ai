import axios from 'axios';
const API = `${import.meta.env.VITE_API_URL}/admin`;

export const getUsers = () => axios.get(`${API}/users`).then(r=>r.data);
export const blockUser = (id: string) => axios.post(`${API}/users/${id}/block`).then(r=>r.data);
export const unblockUser = (id: string) => axios.post(`${API}/users/${id}/unblock`).then(r=>r.data);
export const getReviews = () => axios.get(`${API}/reviews`).then(r=>r.data);
export const getSensitiveLogs = () => axios.get(`${API}/sensitive-logs`).then(r=>r.data);
export const getScholarApplications = () => axios.get(`${API}/scholar-applications`).then(r=>r.data);
export const approveScholarApplication = (id: string) => axios.post(`${API}/scholar-applications/${id}/approve`).then(r=>r.data);
export const rejectScholarApplication = (id: string) => axios.post(`${API}/scholar-applications/${id}/reject`).then(r=>r.data);
export const removeScholar = (id: string) => axios.delete(`${API}/scholars/${id}`).then(r=>r.data);
export const removeScholarByUser = (userId: string) => axios.delete(`${API}/scholars/by-user/${userId}`).then(r=>r.data);
export const adminMessageUser = (userId: string, message: string) => axios.post(`${API}/users/${userId}/message`, { message }).then(r=>r.data);


