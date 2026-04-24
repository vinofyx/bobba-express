const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  line1:   { type: String, required: true },
  line2:   { type: String },
  city:    { type: String, required: true },
  state:   { type: String, required: true },
  pincode: { type: String, required: true, match: [/^\d{6}$/, 'Invalid PIN'] },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  type:        { type: String, enum: ['B2B', 'B2C'], default: 'B2C' },
  name:        { type: String, required: true, trim: true },
  companyName: { type: String, trim: true },
  gst:         { type: String, match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST'] },
  phone:       { type: String, required: true, match: [/^[6-9]\d{9}$/, 'Invalid phone'] },
  email:       { type: String, lowercase: true, trim: true },
  address:     { type: addressSchema, required: true },
  isActive:    { type: Boolean, default: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

customerSchema.index({ phone: 1 }, { unique: true });
customerSchema.index({ name: 'text', companyName: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
