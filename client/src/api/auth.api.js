import axiosInstance from './axiosInstance.js';

export const authAPI = {
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials, { withCredentials: true });
    return response.data;
  },
  logout: async () => {
    const response = await axiosInstance.post('/auth/logout', {}, { withCredentials: true });
    return response.data;
  },
  refreshToken: async () => {
    const response = await axiosInstance.post('/auth/refresh', {}, { withCredentials: true });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },
};
