const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId: {
    type: String,
    unique: true,
    default: () => 'SHP' + Date.now().toString(36).toUpperCase(),
  },
  parcels:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' }],
  vehicleNumber: { type: String, required: true, trim: true },
  driver: {
    name:  { type: String, required: true },
    phone: { type: String },
  },
  originHub:      { type: String },
  destinationHub: { type: String },
  status: {
    type: String,
    enum: ['Created', 'Dispatched', 'In Transit', 'Received', 'Cancelled'],
    default: 'Created',
  },
  statusHistory: [{
    status:    String,
    location:  String,
    note:      String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }],
  dispatchedAt: Date,
  receivedAt:   Date,
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

shipmentSchema.index({ status: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
