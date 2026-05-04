const Pickup = require('../models/pickup.model');
const TrackingLog = require('../models/tracking.model');
const sms = require('../services/sms.service');

// ─────────────────────────────────────────────
// POST /api/pickups
// ─────────────────────────────────────────────
const createPickup = async (req, res) => {
  try {
    const { customer, pickupAddress, scheduledDate, pickupTime, deliveryType, parcelType, notes, parcelCount } = req.body;

    const prefix = 'PU';
    const count = await Pickup.countDocuments();
    const year = new Date().getFullYear();
    const nextId = String(count + 1).padStart(3, '0');
    const pickupId = `${prefix}-${year}-${nextId}`;

    const pickup = await Pickup.create({
      pickupId,
      customer,
      pickupAddress,
      scheduledDate: new Date(scheduledDate),
      pickupTime,
      deliveryType: deliveryType || 'standard',
      parcelType: parcelType || 'parcel',
      parcelCount: parcelCount || 1,
      notes: notes || '',
      status: 'Requested',
      statusHistory: [{
        status: 'Requested',
        note: 'Pickup request created.',
        updatedBy: req.user?._id,
        timestamp: new Date()
      }],
      createdBy: req.user?._id,
    });

    const populated = await Pickup.findById(pickup._id).populate('customer', 'name phone');

    // 🔥 SMS (safe)
    try { await sms.sendPickupScheduled(populated); }
    catch (e) { console.warn('SMS failed:', e.message); }

    return res.status(201).json({
      success: true,
      message: 'Pickup scheduled successfully',
      data: { pickup }
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// ASSIGN AGENT
// ─────────────────────────────────────────────
const assignAgent = async (req, res) => {
  try {
    const { agentId } = req.body;

    const pickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      { assignedAgent: agentId, status: 'Assigned' },
      { new: true }
    ).populate('customer assignedAgent', 'name phone');

    // 🔥 SMS
    try { await sms.sendPickupAssigned(pickup); } catch (e) {}
    try { await sms.sendDriverAssigned(pickup); } catch (e) {}

    return res.json({ success: true, data: { pickup } });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// COMPLETE PICKUP
// ─────────────────────────────────────────────
const completePickup = async (req, res) => {
  try {
    const pickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      { status: 'Picked' },
      { new: true }
    ).populate('customer assignedAgent', 'name phone');

    // 🔥 SMS
    try { await sms.sendPickupCompleted(pickup); } catch (e) {}
    try { await sms.sendPickupCompletedCustomer(pickup); } catch (e) {}

    return res.json({ success: true, data: { pickup } });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────────
const updatePickupStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const pickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('customer', 'name phone');

    if (status === 'Picked') {
      try { await sms.sendPickupCompleted(pickup); } catch (e) {}
    }

    return res.json({ success: true, data: { pickup } });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────
const getPickups = async (req, res) => {
  try {
    const pickups = await Pickup.find()
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: { pickups } });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────
const getPickupById = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('customer', 'name phone email');

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup not found.' });
    }

    return res.json({ success: true, data: { pickup } });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
module.exports = {
  createPickup,
  assignAgent,
  completePickup,
  updatePickupStatus,
  getPickups,
  getPickupById
};