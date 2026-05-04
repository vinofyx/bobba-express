const { v4: uuidv4 } = require('uuid');
const Parcel      = require('../models/parcel.model');
const Pickup      = require('../models/pickup.model');
const TrackingLog = require('../models/tracking.model');
const sms         = require('../services/sms.service');

// ─────────────────────────────────────────────
// POST /api/parcels
// ─────────────────────────────────────────────
const createParcel = async (req, res) => {
  try {
    const { pickupId, weight, dimensions, quantity, codAmount, type, receiver, trackingId: customTrackingId } = req.body;

    if (!pickupId || !weight)
      return res.status(400).json({ success: false, message: 'pickupId and weight are required.' });

    if (weight <= 0)
      return res.status(400).json({ success: false, message: 'Weight must be greater than 0.' });

    const pickup = await Pickup.findById(pickupId).populate('customer');
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found.' });

    // 🔹 Generate Tracking ID
    let trackingId = customTrackingId;
    if (!trackingId) {
      do {
        trackingId = 'BE' + Date.now().toString(36).toUpperCase() +
                     Math.random().toString(36).slice(2, 5).toUpperCase();
      } while (await Parcel.findOne({ trackingId }));
    }

    const parcel = new Parcel({
      trackingId,
      pickupId: pickup._id,
      customer: pickup.customer._id,
      weight,
      dimensions,
      quantity: quantity || 1,
      codAmount: codAmount || 0,
      type: type || pickup.parcelType,
      barcode: uuidv4(),
      status: 'At Center',
      assignedAgent: pickup.assignedAgent,
      currentLocation: 'BobbaExpress Warehouse',
      createdBy: req.user?._id,

      sender: {
        name: pickup.customer.name,
        phone: pickup.customer.phone,
        address: pickup.customer.address
      },

      receiver: receiver || {},

      statusHistory: [{
        status: 'At Center',
        location: 'BobbaExpress Warehouse',
        note: 'Parcel created',
        updatedBy: req.user?._id,
        timestamp: new Date()
      }]
    });

    await parcel.save();

    // 🔹 Update Pickup
    await Pickup.findByIdAndUpdate(pickupId, {
      status: 'Picked',
      $push: {
        statusHistory: {
          status: 'Picked',
          note: 'Parcel created.',
          updatedBy: req.user?._id,
          timestamp: new Date()
        }
      }
    });

    // 🔹 Tracking Log
    await TrackingLog.create({
      parcelId: parcel._id,
      status: 'In Pickup',
      location: pickup.pickupAddress?.city || 'Unknown',
      note: 'Parcel created at pickup.',
      updatedBy: req.user?._id,
    });

    // ─────────────────────────────────────────────
    // 🔥 SMS: Parcel Created
    // ─────────────────────────────────────────────
    try {
      await sms.sendParcelCreated({
        ...parcel.toObject(),
        customer: pickup.customer
      });
    } catch (err) {
      console.warn("⚠ SMS failed (parcel create):", err.message);
    }

    return res.status(201).json({ success: true, data: { parcel } });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/parcels
// ─────────────────────────────────────────────
const getParcels = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const parcels = await Parcel.find(filter)
      .populate('customer', 'name phone email')
      .populate('assignedAgent', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: { parcels } });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/parcels/:id
// ─────────────────────────────────────────────
const getParcelById = async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id)
      .populate('customer', 'name phone email');

    if (!parcel)
      return res.status(404).json({ success: false, message: 'Parcel not found.' });

    return res.json({ success: true, data: { parcel } });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/parcels/:id/status
// ─────────────────────────────────────────────
const updateParcelStatus = async (req, res) => {
  try {
    const { status, location, note } = req.body;

    if (!status)
      return res.status(400).json({ success: false, message: 'status is required.' });

    const parcel = await Parcel.findByIdAndUpdate(
      req.params.id,
      {
        status,
        currentLocation: location,
        $push: {
          statusHistory: {
            status,
            location: location || '',
            note: note || '',
            updatedBy: req.user?._id,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate('customer', 'name phone');

    if (!parcel)
      return res.status(404).json({ success: false, message: 'Parcel not found.' });

    await TrackingLog.create({
      parcelId: parcel._id,
      status,
      location: location || 'Unknown',
      note: note || '',
      updatedBy: req.user?._id,
    });

    // ─────────────────────────────────────────────
    // 🔥 SMS: Delivered
    // ─────────────────────────────────────────────
    if (status === 'Delivered') {
      try {
        await sms.sendParcelDelivered(parcel);
      } catch (err) {
        console.warn("⚠ SMS failed (delivery):", err.message);
      }
    }

    return res.json({ success: true, data: { parcel } });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE PARCEL
// ─────────────────────────────────────────────
const updateParcel = async (req, res) => {
  try {
    const parcel = await Parcel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.json({ success: true, data: { parcel } });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
module.exports = {
  createParcel,
  getParcels,
  getParcelById,
  updateParcel,
  updateParcelStatus
};