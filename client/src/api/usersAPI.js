import axiosInstance from './axiosInstance.js';

export const usersAPI = {
  // Get all users
  getAll: (params = {}) => {
    return axiosInstance.get('/api/users', { params });
  },

  // Get user by ID
  getById: (id) => {
    return axiosInstance.get(`/api/users/${id}`);
  },

  // Get agents only
  getAgents: () => {
    return axiosInstance.get('/api/users', { params: { role: 'agent' } });
  },

  // Get current user profile
  getMe: () => {
    return axiosInstance.get('/api/users/me');
  },

  // Create new user
  create: (userData) => {
    return axiosInstance.post('/api/users', userData);
  },

  // Update user
  update: (id, userData) => {
    return axiosInstance.put(`/api/users/${id}`, userData);
  },

  // Toggle active/inactive
  toggle: (id) => {
    return axiosInstance.patch(`/api/users/${id}/toggle`);
  },
};
