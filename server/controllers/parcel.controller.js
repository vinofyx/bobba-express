const { v4: uuidv4 } = require('uuid');
const Parcel      = require('../models/parcel.model');
const Pickup      = require('../models/pickup.model');
const TrackingLog = require('../models/tracking.model');
const sms         = require('../services/sms.service');

// POST /api/parcels   (Phase 7)
const createParcel = async (req, res) => {
  try {
    const { pickupId, weight, dimensions, quantity, codAmount, type } = req.body;
    if (!pickupId || !weight)
      return res.status(400).json({ success: false, message: 'pickupId and weight are required.' });

    const pickup = await Pickup.findById(pickupId).populate('customer');
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found.' });

    const parcel = await Parcel.create({
      pickupId: pickup._id,
      customer: pickup.customer._id,
      weight,
      dimensions,
      quantity:  quantity  || 1,
      codAmount: codAmount || 0,
      type:      type      || pickup.parcelType,
      barcode:   uuidv4(),        // UUID barcode (Phase 7)
      status: 'In Pickup',
      assignedAgent: pickup.assignedAgent,
      statusHistory: [{
        status: 'In Pickup',
        location: pickup.pickupAddress?.city || '',
        note: 'Parcel created at pickup.',
        updatedBy: req.user?._id,
        timestamp: new Date(),
      }],
      currentLocation: pickup.pickupAddress?.city || '',
      createdBy: req.user?._id,
    });

    // mark pickup as Picked
    await Pickup.findByIdAndUpdate(pickupId, {
      status: 'Picked',
      $push: { statusHistory: { status: 'Picked', note: 'Parcel created.', updatedBy: req.user?._id, timestamp: new Date() } },
    });

    // Initial tracking log
    await TrackingLog.create({
      parcelId: parcel._id,
      status:   'In Pickup',
      location: pickup.pickupAddress?.city || 'Unknown',
      note:     'Parcel created at pickup.',
      updatedBy: req.user?._id,
    });

    return res.status(201).json({ success: true, data: { parcel } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/parcels
const getParcels = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)        filter.status        = req.query.status;
    if (req.query.assignedAgent) filter.assignedAgent = req.query.assignedAgent;
    if (req.query.onlyMine === 'true' && req.user) filter.assignedAgent = req.user._id;

    const parcels = await Parcel.find(filter)
      .populate('customer', 'name phone email')
      .populate('assignedAgent', 'name email')
      .populate('pickupId', 'scheduledDate pickupTime')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: { parcels } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/parcels/:id
const getParcelById = async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id)
      .populate('customer', 'name phone email address')
      .populate('assignedAgent', 'name email')
      .populate('pickupId');
    if (!parcel) return res.status(404).json({ success: false, message: 'Parcel not found.' });
    return res.json({ success: true, data: { parcel } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/parcels/:id/status   (Phase 8 + Phase 10 GPS)
const updateParcelStatus = async (req, res) => {
  try {
    const { status, location, note, gps } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'status is required.' });

    const historyEntry = {
      status, location: location || '', note: note || 'Status updated.',
      updatedBy: req.user?._id, timestamp: new Date(),
    };
    if (gps?.lat && gps?.lng) historyEntry.gps = gps;

    const parcel = await Parcel.findByIdAndUpdate(
      req.params.id,
      { status, currentLocation: location, $push: { statusHistory: historyEntry } },
      { new: true }
    ).populate('customer', 'name phone');

    if (!parcel) return res.status(404).json({ success: false, message: 'Parcel not found.' });

    // Every status change = new tracking log (Phase 8 core logic)
    const logEntry = { parcelId: parcel._id, status, location: location || 'Unknown', note: note || 'Status updated.', updatedBy: req.user?._id };
    if (gps?.lat && gps?.lng) logEntry.gps = gps;
    await TrackingLog.create(logEntry);

    // SMS: notify customer on delivery
    if (status === 'Delivered') await sms.sendParcelDelivered(parcel);

    return res.json({ success: true, data: { parcel } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createParcel, getParcels, getParcelById, updateParcelStatus };
