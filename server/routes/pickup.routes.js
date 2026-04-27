const express = require('express');
const router  = express.Router();
const { createPickup, getPickups, getPickupById, assignAgent, updatePickupStatus } = require('../controllers/pickup.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Phase 5: Pickup CRUD + assign + status
router.post  ('/',              authenticate,                          createPickup);
router.get   ('/',              authenticate,                          getPickups);
router.get   ('/:id',           authenticate,                          getPickupById);
router.put   ('/:id/assign',    authenticate, authorize('admin','staff'), assignAgent);
router.patch ('/:id/status',    authenticate,                          updatePickupStatus);

module.exports = router;
