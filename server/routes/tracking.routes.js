const express = require('express');
const router  = express.Router();
const { getTracking, addTrackingEvent } = require('../controllers/tracking.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Phase 8: GET is public (customers can track), POST requires auth
router.get ('/:trackingId', getTracking);
router.post('/',            authenticate, addTrackingEvent);

module.exports = router;
