const Shipment    = require('../models/shipment.model');
const Parcel      = require('../models/parcel.model');
const TrackingLog = require('../models/tracking.model');
const sms         = require('../services/sms.service');

// POST /api/shipments   (Phase 9)
const createShipment = async (req, res) => {
  try {
    const { parcelIds, vehicleNumber, driver, originHub, destinationHub } = req.body;
    if (!parcelIds?.length || !vehicleNumber || !driver?.name)
      return res.status(400).json({ success: false, message: 'parcelIds, vehicleNumber and driver.name are required.' });

    const parcels = await Parcel.find({ _id: { $in: parcelIds }, status: 'At Center' });
    if (parcels.length !== parcelIds.length)
      return res.status(400).json({ success: false, message: 'Some parcels not found or not at center.' });

    const shipment = await Shipment.create({
      parcels: parcelIds, vehicleNumber, driver, originHub, destinationHub,
      status: 'Created',
      statusHistory: [{ status: 'Created', location: originHub, note: 'Shipment created.', updatedBy: req.user?._id }],
      createdBy: req.user?._id,
    });

    return res.status(201).json({ success: true, data: { shipment } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/shipments
const getShipments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const shipments = await Shipment.find(filter)
      .populate('parcels', 'trackingId status')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: { shipments } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/shipments/:id
const getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('parcels', 'trackingId status barcode weight customer')
      .populate('createdBy', 'name email');
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });
    return res.json({ success: true, data: { shipment } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/shipments/:id/dispatch   (Phase 9)
const dispatchShipment = async (req, res) => {
  try {
    const { note } = req.body;
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Dispatched', dispatchedAt: new Date(),
        $push: { statusHistory: { status: 'Dispatched', location: 'Origin Hub', note: note || 'Dispatched.', updatedBy: req.user?._id, timestamp: new Date() } },
      },
      { new: true }
    ).populate('parcels', 'trackingId _id');

    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    // Update parcel statuses + create tracking logs (Phase 8)
    await Parcel.updateMany({ _id: { $in: shipment.parcels.map(p => p._id) } }, { status: 'In Transit', currentLocation: 'In Transit' });
    const logs = shipment.parcels.map(p => ({ parcelId: p._id, status: 'In Transit', location: `In Transit to ${shipment.destinationHub || 'Hub'}`, note: `Shipment ${shipment.shipmentId} dispatched.`, updatedBy: req.user?._id }));
    await TrackingLog.insertMany(logs);

    // SMS: dispatch notification — fetch parcels with customer data
    const parcelsWithCustomers = await Parcel.find({ _id: { $in: shipment.parcels.map(p => p._id) } })
      .populate('customer', 'name phone');
    await sms.sendShipmentDispatched(shipment, parcelsWithCustomers);

    return res.json({ success: true, data: { shipment } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/shipments/:id/receive   (Phase 9)
const receiveShipment = async (req, res) => {
  try {
    const { note } = req.body;
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Received', receivedAt: new Date(),
        $push: { statusHistory: { status: 'Received', location: 'Destination Hub', note: note || 'Received.', updatedBy: req.user?._id, timestamp: new Date() } },
      },
      { new: true }
    ).populate('parcels', '_id');

    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    await Parcel.updateMany({ _id: { $in: shipment.parcels.map(p => p._id) } }, { status: 'At Center', currentLocation: shipment.destinationHub || 'Destination Hub' });
    const logs = shipment.parcels.map(p => ({ parcelId: p._id, status: 'At Center', location: shipment.destinationHub || 'Destination Hub', note: 'Arrived at destination hub.', updatedBy: req.user?._id }));
    await TrackingLog.insertMany(logs);

    return res.json({ success: true, data: { shipment } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createShipment, getShipments, getShipmentById, dispatchShipment, receiveShipment };
