const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Phase 3 + 12: authenticate — verify JWT, attach req.user
const authenticate = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware called');
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or malformed.',
        fix: 'Login first → POST /api/auth/login  { email, password }  — then add the returned token as:  Authorization: Bearer <token>',
        frontend: 'http://localhost:8080/login',
      });

    const token = header.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.id);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid token. Please log in again.';
      return res.status(401).json({ success: false, message: msg });
    }

    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user || !user.isActive) {
      console.log('❌ User not found or inactive');
      return res.status(401).json({ success: false, message: 'Account not found or deactivated.' });
    }

    console.log('✅ User authenticated:', user.email);
    req.user = user;
    next();
  } catch (err) {
    console.error('❌ Auth error:', err);
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

// Phase 12: authorize — role-based access control
// Admin → full access | Staff → operations | Agent → limited
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ success: false, message: `Access denied. Allowed roles: ${roles.join(', ')}` });
    next();
  };
};

module.exports = { authenticate, authorize };
