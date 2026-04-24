const express = require('express');
const router = express.Router();
const { createPickup, getPickups, getPickupById, updatePickupStatus } = require('../controllers/pickup.controller');

// POST /api/pickups - Create new pickup
router.post('/', createPickup);

// GET /api/pickups - Get all pickups
router.get('/', getPickups);

// GET /api/pickups/:id - Get pickup by ID
router.get('/:id', getPickupById);

// PATCH /api/pickups/:id/status - Update pickup status
router.patch('/:id/status', updatePickupStatus);

module.exports = router;
