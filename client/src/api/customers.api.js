import axiosInstance from './axiosInstance.js';

export const customersAPI = {
  getAll:  (params = {}) => axiosInstance.get('/customers', { params }),
  getById: (id)          => axiosInstance.get(`/customers/${id}`),
  create:  (data)        => axiosInstance.post('/customers', data),
  update:  (id, data)    => axiosInstance.put(`/customers/${id}`, data),
  delete:  (id)          => axiosInstance.delete(`/customers/${id}`),
};
