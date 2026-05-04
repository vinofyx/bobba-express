const Shipment = require('../models/shipment.model');
const Parcel = require('../models/parcel.model');
const TrackingLog = require('../models/tracking.model');
const sms = require('../services/sms.service');

// ─────────────────────────────────────────────
// CREATE SHIPMENT
// ─────────────────────────────────────────────
const createShipment = async (req, res) => {
  try {
    const { vehicleNumber, driver, originHub, destinationHub, parcelIds } = req.body;

    if (!vehicleNumber) return res.status(400).json({ success: false, message: 'Vehicle number required' });
    if (!driver?.name) return res.status(400).json({ success: false, message: 'Driver name required' });
    if (!parcelIds?.length) return res.status(400).json({ success: false, message: 'Parcels required' });

    const parcels = await Parcel.find({ _id: { $in: parcelIds }, status: 'At Center' })
      .populate('customer', 'name phone');

    const shipment = await Shipment.create({
      vehicleNumber,
      driver,
      originHub,
      destinationHub,
      parcels: parcelIds,
      status: 'Created',
      departureTime: new Date(),
      createdBy: req.user._id,
    });

    await Parcel.updateMany(
      { _id: { $in: parcelIds } },
      { status: 'In Transit', currentLocation: originHub || 'Transit' }
    );

    // 🔥 SMS
    try { await sms.sendShipmentDispatched(shipment); } catch (e) {}

    for (const parcel of parcels) {
      try { await sms.sendShipmentDispatchedCustomer(parcel); } catch (e) {}
    }

    return res.status(201).json({
      success: true,
      message: 'Shipment created',
      data: { shipment }
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// DISPATCH
// ─────────────────────────────────────────────
const dispatchShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { status: 'Dispatched' },
      { new: true }
    ).populate('parcels');

    if (!shipment) return res.status(404).json({ success: false });

    const parcels = await Parcel.find({ _id: { $in: shipment.parcels } })
      .populate('customer', 'phone');

    for (const parcel of parcels) {
      try { await sms.sendShipmentDispatchedCustomer(parcel); } catch (e) {}
    }

    return res.json({ success: true, data: { shipment } });

  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// RECEIVE
// ─────────────────────────────────────────────
const receiveShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { status: 'Received' },
      { new: true }
    );

    return res.json({ success: true, data: { shipment } });

  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// DELIVERED
// ─────────────────────────────────────────────
const markDelivered = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('parcels');

    const parcels = await Parcel.find({ _id: { $in: shipment.parcels } })
      .populate('customer', 'name phone');

    await Parcel.updateMany(
      { _id: { $in: shipment.parcels } },
      { status: 'Delivered' }
    );

    // 🔥 SMS
    for (const parcel of parcels) {
      try { await sms.sendParcelDelivered(parcel); } catch (e) {}
    }

    return res.json({ success: true });

  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

// ─────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────
const getShipments = async (req, res) => {
  const shipments = await Shipment.find().sort({ createdAt: -1 });
  res.json({ success: true, data: { shipments } });
};

const getShipmentById = async (req, res) => {
  const shipment = await Shipment.findById(req.params.id);
  res.json({ success: true, data: { shipment } });
};

module.exports = {
  createShipment,
  dispatchShipment,
  receiveShipment,
  markDelivered,
  getShipments,
  getShipmentById
};