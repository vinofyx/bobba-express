import axiosInstance from './axiosInstance.js';

export const trackingAPI = {
  // Phase 8: Public — GET /api/tracking/:trackingId
  getByTrackingId: (trackingId) => axiosInstance.get(`/tracking/${trackingId}`),

  // Phase 8: Authenticated — POST /api/tracking
  addEvent: (data) => axiosInstance.post('/tracking', data),
};
