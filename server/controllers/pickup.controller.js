const Pickup     = require('../models/pickup.model');
const TrackingLog = require('../models/tracking.model');
const sms        = require('../services/sms.service');

// POST /api/pickups
const createPickup = async (req, res) => {
  try {
    const { customer, pickupAddress, scheduledDate, pickupTime, deliveryType, parcelType, notes } = req.body;
    if (!customer || !scheduledDate || !pickupAddress)
      return res.status(400).json({ success: false, message: 'customer, scheduledDate and pickupAddress are required.' });

    const pickup = await Pickup.create({
      customer, pickupAddress,
      scheduledDate: new Date(scheduledDate),
      pickupTime: pickupTime || '09:00',
      deliveryType: deliveryType || 'standard',
      parcelType:   parcelType   || 'parcel',
      notes:        notes        || '',
      status: 'Requested',
      statusHistory: [{ status: 'Requested', note: 'Pickup request created.', updatedBy: req.user?._id }],
      createdBy: req.user?._id,
    });

    // SMS: notify pickup scheduled (populate customer so phone/name are available)
    const populated = await Pickup.findById(pickup._id).populate('customer', 'name phone');
    await sms.sendPickupScheduled(populated);

    return res.status(201).json({ success: true, data: { pickup } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/pickups
const getPickups = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)        filter.status        = req.query.status;
    if (req.query.assignedAgent) filter.assignedAgent = req.query.assignedAgent;
    if (req.query.onlyMine === 'true' && req.user) filter.assignedAgent = req.user._id;

    const pickups = await Pickup.find(filter)
      .populate('customer', 'name phone email')
      .populate('assignedAgent', 'name email phone')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: { pickups } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/pickups/:id
const getPickupById = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('customer', 'name phone email companyName address')
      .populate('assignedAgent', 'name email phone')
      .populate('createdBy', 'name');
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found.' });
    return res.json({ success: true, data: { pickup } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/pickups/:id/assign   (Phase 5 — assign agent)
const assignAgent = async (req, res) => {
  try {
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ success: false, message: 'agentId is required.' });

    const pickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      {
        assignedAgent: agentId,
        status: 'Assigned',
        $push: {
          statusHistory: {
            status: 'Assigned',
            note: 'Agent assigned.',
            updatedBy: req.user?._id,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    ).populate('customer', 'name phone email')
     .populate('assignedAgent', 'name email phone');

    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found.' });
    return res.json({ success: true, data: { pickup } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/pickups/:id/status   (Phase 5 + 10 GPS)
const updatePickupStatus = async (req, res) => {
  try {
    const { status, note, location, gps } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'status is required.' });

    const historyEntry = {
      status, note: note || '', location: location || '',
      updatedBy: req.user?._id, timestamp: new Date(),
    };
    if (gps?.lat && gps?.lng) historyEntry.gps = gps;

    const pickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      { status, $push: { statusHistory: historyEntry } },
      { new: true }
    ).populate('customer', 'name phone email')
     .populate('assignedAgent', 'name email');

    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found.' });

    // SMS: notify pickup completed
    if (status === 'Picked') await sms.sendPickupCompleted(pickup);

    return res.json({ success: true, data: { pickup } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createPickup, getPickups, getPickupById, assignAgent, updatePickupStatus };
