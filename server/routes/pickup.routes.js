const express = require('express');
const router  = express.Router();
const { createPickup, getPickups, getPickupById, assignAgent, completePickup, updatePickupStatus } = require('../controllers/pickup.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Phase 12: RBAC — staff/admin create; agents can update status
router.post  ('/',              authenticate, authorize('admin','staff'), createPickup);
router.get   ('/',              authenticate, getPickups);
router.get   ('/:id',           authenticate, getPickupById);
router.put   ('/:id/assign',    authenticate, authorize('admin','staff'), assignAgent);
router.patch ('/:id/status',    authenticate, authorize('admin','staff','agent'), updatePickupStatus);

module.exports = router;
