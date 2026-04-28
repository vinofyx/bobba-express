const express = require('express');
const router  = express.Router();
const { getStats } = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Phase 12: Dashboard stats — admin/staff only (agents use /agent panel)
router.get('/stats', authenticate, authorize('admin','staff'), getStats);

module.exports = router;
