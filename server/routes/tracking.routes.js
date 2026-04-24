const express = require('express');
const router = express.Router();
const TrackingLog = require('../models/tracking.model');
const Parcel = require('../models/parcel.model');

// GET /api/tracking/:trackingId — public tracking
router.get('/:trackingId', async (req, res) => {
  try {
    const parcel = await Parcel.findOne({ trackingId: req.params.trackingId })
      .select('trackingId status currentLocation weight type');
    if (!parcel) return res.status(404).json({ success: false, message: 'Parcel not found.' });

    const logs = await TrackingLog.find({ parcelId: parcel._id })
      .sort({ timestamp: -1 }).limit(20);

    return res.json({ success: true, data: { parcel, logs } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/tracking — add tracking event (staff only)
router.post('/', async (req, res) => {
  try {
    const { parcelId, status, location, note } = req.body;
    if (!parcelId || !status || !location) {
      return res.status(400).json({ success: false, message: 'parcelId, status, location required.' });
    }
    const log = await TrackingLog.create({ parcelId, status, location, note });
    await Parcel.findByIdAndUpdate(parcelId, { status, currentLocation: location,
      $push: { statusHistory: { status, location, note } } });
    return res.status(201).json({ success: true, data: { log } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
