const express = require('express');
const router  = express.Router();
const { createPickup, getPickups, getPickupById, assignAgent, reassignAgent, completePickup, updatePickupStatus } = require('../controllers/pickup.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../src/middleware/validate');
const { createPickupSchema, updatePickupSchema, updateStatusSchema } = require('../src/validators/pickup.validator');

// Phase 12: RBAC — staff/admin create; agents can update status
router.post  ('/',              authenticate, authorize('admin','staff'), createPickup);
router.get   ('/',              authenticate,                                      getPickups);
router.get   ('/:id',           authenticate,                                      getPickupById);
router.put   ('/:id/assign',    authenticate, authorize('admin','staff'),          assignAgent);
router.put   ('/:id/reassign',  authenticate, authorize('admin','staff'),          reassignAgent);
router.put   ('/:id/complete',  authenticate, authorize('agent'),                 completePickup);
router.patch ('/:id/status',    authenticate, authorize('admin','staff','agent'), validate(updateStatusSchema),  updatePickupStatus);

module.exports = router;
