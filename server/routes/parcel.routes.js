const express = require('express');
const router  = express.Router();
const { createParcel, getParcels, getParcelById, updateParcelStatus } = require('../controllers/parcel.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Phase 12: RBAC — agents can create parcels + update status; reads open to all auth
router.post  ('/',           authenticate, authorize('admin','staff','agent'), createParcel);
router.get   ('/',           authenticate,                                     getParcels);
router.get   ('/:id',        authenticate,                                     getParcelById);
router.patch ('/:id/status', authenticate, authorize('admin','staff','agent'), updateParcelStatus);

module.exports = router;