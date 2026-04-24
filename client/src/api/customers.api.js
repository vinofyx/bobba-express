import axiosInstance from './axiosInstance.js';

export const customersAPI = {
  // Get all customers
  getAll: (params = {}) => {
    return axiosInstance.get('/customers', { params });
  },

  // Get customer by ID
  getById: (id) => {
    return axiosInstance.get(`/customers/${id}`);
  },

  // Create new customer
  create: (customerData) => {
    return axiosInstance.post('/customers', customerData);
  },

  // Update customer
  update: (id, customerData) => {
    return axiosInstance.put(`/customers/${id}`, customerData);
  },

  // Delete customer (soft delete)
  delete: (id) => {
    return axiosInstance.patch(`/customers/${id}`, { isActive: false });
  },

  // Search customers
  search: (query) => {
    return axiosInstance.get('/customers', { params: { search: query } });
  },
};
