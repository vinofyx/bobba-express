const express = require('express');
const router  = express.Router();
const { createParcel, getParcels, getParcelById, updateParcel, updateParcelStatus, generateLabel } = require('../controllers/parcel.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Phase 12: RBAC — agents can create parcels + update status; reads open to all auth
router.post  ('/',           authenticate, authorize('admin','staff','agent'), createParcel);
router.get   ('/',           authenticate,                                     getParcels);
router.get   ('/:id',        authenticate,                                     getParcelById);
router.put   ('/:id',        authenticate, authorize('admin','staff'),          updateParcel);
router.patch ('/:id/status', authenticate, authorize('admin','staff','agent'), updateParcelStatus);
router.get   ('/:id/label',  authenticate,                                     generateLabel);

module.exports = router;