const mongoose = require('mongoose');

const statusEntrySchema = new mongoose.Schema({
  status:    { type: String, required: true },
  note:      { type: String },
  location:  { type: String },
  gps:       { lat: Number, lng: Number },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const pickupSchema = new mongoose.Schema({
  // Auto-generated pickup ID
  pickupId: {
    type: String,
    unique: true,
    required: true,
  },
  customer:     { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  pickupAddress: {
    line1:   { type: String, required: true },
    line2:   { type: String },
    city:    { type: String, required: true },
    state:   { type: String, required: true },
    pincode: { type: String, required: true },
  },
  deliveryType:  { type: String, enum: ['standard', 'express', 'same_day'], default: 'standard' },
  parcelType:    { type: String, enum: ['document', 'parcel', 'fragile', 'electronics', 'bulk'], default: 'parcel' },
  scheduledDate: { type: Date, required: true },
  pickupTime:    { type: String, default: '09:00' },
  parcelCount:   { type: Number, default: 1, min: 1, max: 100 },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['Requested', 'Assigned', 'Picked', 'Failed'],
    default: 'Requested',
  },
  statusHistory: [statusEntrySchema],
  notes:        { type: String },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Completion proof fields
  completionProof: {
    photoUrl: { type: String },
    actualCount: { type: Number, min: 0 },
    signatureUrl: { type: String },
    completionNotes: { type: String },
    completedAt: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    location: {
      type: String,
    },
    gps: {
      lat: Number,
      lng: Number
    }
  },
}, { timestamps: true });

pickupSchema.index({ customer: 1, status: 1 });
pickupSchema.index({ assignedAgent: 1, scheduledDate: 1 });

module.exports = mongoose.model('Pickup', pickupSchema);
