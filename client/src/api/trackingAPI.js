import axiosInstance from './axiosInstance.js';

export const trackingAPI = {
  getByTrackingId: (trackingId) => axiosInstance.get(`/api/tracking/${trackingId}`),
  addEvent: (data) => axiosInstance.post('/api/tracking', data),
};
