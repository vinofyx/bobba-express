const express = require('express');
const router = express.Router();
const { createParcelFromPickup, updateParcelStatus, getParcelsByStatus } = require('../controllers/parcel.controller');

// POST /api/parcels - Create parcel from pickup
router.post('/', createParcelFromPickup);

// PATCH /api/parcels/:id/status - Update parcel status
router.patch('/:id/status', updateParcelStatus);

// GET /api/parcels - Get parcels with optional status filter
router.get('/', getParcelsByStatus);

module.exports = router;
