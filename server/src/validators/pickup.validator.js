const Joi = require('joi');

const addressSchema = Joi.object({
  line1: Joi.string().required().messages({
    'string.empty': 'Street address is required',
    'any.required': 'Street address is required'
  }),
  line2: Joi.string().optional(),
  city: Joi.string().required().messages({
    'string.empty': 'City is required',
    'any.required': 'City is required'
  }),
  state: Joi.string().required().messages({
    'string.empty': 'State is required',
    'any.required': 'State is required'
  }),
  pincode: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9\s\-]{3,10}$/)
    .required()
    .messages({
      'string.empty':        'Pincode / ZIP is required',
      'string.pattern.base': 'Enter a valid postal/ZIP code (3–10 characters)',
      'any.required':        'Pincode / ZIP is required',
    })
});

const createPickupSchema = Joi.object({
  customer: Joi.string()
    .required()
    .messages({
      'string.empty': 'Customer is required',
      'any.required': 'Customer is required'
    }),
  pickupAddress: addressSchema.required().messages({
    'any.required': 'Pickup address is required'
  }),
  scheduledDate: Joi.date()
    .min('now')
    .required()
    .messages({
      'date.empty': 'Pickup date is required',
      'date.min': 'Pickup date must be in the future',
      'any.required': 'Pickup date is required'
    }),
  pickupTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?(AM|PM|am|pm)?$/)
    .required()
    .messages({
      'string.empty': 'Pickup time is required',
      'string.pattern.base': 'Invalid time format (use HH:MM AM/PM)',
      'any.required': 'Pickup time is required'
    }),
  deliveryType: Joi.string()
    .valid('standard', 'express', 'same_day')
    .default('standard')
    .messages({
      'any.only': 'Delivery type must be standard, express, or same_day'
    }),
  parcelType: Joi.string()
    .valid('document', 'parcel', 'fragile', 'electronics', 'bulk')
    .default('parcel')
    .messages({
      'any.only': 'Parcel type must be document, parcel, fragile, electronics, or bulk'
    }),
  parcelCount: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(1)
    .messages({
      'number.base': 'Parcel count must be a number',
      'number.integer': 'Parcel count must be an integer',
      'number.min': 'Minimum 1 parcel required',
      'number.max': 'Maximum 100 parcels allowed'
    }),
  notes: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    })
});

const updatePickupSchema = createPickupSchema.fork(
  ['customer', 'pickupAddress', 'scheduledDate', 'pickupTime'],
  (schema) => schema.optional()
);

// Used by PATCH /:id/status — only validates status-update fields
const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Requested', 'Assigned', 'Picked', 'Failed')
    .required()
    .messages({
      'any.only':     'Status must be one of: Requested, Assigned, Picked, Failed',
      'string.empty': 'Status is required',
      'any.required': 'Status is required',
    }),
  note:     Joi.string().max(500).optional().allow(''),
  location: Joi.string().max(200).optional().allow(''),
  gps: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).optional(),
});

module.exports = {
  createPickupSchema,
  updatePickupSchema,
  updateStatusSchema,
  addressSchema,
};
