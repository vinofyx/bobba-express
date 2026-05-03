import axiosInstance from './axiosInstance.js';

export const trackingAPI = {
  getByTrackingId: (trackingId) => axiosInstance.get(`/tracking/${trackingId}`),
  addEvent:        (data)       => axiosInstance.post('/tracking', data),
};
