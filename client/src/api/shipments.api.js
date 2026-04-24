import axiosInstance from './axiosInstance.js';

export const shipmentsAPI = {
  // Get all shipments
  getAll: (params = {}) => {
    return axiosInstance.get('/shipments', { params });
  },

  // Get shipment by ID
  getById: (id) => {
    return axiosInstance.get(`/shipments/${id}`);
  },

  // Create new shipment
  create: (shipmentData) => {
    return axiosInstance.post('/shipments', shipmentData);
  },

  // Dispatch shipment
  dispatch: (id, note) => {
    return axiosInstance.patch(`/shipments/${id}/dispatch`, { note });
  },

  // Receive shipment at destination
  receive: (id, note) => {
    return axiosInstance.patch(`/shipments/${id}/receive`, { note });
  },

  // Get shipments by status
  getByStatus: (status) => {
    return axiosInstance.get('/shipments', { params: { status } });
  },

  // Get shipments by vehicle
  getByVehicle: (vehicleNumber) => {
    return axiosInstance.get('/shipments', { params: { vehicleNumber } });
  },

  // Get shipments by driver
  getByDriver: (driverName) => {
    return axiosInstance.get('/shipments', { params: { driver: driverName } });
  },

  // Get active shipments
  getActive: () => {
    return axiosInstance.get('/shipments', { params: { status: ['Created', 'Dispatched', 'In Transit'] } });
  },

  // Cancel shipment
  cancel: (id, reason) => {
    return axiosInstance.patch(`/shipments/${id}/cancel`, { reason });
  },

  // Get shipment history
  getHistory: (id) => {
    return axiosInstance.get(`/shipments/${id}/history`);
  },
};
