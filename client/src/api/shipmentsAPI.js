import axiosInstance from './axiosInstance.js';

export const shipmentsAPI = {
  // Get all shipments
  getAll: (params = {}) => {
    return axiosInstance.get('/api/shipments', { params });
  },

  // Get shipment by ID
  getById: (id) => {
    return axiosInstance.get(`/api/shipments/${id}`);
  },

  // Create new shipment
  create: (shipmentData) => {
    return axiosInstance.post('/api/shipments', shipmentData);
  },

  // Dispatch shipment
  dispatch: (id, note) => {
    return axiosInstance.patch(`/api/shipments/${id}/dispatch`, { note });
  },

  // Receive shipment at destination
  receive: (id, note) => {
    return axiosInstance.patch(`/api/shipments/${id}/receive`, { note });
  },

  // Get shipments by status
  getByStatus: (status) => {
    return axiosInstance.get('/api/shipments', { params: { status } });
  },

  // Get shipments by vehicle
  getByVehicle: (vehicleNumber) => {
    return axiosInstance.get('/api/shipments', { params: { vehicleNumber } });
  },

  // Get shipments by driver
  getByDriver: (driverName) => {
    return axiosInstance.get('/api/shipments', { params: { driver: driverName } });
  },

  // Get active shipments
  getActive: () => {
    return axiosInstance.get('/api/shipments', { params: { status: ['Created', 'Dispatched', 'In Transit'] } });
  },

  // Cancel shipment
  cancel: (id, reason) => {
    return axiosInstance.patch(`/api/shipments/${id}/cancel`, { reason });
  },

  // Get shipment history
  getHistory: (id) => {
    return axiosInstance.get(`/api/shipments/${id}/history`);
  },
};
