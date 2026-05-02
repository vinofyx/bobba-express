const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User   = require('../models/User');

const sign = (id, secret, expiresIn) => jwt.sign({ id }, secret, { expiresIn });

const setRefreshCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   isProd,           // HTTPS only in production
    sameSite: isProd ? 'none' : 'strict', // 'none' required for cross-origin (Vercel → backend)
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'name, email and password are required.' });

    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 12);
    const user   = await User.create({ name, email, password: hashed, role: role || 'staff' });

    const accessToken  = sign(user._id, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '15m');
    const refreshToken = sign(user._id, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN || '7d');

    user.refreshToken = refreshToken;
    await user.save();
    setRefreshCookie(res, refreshToken);

    const { password: _, refreshToken: __, ...safe } = user.toObject();
    return res.status(201).json({ success: true, message: 'Registered successfully.', data: { user: safe, accessToken } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = await User.findOne({ email }).select('+password +refreshToken +loginAttempts +lockUntil');
    if (!user || !user.isActive)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return res.status(423).json({ 
        success: false, 
        message: `Account locked. Try again in ${lockTimeRemaining} minutes.` 
      });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts for 30 minutes
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
        await user.save();
        return res.status(423).json({ 
          success: false, 
          message: 'Account locked due to multiple failed attempts. Try again in 30 minutes.' 
        });
      }
      
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    const accessToken  = sign(user._id, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '15m');
    const refreshToken = sign(user._id, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN || '7d');

    user.lastLogin    = new Date();
    user.refreshToken = refreshToken;
    await user.save();
    setRefreshCookie(res, refreshToken);

    const { password: _, refreshToken: __, loginAttempts: ___, lockUntil: ____, ...safe } = user.toObject();
    return res.json({ success: true, message: 'Login successful.', data: { user: safe, accessToken } });
  } catch (err) {
    console.error('[login] Error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Login failed. Please try again.' });
  }
};

// GET /api/auth/me
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.isActive)
      return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, data: { user } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token)
      return res.status(401).json({ success: false, message: 'Refresh token missing.' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id).select('+refreshToken');
    if (!user || !user.isActive || user.refreshToken !== token)
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });

    const accessToken     = sign(user._id, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '15m');
    const newRefreshToken = sign(user._id, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN || '7d');

    user.refreshToken = newRefreshToken;
    await user.save();
    setRefreshCookie(res, newRefreshToken);

    return res.json({ success: true, data: { accessToken } });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.clearCookie('refreshToken');
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getCurrentUser, refreshToken, logout };
