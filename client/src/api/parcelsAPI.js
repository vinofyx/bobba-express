import axiosInstance from './axiosInstance.js';

export const parcelsAPI = {
  getAll: (params = {}) => axiosInstance.get('/api/parcels', { params }),
  getById: (id) => axiosInstance.get(`/api/parcels/${id}`),
  createFromPickup: (parcelData) => axiosInstance.post('/api/parcels', parcelData),
  updateStatus: (id, statusData) => axiosInstance.patch(`/api/parcels/${id}/status`, statusData),
  getByStatus: (status) => axiosInstance.get('/api/parcels', { params: { status } }),
  getByCustomer: (customerId) => axiosInstance.get('/api/parcels', { params: { customer: customerId } }),
  searchByTrackingId: (trackingId) => axiosInstance.get('/api/parcels', { params: { trackingId } }),
  update: (id, parcelData) => axiosInstance.put(`/api/parcels/${id}`, parcelData),
  getHistory: (id) => axiosInstance.get(`/api/parcels/${id}/history`),
};
