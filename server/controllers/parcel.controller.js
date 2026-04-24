const Parcel = require('../models/parcel.model');
const Pickup = require('../models/pickup.model');
const TrackingLog = require('../models/tracking.model');

// Create parcel from pickup
const createParcelFromPickup = async (req, res) => {
  try {
    const { pickupId, weight, dimensions, quantity, codAmount } = req.body;

    if (!pickupId || !weight) {
      return res.status(400).json({ 
        success: false, 
        message: 'pickupId and weight are required.' 
      });
    }

    const pickup = await Pickup.findById(pickupId).populate('customer');
    if (!pickup) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pickup not found.' 
      });
    }

    // Generate barcode if not provided
    const barcode = 'BAR' + Date.now().toString(36).toUpperCase();

    const parcel = await Parcel.create({
      pickupId: pickup._id,
      customer: pickup.customer._id,
      weight,
      dimensions,
      quantity: quantity || 1,
      codAmount: codAmount || 0,
      type: pickup.parcelType,
      status: 'In Pickup',
      barcode,
      createdBy: req.user?.id || null
    });

    // Update pickup status to Picked
    await Pickup.findByIdAndUpdate(pickupId, { 
      status: 'Picked',
      $push: {
        statusHistory: {
          status: 'Picked',
          note: 'Parcel created and picked up.',
          updatedBy: req.user?.id || null,
          timestamp: new Date()
        }
      }
    });

    return res.status(201).json({ 
      success: true, 
      data: { parcel } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Update parcel status
const updateParcelStatus = async (req, res) => {
  try {
    const { status, location, note } = req.body;
    const parcelId = req.params.id;

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required.' 
      });
    }

    const parcel = await Parcel.findByIdAndUpdate(
      parcelId,
      {
        status,
        currentLocation: location,
        $push: {
          statusHistory: {
            status,
            location,
            note: note || 'Status updated.',
            updatedBy: req.user?.id || null,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate('customer', 'name phone');

    if (!parcel) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parcel not found.' 
      });
    }

    // Create tracking log entry
    await TrackingLog.create({
      parcelId: parcel._id,
      status,
      location: location || 'Unknown',
      note: note || 'Status updated.',
      updatedBy: req.user?.id || null
    });

    return res.json({ 
      success: true, 
      data: { parcel } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get parcels by status
const getParcelsByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const parcels = await Parcel.find(filter)
      .populate('customer', 'name phone email')
      .populate('pickupId', 'scheduledDate pickupTime')
      .sort({ createdAt: -1 });

    return res.json({ 
      success: true, 
      data: { parcels } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  createParcelFromPickup,
  updateParcelStatus,
  getParcelsByStatus
};
