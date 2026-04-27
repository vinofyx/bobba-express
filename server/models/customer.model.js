const mongoose = require('mongoose');

// ── Address sub-schema ───────────────────────────────────────────────────────
const addressSchema = new mongoose.Schema({
  line1:   { type: String, required: [true, 'Street address is required'], trim: true },
  line2:   { type: String, trim: true },
  city:    { type: String, required: [true, 'City is required'],    trim: true },
  state:   { type: String, required: [true, 'State is required'],   trim: true },
  pincode: {
    type: String, required: [true, 'Pincode is required'],
    match: [/^\d{6}$/, 'Pincode must be 6 digits'],
  },
}, { _id: false });

// ── Customer schema ──────────────────────────────────────────────────────────
const customerSchema = new mongoose.Schema({
  // B2B or B2C
  type: {
    type: String,
    enum: ['B2B', 'B2C'],
    default: 'B2C',
    required: true,
  },

  // Contact person name (required for both B2B & B2C)
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },

  // Company name — required for B2B, optional for B2C
  companyName: {
    type: String,
    trim: true,
  },

  // GST — only meaningful for B2B
  gst: {
    type: String,
    trim: true,
    uppercase: true,
    match: [
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Invalid GST number format',
    ],
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'],
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },

  address: {
    type: addressSchema,
    required: [true, 'Address is required'],
  },

  isActive: { type: Boolean, default: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

// ── Indexes ──────────────────────────────────────────────────────────────────
customerSchema.index({ phone: 1 }, { unique: true });
customerSchema.index({ type: 1, isActive: 1 });
customerSchema.index({ name: 'text', companyName: 'text' });

// ── Pre-save: B2B must have companyName ──────────────────────────────────────
customerSchema.pre('save', function (next) {
  if (this.type === 'B2B' && !this.companyName) {
    return next(new Error('Company name is required for B2B customers.'));
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
