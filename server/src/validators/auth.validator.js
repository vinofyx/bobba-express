const Joi = require('joi');

// Roles configuration - you can adjust as needed
const ROLES = {
  ADMIN: 'admin',
  AGENT: 'agent', 
  CUSTOMER: 'customer',
  STAFF: 'staff'
};

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid(...Object.values(ROLES)).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  ROLES
};
