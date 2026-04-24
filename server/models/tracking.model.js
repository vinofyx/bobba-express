const mongoose = require('mongoose');

const trackingLogSchema = new mongoose.Schema({
  parcelId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Parcel', required: true, index: true },
  status:    { type: String, required: true },
  location:  { type: String, required: true },
  note:      { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('TrackingLog', trackingLogSchema);
