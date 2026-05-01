const Shipment    = require('../models/shipment.model');
const Parcel      = require('../models/parcel.model');
const TrackingLog = require('../models/tracking.model');
const sms         = require('../services/sms.service');

// POST /api/shipments
const createShipment = async (req, res) => {
  try {
    const { vehicleNumber, driver, originHub, destinationHub, parcelIds } = req.body;

    if (!vehicleNumber || !vehicleNumber.trim())
      return res.status(400).json({ success: false, message: 'Vehicle number is required.' });

    if (!driver || !driver.name || !driver.name.trim())
      return res.status(400).json({ success: false, message: 'Driver name is required.' });

    if (!parcelIds || parcelIds.length === 0)
      return res.status(400).json({ success: false, message: 'At least one parcel is required.' });

    // Only parcels that are At Center (at warehouse/hub) can be shipped
    const parcels = await Parcel.find({
      _id: { $in: parcelIds },
      status: 'At Center',
    }).populate('customer', 'name phone email');

    if (parcels.length !== parcelIds.length) {
      return res.status(400).json({
        success: false,
        message: `Some parcels not found or not available. Only parcels with "At Center" status can be added to a shipment. Found ${parcels.length} of ${parcelIds.length} requested.`,
      });
    }

    // Guard against parcels already in an active shipment
    const activeShipments = await Shipment.find({
      parcels: { $in: parcelIds },
      status: { $in: ['Created', 'Dispatched', 'In Transit'] },
    });

    if (activeShipments.length > 0) {
      const assignedIds = activeShipments.flatMap(s => s.parcels.map(id => id.toString()));
      const conflicts   = parcelIds.filter(id => assignedIds.includes(id.toString()));
      return res.status(400).json({
        success: false,
        message: 'Some parcels are already assigned to active shipments.',
        conflictingParcels: conflicts,
      });
    }

    const origin      = originHub      || '';
    const destination = destinationHub || '';

    const shipment = new Shipment({
      vehicleNumber: vehicleNumber.trim(),
      driver: {
        name:  driver.name.trim(),
        phone: driver.phone || '',
      },
      vehicle: { number: vehicleNumber.trim() },
      originHub:      origin,
      destinationHub: destination,
      route: {
        origin:      { city: origin,      state: '' },
        destination: { city: destination, state: '' },
      },
      departureTime: new Date(),
      parcels: parcelIds,
      status: 'Created',
      statusHistory: [{
        status:    'Created',
        location:  origin,
        note:      `Shipment created${origin ? ` from ${origin}` : ''}${destination ? ` to ${destination}` : ''}`,
        updatedBy: req.user._id,
        timestamp: new Date(),
      }],
      createdBy: req.user._id,
    });

    await shipment.save();

    // Mark parcels In Transit immediately
    await Parcel.updateMany(
      { _id: { $in: parcelIds } },
      {
        status: 'In Transit',
        currentLocation: origin || 'In Transit',
        $push: {
          statusHistory: {
            status:    'In Transit',
            location:  origin || 'In Transit',
            note:      `Added to shipment ${shipment.shipmentId}`,
            updatedBy: req.user._id,
            timestamp: new Date(),
          },
        },
      }
    );

    // Tracking logs for all parcels
    const trackingLogs = parcelIds.map(parcelId => ({
      parcelId,
      status:    'In Transit',
      location:  origin || 'In Transit',
      note:      `Shipment ${shipment.shipmentId} created`,
      updatedBy: req.user._id,
    }));
    await TrackingLog.insertMany(trackingLogs);

    // SMS — non-blocking
    try { await sms.sendShipmentDispatched(shipment); } catch (e) { console.warn('SMS sendShipmentDispatched failed:', e.message); }
    for (const parcel of parcels) {
      try { await sms.sendShipmentDispatchedCustomer(parcel, shipment); } catch (e) { console.warn('SMS sendShipmentDispatchedCustomer failed:', e.message); }
    }

    console.log(`✅ Shipment ${shipment.shipmentId} created — ${parcelIds.length} parcels, vehicle ${vehicleNumber}, driver ${driver.name}`);

    const populated = await Shipment.findById(shipment._id)
      .populate('parcels', 'trackingId status customer')
      .populate('createdBy', 'name');

    return res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: { shipment: populated },
    });
  } catch (err) {
    console.error('❌ Shipment creation error:', err);
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

// PATCH /api/shipments/:id/dispatch
const dispatchShipment = async (req, res) => {
  try {
    const { note } = req.body;
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Dispatched',
        dispatchedAt: new Date(),
        $push: {
          statusHistory: {
            status:    'Dispatched',
            location:  'Origin Hub',
            note:      note || 'Dispatched.',
            updatedBy: req.user?._id,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    ).populate('parcels', 'trackingId _id');

    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    await Parcel.updateMany(
      { _id: { $in: shipment.parcels.map(p => p._id) } },
      { status: 'In Transit', currentLocation: 'In Transit' }
    );

    const logs = shipment.parcels.map(p => ({
      parcelId:  p._id,
      status:    'In Transit',
      location:  `In Transit to ${shipment.destinationHub || 'Hub'}`,
      note:      `Shipment ${shipment.shipmentId} dispatched.`,
      updatedBy: req.user?._id,
    }));
    await TrackingLog.insertMany(logs);

    // SMS — non-blocking
    const parcelsWithCustomers = await Parcel.find({ _id: { $in: shipment.parcels.map(p => p._id) } })
      .populate('customer', 'name phone');
    try { await sms.sendShipmentDispatched(shipment, parcelsWithCustomers); } catch (e) { console.warn('SMS failed:', e.message); }

    return res.json({ success: true, data: { shipment } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/shipments/:id/receive
const receiveShipment = async (req, res) => {
  try {
    const { note } = req.body;
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Received',
        receivedAt: new Date(),
        $push: {
          statusHistory: {
            status:    'Received',
            location:  'Destination Hub',
            note:      note || 'Received.',
            updatedBy: req.user?._id,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    ).populate('parcels', '_id');

    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    await Parcel.updateMany(
      { _id: { $in: shipment.parcels.map(p => p._id) } },
      { status: 'At Center', currentLocation: shipment.destinationHub || 'Destination Hub' }
    );

    const logs = shipment.parcels.map(p => ({
      parcelId:  p._id,
      status:    'At Center',
      location:  shipment.destinationHub || 'Destination Hub',
      note:      'Arrived at destination hub.',
      updatedBy: req.user?._id,
    }));
    await TrackingLog.insertMany(logs);

    return res.json({ success: true, data: { shipment } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/shipments/:id/delivered
const markDelivered = async (req, res) => {
  try {
    const { photoProof, recipientName, signature, note } = req.body;

    if (!photoProof)
      return res.status(400).json({ success: false, message: 'Photo proof is required for delivery completion.' });

    if (!recipientName || !recipientName.trim())
      return res.status(400).json({ success: false, message: 'Recipient name is required.' });

    const shipment = await Shipment.findById(req.params.id)
      .populate('parcels', '_id customer trackingId')
      .populate('driver.userId', 'name phone');

    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    if (shipment.status !== 'In Transit')
      return res.status(400).json({ success: false, message: 'Shipment must be "In Transit" to be marked as delivered.' });

    const destCity = shipment.destinationHub || shipment.route?.destination?.city || 'Destination';
    const name     = recipientName.trim();

    const updatedShipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      {
        status:        'Completed',
        deliveredAt:   new Date(),
        actualArrival: new Date(),
        deliveryProof: {
          photoProof,
          recipientName: name,
          signature:     signature || '',
          deliveredBy:   req.user?._id,
          deliveredAt:   new Date(),
        },
        $push: {
          statusHistory: {
            status:    'Completed',
            location:  destCity,
            note:      note || `Delivered to ${name}.`,
            updatedBy: req.user?._id,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    ).populate('parcels', 'customer trackingId')
      .populate('createdBy', 'name');

    const parcelUpdateData = {
      status:      'Delivered',
      currentLocation: destCity,
      deliveredAt: new Date(),
      deliveryProof: {
        photoProof,
        recipientName: name,
        signature:     signature || '',
        deliveredBy:   req.user?._id,
        deliveredAt:   new Date(),
      },
      $push: {
        statusHistory: {
          status:    'Delivered',
          location:  destCity,
          note:      `Delivered to ${name}. Shipment ${updatedShipment.shipmentId}`,
          updatedBy: req.user?._id,
          timestamp: new Date(),
        },
      },
    };

    await Parcel.updateMany({ _id: { $in: shipment.parcels.map(p => p._id) } }, parcelUpdateData);

    const logs = shipment.parcels.map(p => ({
      parcelId:  p._id,
      status:    'Delivered',
      location:  destCity,
      note:      `Delivered to ${name}. Shipment ${updatedShipment.shipmentId}`,
      updatedBy: req.user?._id,
      timestamp: new Date(),
    }));
    await TrackingLog.insertMany(logs);

    const updatedParcels = await Parcel.find({ _id: { $in: shipment.parcels.map(p => p._id) } })
      .populate('customer', 'name phone email');

    // SMS — non-blocking
    for (const parcel of updatedParcels) {
      try { await sms.sendParcelDelivered(parcel); } catch (e) { console.warn('SMS sendParcelDelivered failed:', e.message); }
    }

    console.log(`✅ Shipment ${updatedShipment.shipmentId} delivered to ${name}`);

    return res.json({
      success: true,
      message: 'Shipment delivered successfully',
      data: { shipment: updatedShipment, parcels: updatedParcels },
    });
  } catch (err) {
    console.error('❌ Shipment delivery error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/shipments/:id/manifest
const generateManifest = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('parcels', 'trackingId weight dimensions type receiver sender')
      .populate('createdBy', 'name');

    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });

    const manifestData = {
      shipmentId:       shipment.shipmentId,
      vehicleNumber:    shipment.vehicleNumber,
      driver:           shipment.driver,
      originHub:        shipment.originHub,
      destinationHub:   shipment.destinationHub,
      departureTime:    shipment.departureTime,
      estimatedArrival: shipment.estimatedArrival,
      parcels: shipment.parcels.map(parcel => ({
        trackingId: parcel.trackingId,
        weight:     parcel.weight,
        dimensions: parcel.dimensions,
        type:       parcel.type,
        sender:     parcel.sender,
        receiver:   parcel.receiver,
      })),
      totalParcels: shipment.parcels.length,
      totalWeight:  shipment.parcels.reduce((sum, p) => sum + (p.weight || 0), 0),
      createdAt:    shipment.createdAt,
      createdBy:    shipment.createdBy,
    };

    return res.json({ success: true, message: 'Manifest data retrieved successfully', data: { manifest: manifestData } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/drivers
const getAvailableDrivers = async (req, res) => {
  try {
    const User = require('../models/User');
    const drivers = await User.find({ role: 'agent', isActive: true }).select('name phone email lastLogin');
    return res.json({ success: true, data: { drivers } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/shipments/agent/deliveries
const getAgentDeliveries = async (req, res) => {
  try {
    const shipments = await Shipment.find({
      'driver.userId': req.user._id,
      status: 'In Transit',
    })
      .populate('parcels', 'trackingId weight type customer')
      .sort({ departureTime: -1 });

    return res.json({ success: true, data: { shipments } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createShipment,
  getShipments,
  getShipmentById,
  dispatchShipment,
  receiveShipment,
  markDelivered,
  generateManifest,
  getAvailableDrivers,
  getAgentDeliveries,
};
