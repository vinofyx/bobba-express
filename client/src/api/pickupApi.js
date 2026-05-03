import axiosInstance from './axiosInstance.js';

export const pickupAPI = {
  getAll:      (params = {}) => axiosInstance.get('/pickups', { params }),
  getById:     (id)          => axiosInstance.get(`/pickups/${id}`),
  create:      (data)        => axiosInstance.post('/pickups', data),
  update:      (id, data)    => axiosInstance.put(`/pickups/${id}`, data),
  updateStatus:(id, data)    => axiosInstance.patch(`/pickups/${id}/status`, data),
  getByStatus: (status)      => axiosInstance.get('/pickups', { params: { status } }),
  getByAgent:  (agentId)     => axiosInstance.get('/pickups', { params: { assignedAgent: agentId } }),
  assignAgent: (id, agentId) => axiosInstance.put(`/pickups/${id}/assign`, { agentId }),
  getMyPickups:()            => axiosInstance.get('/pickups', { params: { onlyMine: true } }),
};
