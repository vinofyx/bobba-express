const Joi = require('joi');

const addressSchema = Joi.object({
  line1: Joi.string().trim().required().messages({
    'string.empty': 'Street address is required',
    'any.required': 'Street address is required',
  }),
  line2:   Joi.string().trim().optional().allow(''),
  city:    Joi.string().trim().required().messages({
    'string.empty': 'City is required',
    'any.required': 'City is required',
  }),
  state:   Joi.string().trim().required().messages({
    'string.empty': 'State / Province is required',
    'any.required': 'State / Province is required',
  }),
  // International postal codes: 3–10 alphanumeric chars (India, US, UK, AU, etc.)
  pincode: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9\s\-]{3,10}$/)
    .required()
    .messages({
      'string.empty':        'Pincode / ZIP is required',
      'string.pattern.base': 'Enter a valid postal/ZIP code (3–10 characters)',
      'any.required':        'Pincode / ZIP is required',
    }),
});

const createCustomerSchema = Joi.object({
  type: Joi.string()
    .valid('B2B', 'B2C')
    .default('B2C')
    .messages({ 'any.only': 'Customer type must be B2B or B2C' }),

  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min':   'Name must be at least 2 characters',
    'string.max':   'Name cannot exceed 100 characters',
    'any.required': 'Full name is required',
  }),

  companyName: Joi.string().trim().min(2).max(100)
    .when('type', {
      is:        'B2B',
      then:      Joi.required().messages({
        'string.empty': 'Company name is required for B2B customers',
        'any.required': 'Company name is required for B2B customers',
      }),
      otherwise: Joi.optional().allow(''),
    }),

  gst: Joi.string().trim()
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .optional().allow('')
    .messages({ 'string.pattern.base': 'Invalid GST number format' }),

  // International phone: optional +, then digits/spaces/dashes, 7–20 chars total
  phone: Joi.string().trim()
    .pattern(/^\+?[\d\s\-()]{7,20}$/)
    .required()
    .messages({
      'string.empty':        'Phone number is required',
      'string.pattern.base': 'Enter a valid phone number (e.g. 9876543210 or +91 98765 43210)',
      'any.required':        'Phone number is required',
    }),

  email: Joi.string().trim().email({ tlds: { allow: false } }).optional().allow('').messages({
    'string.email': 'Enter a valid email address',
  }),

  address: addressSchema.required().messages({
    'any.required': 'Address is required',
  }),
});

const updateCustomerSchema = createCustomerSchema.fork(
  ['name', 'phone', 'address'],
  (schema) => schema.optional()
);

module.exports = { createCustomerSchema, updateCustomerSchema, addressSchema };
