import axiosInstance from './axiosInstance.js';

export const parcelsAPI = {
  // Get all parcels
  getAll: (params = {}) => {
    return axiosInstance.get('/api/parcels', { params });
  },

  // Get parcel by ID
  getById: (id) => {
    return axiosInstance.get(`/api/parcels/${id}`);
  },

  // Create parcel from pickup
  createFromPickup: (parcelData) => {
    return axiosInstance.post('/api/parcels', parcelData);
  },

  // Update parcel status
  updateStatus: (id, statusData) => {
    return axiosInstance.patch(`/api/parcels/${id}/status`, statusData);
  },

  // Get parcels by status
  getByStatus: (status) => {
    return axiosInstance.get('/api/parcels', { params: { status } });
  },

  // Get parcels by customer
  getByCustomer: (customerId) => {
    return axiosInstance.get('/api/parcels', { params: { customer: customerId } });
  },

  // Search parcels by tracking ID
  searchByTrackingId: (trackingId) => {
    return axiosInstance.get('/api/parcels', { params: { trackingId } });
  },

  // Update parcel details
  update: (id, parcelData) => {
    return axiosInstance.put(`/api/parcels/${id}`, parcelData);
  },

  // Get parcel history
  getHistory: (id) => {
    return axiosInstance.get(`/api/parcels/${id}/history`);
  },
};
