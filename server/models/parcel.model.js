const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const parcelSchema = new mongoose.Schema({
  trackingId:  { type: String, unique: true, default: () => 'TRK' + nanoid(10).toUpperCase() },
  barcode:     { type: String, unique: true, sparse: true },
  pickupId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Pickup' },
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  weight:      { type: Number, required: true, min: 0.1 },
  dimensions:  {
    length: { type: Number },
    width:  { type: Number },
    height: { type: Number },
  },
  type: {
    type: String,
    enum: ['document', 'parcel', 'fragile', 'electronics', 'bulk'],
    default: 'parcel',
  },
  quantity:    { type: Number, default: 1, min: 1 },
  codAmount:   { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'In Pickup', 'At Center', 'In Transit', 'Delivered', 'Returned'],
    default: 'Pending',
  },
  statusHistory: [{
    status:    { type: String },
    location:  { type: String },
    note:      { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }],
  currentLocation: { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

parcelSchema.index({ trackingId: 1 });
parcelSchema.index({ status: 1 });

module.exports = mongoose.model('Parcel', parcelSchema);
