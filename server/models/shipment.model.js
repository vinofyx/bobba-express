const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId:      { type: String, unique: true },
  parcels:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parcel' }],
  vehicleNumber:   { type: String, required: true, trim: true },
  driver: {
    name:  { type: String, required: true },
    phone: { type: String },
  },
  originHub:       { type: String },
  destinationHub:  { type: String },
  status: {
    type: String,
    enum: ['Created', 'Dispatched', 'In Transit', 'Received', 'Cancelled'],
    default: 'Created',
  },
  statusHistory: [{
    status:    { type: String },
    location:  { type: String },
    note:      { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }],
  dispatchedAt:  { type: Date },
  receivedAt:    { type: Date },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

shipmentSchema.pre('save', function(next) {
  if (!this.shipmentId) {
    this.shipmentId = 'SHP' + Date.now().toString(36).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Shipment', shipmentSchema);
