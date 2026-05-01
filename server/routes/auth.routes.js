const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, refreshToken, logout } = require('../controllers/auth.controller');
const validate = require('../src/middleware/validate');
const { registerSchema, loginSchema } = require('../src/validators/auth.validator');
const authenticate = require('../src/middleware/authenticate');

// ── GET hints (browser-friendly info for POST-only endpoints) ────────────────
const hint = (method, path, body) => (_, res) => res.json({
  success: true,
  message: `✅ Server is running. Use ${method} to call this endpoint from the frontend.`,
  usage: { method, path, body },
});

router.get('/login',    hint('POST', '/api/auth/login',    { email: 'you@example.com', password: 'yourpassword' }));
router.get('/register', hint('POST', '/api/auth/register', { name: 'John Doe', email: 'you@example.com', password: 'min8chars', role: 'staff|agent|admin' }));
router.get('/logout',   hint('POST', '/api/auth/logout',   'requires Bearer token in Authorization header'));
router.get('/refresh',  hint('POST', '/api/auth/refresh',  'uses httpOnly refresh cookie — no body needed'));

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// GET /api/auth/me (protected)
router.get('/me', authenticate, getCurrentUser);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/auth/logout
router.post('/logout', authenticate, logout);

module.exports = router;

