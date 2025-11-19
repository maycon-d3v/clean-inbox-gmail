import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  getLoginUrl: async (forceAccountSelection = false) => {
    const response = await api.get('/auth/login', {
      params: { forceAccountSelection },
    });
    return response.data.authUrl;
  },

  getUser: async (sessionId) => {
    const response = await api.get('/auth/user', {
      params: { sessionId },
    });
    return response.data;
  },

  logout: async (sessionId) => {
    const response = await api.post('/auth/logout', null, {
      params: { sessionId },
    });
    return response.data;
  },
};

export const gmailService = {
  getStats: async (sessionId) => {
    const response = await api.get('/gmail/stats', {
      params: { sessionId },
    });
    return response.data;
  },

  getPreview: async (sessionId, cleanupOptions) => {
    const response = await api.post('/gmail/preview', cleanupOptions, {
      params: { sessionId },
    });
    return response.data;
  },

  cleanup: async (sessionId, cleanupOptions) => {
    const response = await api.post('/gmail/cleanup', cleanupOptions, {
      params: { sessionId },
    });
    return response.data;
  },
};

export default api;
