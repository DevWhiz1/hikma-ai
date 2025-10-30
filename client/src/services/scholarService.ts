import axios from 'axios';
const API_ROOT = `${import.meta.env.VITE_API_URL}`;
const API = `${API_ROOT}/scholars`;

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const applyScholar = (data: any) =>
  axios.post(`${API}/apply`, data, { headers: authHeader() }).then(r => r.data);

export const getScholars = () =>
  axios.get(`${API}/list`, { headers: authHeader() }).then(r => {
    try {
      localStorage.setItem('cached_scholars', JSON.stringify({ at: Date.now(), data: r.data }));
    } catch {}
    return r.data;
  });

export const getCachedScholars = (): any[] | null => {
  try {
    const raw = localStorage.getItem('cached_scholars');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.at > 1000 * 60 * 10) return null; // 10 min cache
    return obj.data;
  } catch {
    return null;
  }
};

export const enrollScholar = (id: string) =>
  axios.post(`${API}/enroll`, { scholarId: id }, { headers: authHeader() }).then(r => r.data);

export const leaveFeedback = (data: any) =>
  axios.post(`${API}/feedback`, data, { headers: authHeader() }).then(r => r.data);

export const getMyEnrollments = () =>
  axios.get(`${API}/my-enrollments`, { headers: authHeader() }).then(r => r.data);

export const unenroll = (scholarId: string) =>
  axios.post(`${API}/unenroll`, { scholarId }, { headers: authHeader() }).then(r => r.data);

export const getMyScholarProfile = () =>
  axios.get(`${API}/me`, { headers: authHeader() }).then(r => r.data);

export const updateMyScholarProfile = (data: any) =>
  axios.put(`${API}/me`, data, { headers: authHeader() }).then(r => r.data);

export const uploadPhoto = (file: File) => {
  const form = new FormData();
  form.append('photo', file);
  return axios.post(`${API_ROOT}/upload/photo`, form, { headers: { ...authHeader() } }).then(r => r.data);
};

export const getMyEnrolledStudents = () =>
  axios.get(`${API}/enrolled-students`, { headers: authHeader() }).then(r => r.data);

export const startDirectChat = (scholarId: string) =>
  axios.post(`${API}/start-chat`, { scholarId }, { headers: authHeader() }).then(r => r.data);

export const startChatWithStudent = (studentId: string) =>
  axios.post(`${API}/start-chat-with-student`, { studentId }, { headers: authHeader() }).then(r => r.data);


