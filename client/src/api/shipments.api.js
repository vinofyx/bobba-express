import axiosInstance from './axiosInstance.js';

export const shipmentsAPI = {
  getAll: (params = {}) => axiosInstance.get('/api/shipments', { params }),
  getById: (id) => axiosInstance.get(`/api/shipments/${id}`),
  create: (shipmentData) => axiosInstance.post('/api/shipments', shipmentData),
  dispatch: (id, note) => axiosInstance.patch(`/api/shipments/${id}/dispatch`, { note }),
  receive: (id, note) => axiosInstance.patch(`/api/shipments/${id}/receive`, { note }),
  getByStatus: (status) => axiosInstance.get('/api/shipments', { params: { status } }),
  getByVehicle: (vehicleNumber) => axiosInstance.get('/api/shipments', { params: { vehicleNumber } }),
  getByDriver: (driverName) => axiosInstance.get('/api/shipments', { params: { driver: driverName } }),
  getActive: () => axiosInstance.get('/api/shipments', { params: { status: ['Created', 'Dispatched', 'In Transit'] } }),
  cancel: (id, reason) => axiosInstance.patch(`/api/shipments/${id}/cancel`, { reason }),
  getHistory: (id) => axiosInstance.get(`/api/shipments/${id}/history`),
};
