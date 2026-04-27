const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const parcelSchema = new mongoose.Schema({
  // Auto-generated human-readable tracking ID
  trackingId: {
    type: String,
    unique: true,
    default: () => 'TRK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
  },
  // UUID-based barcode (Phase 7)
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    default: () => uuidv4(),
  },
  pickupId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Pickup' },
  customer:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
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
    default: 'Pending',
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
  assignedAgent:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

parcelSchema.index({ status: 1 });
parcelSchema.index({ customer: 1 });

module.exports = mongoose.model('Parcel', parcelSchema);
