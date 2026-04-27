import axiosInstance from './axiosInstance.js';

export const usersAPI = {
  // Get all users
  getAll: (params = {}) => {
    return axiosInstance.get('/users', { params });
  },

  // Get user by ID
  getById: (id) => {
    return axiosInstance.get(`/users/${id}`);
  },

  // Get agents only
  getAgents: () => {
    return axiosInstance.get('/users', { params: { role: 'agent' } });
  },

  // Get current user profile
  getMe: () => {
    return axiosInstance.get('/users/me');
  },

  // Create new user
  create: (userData) => {
    return axiosInstance.post('/users', userData);
  },

  // Update user
  update: (id, userData) => {
    return axiosInstance.put(`/users/${id}`, userData);
  },

  // Delete user
  delete: (id) => {
    return axiosInstance.delete(`/users/${id}`);
  },

  // Search users
  search: (query) => {
    return axiosInstance.get('/users', { params: { search: query } });
  },
};
