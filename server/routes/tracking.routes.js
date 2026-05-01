const express = require('express');
const router  = express.Router();
const { getTracking, addTrackingEvent, downloadTrackingPDF, subscribeToTracking } = require('../controllers/tracking.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Phase 12: GET is public; POST = admin/staff only (manual tracking entry)
router.get ('/:trackingId', getTracking);
router.get ('/:trackingId/download', downloadTrackingPDF);
router.post ('/:trackingId/subscribe', subscribeToTracking);
router.post('/',            authenticate, authorize('admin','staff'), addTrackingEvent);

module.exports = router;
