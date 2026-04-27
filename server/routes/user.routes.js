const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Phase 12: Role-based — only admin/staff can list users
router.get('/', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).select('name email role phone').sort({ name: 1 });
    return res.json({ success: true, data: { users } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', authenticate, (req, res) =>
  res.json({ success: true, data: { user: req.user } })
);

module.exports = router;
