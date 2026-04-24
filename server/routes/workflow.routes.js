const express = require('express');
const router = express.Router();
const {
  createPickupRequest,
  assignPickupAgent,
  createParcelFromPickup,
  arriveAtCenter,
  createShipment,
  dispatchShipment,
  receiveShipment,
  deliverParcel,
  getWorkflowStatus
} = require('../controllers/workflow.controller');

// 1. Customer creates pickup request
router.post('/pickup', createPickupRequest);

// 2. Agent assigns pickup to themselves
router.patch('/pickup/:pickupId/assign', assignPickupAgent);

// 3. Agent picks up items - creates parcel(s)
router.post('/pickup/:pickupId/pickup', createParcelFromPickup);

// 4. Parcel arrives at center - create tracking log
router.patch('/parcel/:parcelId/arrive', arriveAtCenter);

// 5. Create shipment with parcels
router.post('/shipment', createShipment);

// 6. Dispatch shipment
router.patch('/shipment/:shipmentId/dispatch', dispatchShipment);

// 7. Receive shipment at destination
router.patch('/shipment/:shipmentId/receive', receiveShipment);

// 8. Deliver parcel - final step
router.patch('/parcel/:parcelId/deliver', deliverParcel);

// Get complete workflow status for a pickup
router.get('/pickup/:pickupId/status', getWorkflowStatus);

module.exports = router;
