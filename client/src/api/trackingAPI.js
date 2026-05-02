import axiosInstance from './axiosInstance.js';

export const trackingAPI = {
  // Public — GET /api/tracking/:trackingId
  getByTrackingId: (trackingId) => axiosInstance.get(`/api/tracking/${trackingId}`),

  // Authenticated — POST /api/tracking
  addEvent: (data) => axiosInstance.post('/api/tracking', data),
};
