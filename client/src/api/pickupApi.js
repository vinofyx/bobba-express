import axiosInstance from './axiosInstance.js';

export const pickupAPI = {
  // Get all pickups
  getAll: (params = {}) => {
    return axiosInstance.get('/pickups', { params });
  },

  // Get pickup by ID
  getById: (id) => {
    return axiosInstance.get(`/pickups/${id}`);
  },

  // Create new pickup
  create: (pickupData) => {
    return axiosInstance.post('/pickups', pickupData);
  },

  // Update pickup
  update: (id, pickupData) => {
    return axiosInstance.put(`/pickups/${id}`, pickupData);
  },

  // Update pickup status
  updateStatus: (id, statusData) => {
    return axiosInstance.patch(`/pickups/${id}/status`, statusData);
  },

  // Get pickups by status
  getByStatus: (status) => {
    return axiosInstance.get('/pickups', { params: { status } });
  },

  // Get pickups by agent
  getByAgent: (agentId) => {
    return axiosInstance.get('/pickups', { params: { assignedAgent: agentId } });
  },

  // Assign agent to pickup
  assignAgent: (id, agentId) => {
    return axiosInstance.patch(`/pickups/${id}`, { assignedAgent: agentId });
  },
};
