const express = require('express');
const router  = express.Router();
const { getStats } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Phase 4: Dashboard stats — all authenticated users
router.get('/stats', authenticate, getStats);

module.exports = router;
