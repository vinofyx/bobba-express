import axiosInstance from './axiosInstance.js';

export const pickupAPI = {
  // Get all pickups
  getAll: (params = {}) => {
    return axiosInstance.get('/api/pickups', { params });
  },

  // Get pickup by ID
  getById: (id) => {
    return axiosInstance.get(`/api/pickups/${id}`);
  },

  // Create new pickup
  create: (pickupData) => {
    return axiosInstance.post('/api/pickups', pickupData);
  },

  // Update pickup
  update: (id, pickupData) => {
    return axiosInstance.put(`/api/pickups/${id}`, pickupData);
  },

  // Update pickup status
  updateStatus: (id, statusData) => {
    return axiosInstance.patch(`/api/pickups/${id}/status`, statusData);
  },

  // Get pickups by status
  getByStatus: (status) => {
    return axiosInstance.get('/api/pickups', { params: { status } });
  },

  // Get pickups by agent
  getByAgent: (agentId) => {
    return axiosInstance.get('/api/pickups', { params: { assignedAgent: agentId } });
  },

  // Assign agent to pickup
  assignAgent: (id, agentId) => {
    return axiosInstance.put(`/api/pickups/${id}/assign`, { agentId });
  },

  // Get only my pickups (agent view)
  getMyPickups: () => {
    return axiosInstance.get('/api/pickups', { params: { onlyMine: true } });
  },
};
