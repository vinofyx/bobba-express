const TrackingLog = require('../models/tracking.model');
const Parcel      = require('../models/parcel.model');

// GET /api/tracking/:trackingId   — public, used by customers (Phase 8)
const getTracking = async (req, res) => {
  try {
    const parcel = await Parcel.findOne({ trackingId: req.params.trackingId })
      .select('trackingId status currentLocation weight type barcode customer')
      .populate('customer', 'name');
    if (!parcel) return res.status(404).json({ success: false, message: 'Tracking ID not found.' });

    const logs = await TrackingLog.find({ parcelId: parcel._id })
      .sort({ timestamp: -1 })
      .limit(30)
      .populate('updatedBy', 'name role');

    return res.json({ success: true, data: { parcel, logs } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tracking   — staff/admin adds manual tracking event (Phase 8)
const addTrackingEvent = async (req, res) => {
  try {
    const { parcelId, status, location, note, gps } = req.body;
    if (!parcelId || !status || !location)
      return res.status(400).json({ success: false, message: 'parcelId, status and location are required.' });

    const logData = { parcelId, status, location, note: note || '', updatedBy: req.user?._id };
    if (gps?.lat && gps?.lng) logData.gps = gps;

    const log = await TrackingLog.create(logData);

    // Sync parcel status
    const parcelUpdate = { status, currentLocation: location, $push: { statusHistory: { status, location, note: note || '', updatedBy: req.user?._id, timestamp: new Date() } } };
    if (gps?.lat && gps?.lng) parcelUpdate.$push.statusHistory.gps = gps;
    await Parcel.findByIdAndUpdate(parcelId, parcelUpdate);

    return res.status(201).json({ success: true, data: { log } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTracking, addTrackingEvent };
