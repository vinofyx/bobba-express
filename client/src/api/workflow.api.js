import axiosInstance from './axiosInstance.js';

export const workflowAPI = {
  // Complete workflow endpoints
  
  // 1. Customer creates pickup request
  createPickupRequest: (pickupData) => {
    return axiosInstance.post('/workflow/pickup', pickupData);
  },

  // 2. Agent assigns pickup to themselves
  assignPickupAgent: (pickupId, agentId) => {
    return axiosInstance.patch(`/workflow/pickup/${pickupId}/assign`, { agentId });
  },

  // 3. Agent picks up items - creates parcel(s)
  createParcelFromPickup: (pickupId, parcelsData) => {
    return axiosInstance.post(`/workflow/pickup/${pickupId}/pickup`, { parcels: parcelsData });
  },

  // 4. Parcel arrives at center - create tracking log
  arriveAtCenter: (parcelId, data) => {
    return axiosInstance.patch(`/workflow/parcel/${parcelId}/arrive`, data);
  },

  // 5. Create shipment with parcels
  createShipment: (shipmentData) => {
    return axiosInstance.post('/workflow/shipment', shipmentData);
  },

  // 6. Dispatch shipment
  dispatchShipment: (shipmentId, notes) => {
    return axiosInstance.patch(`/workflow/shipment/${shipmentId}/dispatch`, { notes });
  },

  // 7. Receive shipment at destination
  receiveShipment: (shipmentId, notes) => {
    return axiosInstance.patch(`/workflow/shipment/${shipmentId}/receive`, { notes });
  },

  // 8. Deliver parcel - final step
  deliverParcel: (parcelId, deliveryData) => {
    return axiosInstance.patch(`/workflow/parcel/${parcelId}/deliver`, deliveryData);
  },

  // Get complete workflow status for a pickup
  getWorkflowStatus: (pickupId) => {
    return axiosInstance.get(`/workflow/pickup/${pickupId}/status`);
  }
};
