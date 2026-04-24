import axiosInstance from './axiosInstance.js';

export const trackingAPI = {
  // Get tracking by tracking ID (public)
  getByTrackingId: (trackingId) => {
    return axiosInstance.get(`/tracking/${trackingId}`);
  },

  // Add tracking event
  addEvent: (trackingData) => {
    return axiosInstance.post('/tracking', trackingData);
  },

  // Get tracking by parcel ID
  getByParcelId: (parcelId) => {
    return axiosInstance.get(`/tracking/parcel/${parcelId}`);
  },

  // Get tracking history for parcel
  getHistory: (parcelId) => {
    return axiosInstance.get(`/tracking/parcel/${parcelId}/history`);
  }
};
