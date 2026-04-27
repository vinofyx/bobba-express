const express = require('express');
const router  = express.Router();
const { createShipment, getShipments, getShipmentById, dispatchShipment, receiveShipment } = require('../controllers/shipment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Phase 9: Shipment hub system
router.post  ('/',              authenticate, authorize('admin','staff'), createShipment);
router.get   ('/',              authenticate,                             getShipments);
router.get   ('/:id',           authenticate,                             getShipmentById);
router.patch ('/:id/dispatch',  authenticate, authorize('admin','staff'), dispatchShipment);
router.patch ('/:id/receive',   authenticate, authorize('admin','staff'), receiveShipment);

module.exports = router;
