import axiosInstance from './axiosInstance.js';

export const usersAPI = {
  getAll:   (params = {}) => axiosInstance.get('/users', { params }),
  getById:  (id)          => axiosInstance.get(`/users/${id}`),
  getAgents:()            => axiosInstance.get('/users', { params: { role: 'agent' } }),
  getMe:    ()            => axiosInstance.get('/users/me'),
  create:   (data)        => axiosInstance.post('/users', data),
  update:   (id, data)    => axiosInstance.put(`/users/${id}`, data),
  toggle:   (id)          => axiosInstance.patch(`/users/${id}/toggle`),
};
