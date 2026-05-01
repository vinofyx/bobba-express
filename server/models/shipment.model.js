const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId: {
    type: String,
    unique: true,
    default: () => 'SH-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 900) + 100).padStart(3, '0'),
  },
  parcels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' }],

  // Top-level flat fields — used by the frontend form
  vehicleNumber: { type: String },

  // Route information — optional; populated from originHub/destinationHub
  route: {
    origin: {
      city:  { type: String },
      state: { type: String },
    },
    destination: {
      city:  { type: String },
      state: { type: String },
    },
    distance:          { type: Number, default: 0 },
    estimatedDuration: { type: Number, default: 0 },
  },

  // Driver info — stored inline (no User FK required)
  driver: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:   { type: String },
    phone:  { type: String },
    licenseNumber: { type: String },
  },

  // Vehicle info
  vehicle: {
    number:   { type: String },
    type:     { type: String, enum: ['van', 'truck', 'motorcycle', 'bicycle'], default: 'van' },
    capacity: { type: Number, default: 100 },
  },

  // Schedule
  departureTime:    { type: Date },
  estimatedArrival: { type: Date },
  actualArrival:    { type: Date },

  // Status
  status: {
    type: String,
    enum: ['Created', 'Dispatched', 'In Transit', 'Received', 'Completed', 'Cancelled'],
    default: 'Created',
  },
  statusHistory: [{
    status:    String,
    location:  String,
    note:      String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }],

  // Hub labels (primary display fields)
  originHub:      { type: String },
  destinationHub: { type: String },

  dispatchedAt: Date,
  receivedAt:   Date,
  deliveredAt:  Date,

  deliveryProof: {
    photoProof:    String,
    recipientName: String,
    signature:     String,
    deliveredBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt:   Date,
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

shipmentSchema.index({ status: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
