import axiosInstance from './axiosInstance.js';

export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await axiosInstance.post('/api/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await axiosInstance.post('/api/auth/login', credentials, {
      withCredentials: true, // Important for httpOnly refresh token cookie
    });
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await axiosInstance.post('/api/auth/logout', {}, {
      withCredentials: true, // Important for clearing httpOnly cookie
    });
    return response.data;
  },

  // Refresh token
  refreshToken: async () => {
    const response = await axiosInstance.post('/api/auth/refresh', {}, {
      withCredentials: true,
    });
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await axiosInstance.get('/api/auth/me');
    return response.data;
  },
};
