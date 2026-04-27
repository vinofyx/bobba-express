const mongoose = require('mongoose');

const trackingLogSchema = new mongoose.Schema({
  parcelId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel', required: true },
  status:    { type: String, required: true },
  location:  { type: String, required: true },
  gps:       { lat: Number, lng: Number },
  note:      { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

trackingLogSchema.index({ parcelId: 1, timestamp: -1 });

module.exports = mongoose.model('TrackingLog', trackingLogSchema);
