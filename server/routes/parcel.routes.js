const express = require('express');
const router  = express.Router();
const { createParcel, getParcels, getParcelById, updateParcelStatus } = require('../controllers/parcel.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Phase 7 + 8: Parcel CRUD + status updates with tracking logs
router.post  ('/',           authenticate,                          createParcel);
router.get   ('/',           authenticate,                          getParcels);
router.get   ('/:id',        authenticate,                          getParcelById);
router.patch ('/:id/status', authenticate,                          updateParcelStatus);

module.exports = router;