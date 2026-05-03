import axiosInstance from './axiosInstance.js';

export const shipmentsAPI = {
  getAll:      (params = {}) => axiosInstance.get('/shipments', { params }),
  getById:     (id)          => axiosInstance.get(`/shipments/${id}`),
  create:      (data)        => axiosInstance.post('/shipments', data),
  dispatch:    (id, note)    => axiosInstance.patch(`/shipments/${id}/dispatch`, { note }),
  receive:     (id, note)    => axiosInstance.patch(`/shipments/${id}/receive`, { note }),
  getByStatus: (status)      => axiosInstance.get('/shipments', { params: { status } }),
  cancel:      (id, reason)  => axiosInstance.patch(`/shipments/${id}/cancel`, { reason }),
  getHistory:  (id)          => axiosInstance.get(`/shipments/${id}/history`),
};
