import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type Question = {
  _id?: string;
  type: 'mcq' | 'short-answer' | 'true-false' | 'essay';
  prompt: string;
  options?: string[];
  answer?: any;
};

export type Assignment = {
  _id: string;
  title: string;
  description?: string;
  type: 'quiz' | 'essay' | 'short-answer' | 'multi-part';
  // new kind field to distinguish assignment vs quiz behavior
  kind?: 'assignment' | 'quiz';
  status: 'draft' | 'published' | 'closed';
  dueDate?: string;
  // quiz timing
  quizWindowStart?: string;
  quizWindowEnd?: string;
  durationMinutes?: number;
  questions: Question[];
  sources?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type Submission = {
  _id: string;
  assignment: string;
  student: string | { _id: string; name: string; email: string }; // Can be ObjectId or populated object
  answers: { questionId: string; answerText?: string; selectedOption?: any }[];
  status: 'in_progress' | 'submitted' | 'graded' | 'resubmission-requested';
  grade?: number;
  feedback?: string;
  aiGrading?: {
    totalScore?: number;
    perQuestion?: Array<{ questionId: string; score: number; feedback?: string }>;
    reasoning?: string;
    model?: string;
    version?: string;
  };
  manualGrading?: {
    totalScore?: number;
    perQuestion?: Array<{ questionId: string; score: number; feedback?: string }>;
    feedback?: string;
    by?: string;
    at?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string;
  endAt?: string;
  submittedAt?: string;
  autoSubmitted?: boolean;
  gradedBy?: string | { _id: string; name: string };
};

export const assignmentService = {
  async create(data: Partial<Assignment> & { aiSpec?: any }) {
    const res = await axios.post(`${API_URL}/assignments`, data);
    return res.data;
  },
  async generate(id: string) {
    const res = await axios.post(`${API_URL}/assignments/${id}/generate`);
    return res.data;
  },
  async publish(id: string) {
    const res = await axios.post(`${API_URL}/assignments/${id}/publish`);
    return res.data;
  },
  async close(id: string) {
    const res = await axios.post(`${API_URL}/assignments/${id}/close`);
    return res.data;
  },
  async list() {
    const res = await axios.get(`${API_URL}/assignments`);
    return res.data as { ok: boolean; assignments: Assignment[] };
  },
  // 🚀 NEW: Get assignments for student based on enrollments
  async getStudentAssignments(kind?: 'assignment' | 'quiz') {
    const params = kind ? { kind } : {};
    const res = await axios.get(`${API_URL}/assignments/student/enrolled`, { params });
    return res.data as { ok: boolean; assignments: Assignment[] };
  },
  async get(id: string) {
    const res = await axios.get(`${API_URL}/assignments/${id}`);
    return res.data as { ok: boolean; assignment: Assignment };
  },
  async update(id: string, data: Partial<Assignment> & { aiSpec?: any }) {
    const res = await axios.put(`${API_URL}/assignments/${id}`, data);
    return res.data as { ok: boolean; assignment: Assignment };
  },
  async addQuestion(id: string, q: any) {
    const res = await axios.post(`${API_URL}/assignments/${id}/questions`, q);
    return res.data;
  },
  async updateQuestion(id: string, qid: string, q: any) {
    const res = await axios.put(`${API_URL}/assignments/${id}/questions/${qid}`, q);
    return res.data;
  },
  async deleteQuestion(id: string, qid: string) {
    const res = await axios.delete(`${API_URL}/assignments/${id}/questions/${qid}`);
    return res.data;
  },

  // Submissions
  async startAttempt(assignmentId: string) {
    const res = await axios.post(`${API_URL}/submissions/assignment/${assignmentId}/start`);
    return res.data as { ok: boolean; submission: Submission };
  },
  async submit(assignmentId: string, answers: { questionId: string; answerText?: string; selectedOption?: any }[]) {
    const res = await axios.post(`${API_URL}/submissions/assignment/${assignmentId}/submit`, { answers });
    return res.data as { ok: boolean; submission: Submission };
  },
  async grade(submissionId: string) {
    const res = await axios.post(`${API_URL}/submissions/${submissionId}/grade`);
    return res.data;
  },
  async manualGrade(submissionId: string, data: { totalScore?: number; perQuestion?: { questionId: string; score: number; feedback?: string }[]; feedback?: string }) {
    const res = await axios.post(`${API_URL}/submissions/${submissionId}/manual-grade`, data);
    return res.data;
  },
  async override(submissionId: string, data: { grade?: number; feedback?: string; reason?: string }) {
    const res = await axios.post(`${API_URL}/submissions/${submissionId}/override`, data);
    return res.data;
  },
  async listSubmissions(assignmentId: string) {
    const res = await axios.get(`${API_URL}/submissions/assignment/${assignmentId}`);
    return res.data as { ok: boolean; submissions: Submission[] };
  },
  async mySubmissions() {
    const res = await axios.get(`${API_URL}/submissions/me`);
    return res.data as { ok: boolean; submissions: Submission[] };
  }
  ,
  async inbox(status?: string) {
    const url = status ? `${API_URL}/submissions/inbox?status=${encodeURIComponent(status)}` : `${API_URL}/submissions/inbox`;
    const res = await axios.get(url);
    return res.data as { ok: boolean; submissions: Submission[] };
  }
};
