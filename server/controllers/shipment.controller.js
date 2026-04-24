const Shipment = require('../models/shipment.model');
const Parcel = require('../models/parcel.model');
const TrackingLog = require('../models/tracking.model');

// Create shipment with parcels
const createShipment = async (req, res) => {
  try {
    const { parcelIds, vehicleNumber, driver, originHub, destinationHub } = req.body;

    if (!parcelIds || !parcelIds.length || !vehicleNumber || !driver) {
      return res.status(400).json({ 
        success: false, 
        message: 'parcelIds array, vehicleNumber, and driver are required.' 
      });
    }

    // Validate parcels exist and are at center
    const parcels = await Parcel.find({ 
      _id: { $in: parcelIds },
      status: 'At Center' 
    });

    if (parcels.length !== parcelIds.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Some parcels not found or not at center.' 
      });
    }

    const shipment = await Shipment.create({
      parcels: parcelIds,
      vehicleNumber,
      driver,
      originHub,
      destinationHub,
      status: 'Created',
      statusHistory: [{ status: 'Created', note: 'Shipment created.' }],
      createdBy: req.user?.id || null
    });

    // Update parcels to be in shipment
    await Parcel.updateMany(
      { _id: { $in: parcelIds } },
      { status: 'In Transit' }
    );

    return res.status(201).json({ 
      success: true, 
      data: { shipment } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Dispatch shipment
const dispatchShipment = async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const { note } = req.body;

    const shipment = await Shipment.findByIdAndUpdate(
      shipmentId,
      {
        status: 'Dispatched',
        dispatchedAt: new Date(),
        $push: {
          statusHistory: {
            status: 'Dispatched',
            location: 'Origin Hub',
            note: note || 'Shipment dispatched.',
            updatedBy: req.user?.id || null,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate('parcels', 'trackingId');

    if (!shipment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Shipment not found.' 
      });
    }

    // Create tracking logs for all parcels
    const trackingLogs = shipment.parcels.map(parcel => ({
      parcelId: parcel._id,
      status: 'In Transit',
      location: 'In Transit',
      note: 'Shipment dispatched from origin hub.',
      updatedBy: req.user?.id || null
    }));

    await TrackingLog.insertMany(trackingLogs);

    return res.json({ 
      success: true, 
      data: { shipment } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Receive shipment at destination
const receiveShipment = async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const { note } = req.body;

    const shipment = await Shipment.findByIdAndUpdate(
      shipmentId,
      {
        status: 'Received',
        receivedAt: new Date(),
        $push: {
          statusHistory: {
            status: 'Received',
            location: 'Destination Hub',
            note: note || 'Shipment received at destination.',
            updatedBy: req.user?.id || null,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate('parcels', 'trackingId');

    if (!shipment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Shipment not found.' 
      });
    }

    // Update parcels to At Center
    await Parcel.updateMany(
      { _id: { $in: shipment.parcels } },
      { 
        status: 'At Center',
        currentLocation: 'Destination Hub'
      }
    );

    // Create tracking logs for all parcels
    const trackingLogs = shipment.parcels.map(parcel => ({
      parcelId: parcel._id,
      status: 'At Center',
      location: 'Destination Hub',
      note: 'Arrived at destination hub.',
      updatedBy: req.user?.id || null
    }));

    await TrackingLog.insertMany(trackingLogs);

    return res.json({ 
      success: true, 
      data: { shipment } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get all shipments
const getShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find()
      .populate('parcels', 'trackingId status')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ 
      success: true, 
      data: { shipments } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  createShipment,
  dispatchShipment,
  receiveShipment,
  getShipments
};
