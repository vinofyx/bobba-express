const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, refreshToken, logout } = require('../controllers/auth.controller');
const validate = require('../src/middleware/validate');
const { registerSchema, loginSchema } = require('../src/validators/auth.validator');
const authenticate = require('../src/middleware/authenticate');

// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// GET /api/auth/me (protected)
router.get('/me', authenticate, getCurrentUser);

// POST /api/auth/refresh-token
router.post('/refresh', refreshToken);

// POST /api/auth/logout
router.post('/logout', authenticate, logout);

module.exports = router;

