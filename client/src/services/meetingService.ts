import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const meetingService = {
  // Request a meeting with a scholar
  requestMeeting: async (scholarId: string, reason?: string) => {
    const response = await axios.post(`${API_URL}/meetings/request-meeting`, {
      scholarId,
      reason
    });
    return response.data;
  },

  // Schedule a meeting (scholar only)
  scheduleMeeting: async (chatId: string, scheduledTime: string) => {
    const response = await axios.post(`${API_URL}/meetings/schedule-meeting`, {
      chatId,
      scheduledTime
    });
    return response.data;
  },

  // Get chat messages
  getChatMessages: async (chatId: string) => {
    const response = await axios.get(`${API_URL}/meetings/${chatId}`);
    return response.data;
  },

  // Get user's chats
  getUserChats: async () => {
    const response = await axios.get(`${API_URL}/meetings`);
    return response.data;
  },

  // Scholar dashboard data
  getScholarDashboard: async () => {
    const response = await axios.get(`${API_URL}/meetings/scholar/dashboard`);
    return response.data;
  },

  // Send a message
  sendMessage: async (chatId: string, text: string) => {
    const response = await axios.post(`${API_URL}/meetings/send-message`, {
      chatId,
      text
    });
    return response.data;
  },

  // Request reschedule
  requestReschedule: async (chatId: string, proposedTime?: string, note?: string) => {
    const response = await axios.post(`${API_URL}/meetings/request-reschedule`, {
      chatId,
      proposedTime,
      note
    });
    return response.data;
  },

  // Scholar respond to reschedule
  respondReschedule: async (chatId: string, decision: 'accept'|'reject'|'propose', newTime?: string, requestIndex?: number) => {
    const response = await axios.post(`${API_URL}/meetings/respond-reschedule`, {
      chatId,
      decision,
      newTime,
      requestIndex
    });
    return response.data;
  },

  // Scholar cancel meeting
  cancelMeeting: async (chatId: string) => {
    const response = await axios.post(`${API_URL}/meetings/cancel-meeting`, { chatId });
    return response.data;
  }
};
