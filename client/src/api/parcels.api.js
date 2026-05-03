import axiosInstance from './axiosInstance.js';

export const parcelsAPI = {
  getAll:             (params = {}) => axiosInstance.get('/parcels', { params }),
  getById:            (id)          => axiosInstance.get(`/parcels/${id}`),
  createFromPickup:   (data)        => axiosInstance.post('/parcels', data),
  updateStatus:       (id, data)    => axiosInstance.patch(`/parcels/${id}/status`, data),
  getByStatus:        (status)      => axiosInstance.get('/parcels', { params: { status } }),
  getByCustomer:      (customerId)  => axiosInstance.get('/parcels', { params: { customer: customerId } }),
  searchByTrackingId: (trackingId)  => axiosInstance.get('/parcels', { params: { trackingId } }),
  update:             (id, data)    => axiosInstance.put(`/parcels/${id}`, data),
  getHistory:         (id)          => axiosInstance.get(`/parcels/${id}/history`),
};
