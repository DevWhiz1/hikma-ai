import axios from 'axios';

const API_ROOT = `${import.meta.env.VITE_API_URL}`;

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface SubmitRatingReviewPayload {
  scholarId: string;
  ratingValue?: number; // 1-5
  comment?: string; // optional
}

export async function submitRatingReview(payload: SubmitRatingReviewPayload) {
  const res = await axios.post(`${API_ROOT}/ratings-reviews/submit`, payload, { headers: authHeader() });
  return res.data;
}

export async function getRatingOverview(scholarId: string) {
  const res = await axios.get(`${API_ROOT}/ratings-reviews/overview/${scholarId}`, { headers: authHeader() });
  return res.data;
}

export async function getScholarReviews(scholarId: string) {
  const res = await axios.get(`${API_ROOT}/ratings-reviews/reviews/${scholarId}`, { headers: authHeader() });
  return res.data;
}
