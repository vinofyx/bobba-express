const express = require('express');
const router = express.Router();
const { createShipment, getShipments, dispatchShipment, receiveShipment } = require('../controllers/shipment.controller');

// POST /api/shipments - Create shipment
router.post('/', createShipment);

// PATCH /api/shipments/:id/dispatch - Dispatch shipment
router.patch('/:id/dispatch', dispatchShipment);

// PATCH /api/shipments/:id/receive - Receive shipment
router.patch('/:id/receive', receiveShipment);

// GET /api/shipments - Get all shipments
router.get('/', getShipments);

module.exports = router;
