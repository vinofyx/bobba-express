const express = require('express');
const router  = express.Router();
const { register, login, getCurrentUser, refreshToken, logout } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../src/middleware/validate');
const { registerSchema, loginSchema } = require('../src/validators/auth.validator');

// Phase 3: Auth routes
router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.get ('/me',       authenticate,             getCurrentUser);
router.post('/refresh',                            refreshToken);
router.post('/logout',   authenticate,             logout);

module.exports = router;
