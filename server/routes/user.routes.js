const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// GET /api/users  — admin/staff can list; filter by ?role=agent etc.
router.get('/', authenticate, authorize('admin','staff'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.role)     filter.role     = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const users = await User.find(filter).select('name email role phone isActive createdAt').sort({ name: 1 });
    return res.json({ success: true, data: { users } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/me
router.get('/me', authenticate, (req, res) =>
  res.json({ success: true, data: { user: req.user } })
);

// POST /api/users  — admin only — create new user account
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: 'name, email, password and role are required.' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(409).json({ success: false, message: 'A user with this email already exists.' });

    const hashed = await bcrypt.hash(password, 12);
    const user   = await User.create({ name, email, password: hashed, role, phone: phone || undefined });
    return res.status(201).json({ success: true, data: { user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, isActive: user.isActive } } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/:id  — admin only — update name, role, phone
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, role, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(role && { role }), ...(phone !== undefined && { phone }) },
      { new: true, runValidators: true }
    ).select('name email role phone isActive');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, data: { user } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/:id/toggle  — admin only — activate / deactivate
router.patch('/:id/toggle', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    return res.json({ success: true, data: { user: { _id: user._id, name: user.name, isActive: user.isActive } } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
