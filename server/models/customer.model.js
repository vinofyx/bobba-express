const mongoose = require('mongoose');

// ── Address sub-schema ───────────────────────────────────────────────────────
const addressSchema = new mongoose.Schema({
  line1:   { type: String, required: [true, 'Street address is required'], trim: true },
  line2:   { type: String, trim: true },
  city:    { type: String, required: [true, 'City is required'],    trim: true },
  state:   { type: String, required: [true, 'State is required'],   trim: true },
  pincode: {
    type:  String,
    required: [true, 'Pincode / ZIP is required'],
    trim: true,
    match: [/^[A-Za-z0-9\s\-]{3,10}$/, 'Enter a valid postal/ZIP code (3–10 characters)'],
  },
}, { _id: false });

// ── Customer schema ──────────────────────────────────────────────────────────
const customerSchema = new mongoose.Schema({
  // Auto-generated customer ID
  customerId: {
    type:     String,
    unique:   true,
    required: true,
  },

  // B2B or B2C
  type: {
    type:     String,
    enum:     ['B2B', 'B2C'],
    default:  'B2C',
    required: true,
  },

  // Contact person name
  name: {
    type:     String,
    required: [true, 'Name is required'],
    trim:     true,
    minlength: [2, 'Name must be at least 2 characters'],
  },

  // Company name — required for B2B, optional for B2C
  companyName: { type: String, trim: true },

  // GST — optional, only for B2B
  gst: {
    type:      String,
    trim:      true,
    uppercase: true,
    match: [
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Invalid GST number format',
    ],
  },

  // International-friendly phone: digits only, 7–15 chars, optional leading +
  phone: {
    type:     String,
    required: [true, 'Phone number is required'],
    trim:     true,
    match: [
      /^\+?[\d\s\-()]{7,20}$/,
      'Enter a valid phone number (7–15 digits, optional country code)',
    ],
  },

  email: {
    type:      String,
    lowercase: true,
    trim:      true,
    match:     [/^\S+@\S+\.\S+$/, 'Invalid email address'],
  },

  address: {
    type:     addressSchema,
    required: [true, 'Address is required'],
  },

  isActive:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────────────────────
customerSchema.index({ phone: 1 }, { unique: true });
customerSchema.index({ type: 1, isActive: 1 });
customerSchema.index({ name: 'text', companyName: 'text' });

// ── Pre-save: B2B must have companyName ──────────────────────────────────────
customerSchema.pre('save', async function () {
  if (this.type === 'B2B' && !this.companyName) {
    throw new Error('Company name is required for B2B customers.');
  }
});

module.exports = mongoose.model('Customer', customerSchema);
