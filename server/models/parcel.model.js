const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const parcelSchema = new mongoose.Schema({
  // Auto-generated human-readable tracking ID
  trackingId: {
    type: String,
    unique: true,
    default: () => 'BE' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
  },
  // UUID-based barcode (Phase 7)
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    default: () => uuidv4(),
  },
  pickupId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Pickup' },
  customer:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  weight:    { type: Number, required: true, min: 0.1 },
  dimensions: {
    length: Number,
    width:  Number,
    height: Number,
  },
  type: {
    type: String,
    enum: ['document', 'parcel', 'fragile', 'electronics', 'bulk'],
    default: 'parcel',
  },
  quantity:  { type: Number, default: 1, min: 1 },
  codAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'In Pickup', 'At Center', 'In Transit', 'Delivered', 'Returned'],
    default: 'At Center',
  },
  
  // Receiver information — optional at creation, filled in before dispatch
  receiver: {
    name:  { type: String },
    phone: { type: String },
    address: {
      line1:   { type: String },
      line2:   { type: String },
      city:    { type: String },
      state:   { type: String },
      pincode: { type: String },
    }
  },
  
  // Sender information (populated from customer)
  sender: {
    name: { type: String },
    phone: { type: String },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    }
  },
  statusHistory: [{
    status:    String,
    location:  String,
    gps:       { lat: Number, lng: Number },
    note:      String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }],
  currentLocation: String,
  deliveredAt: Date,
  deliveryProof: {
    photoProof:    String,
    recipientName: String,
    signature:     String,
    deliveredBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt:   Date,
  },
  assignedAgent:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

parcelSchema.index({ status: 1 });
parcelSchema.index({ customer: 1 });

module.exports = mongoose.model('Parcel', parcelSchema);
