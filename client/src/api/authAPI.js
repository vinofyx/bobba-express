import axiosInstance from './axiosInstance.js';

export const authAPI = {
  login: async (credentials) => {
    const response = await axiosInstance.post('/api/auth/login', credentials, {
      withCredentials: true,
    });
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosInstance.post('/api/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.post('/api/auth/logout', {}, {
      withCredentials: true,
    });
    return response.data;
  },

  refreshToken: async () => {
    const response = await axiosInstance.post('/api/auth/refresh', {}, {
      withCredentials: true,
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axiosInstance.get('/api/auth/me');
    return response.data;
  },
};
