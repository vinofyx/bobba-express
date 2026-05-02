import axiosInstance from './axiosInstance.js';

export const usersAPI = {
  getAll: (params = {}) => axiosInstance.get('/api/users', { params }),
  getById: (id) => axiosInstance.get(`/api/users/${id}`),
  getAgents: () => axiosInstance.get('/api/users', { params: { role: 'agent' } }),
  getMe: () => axiosInstance.get('/api/users/me'),
  create: (userData) => axiosInstance.post('/api/users', userData),
  update: (id, userData) => axiosInstance.put(`/api/users/${id}`, userData),
  toggle: (id) => axiosInstance.patch(`/api/users/${id}/toggle`),
};
