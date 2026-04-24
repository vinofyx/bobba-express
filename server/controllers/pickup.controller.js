const Pickup = require('../models/pickup.model');

// Create a new pickup
const createPickup = async (req, res) => {
  try {
    const { customer, pickupAddress, scheduledDate, pickupTime, 
            deliveryType, parcelType, notes, assignedAgent } = req.body;

    // Validate required fields
    if (!customer || !scheduledDate || !pickupAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'customer, scheduledDate, and pickupAddress are required.' 
      });
    }

    // Create pickup with new fields
    const pickup = await Pickup.create({
      customer,
      pickupAddress,         // ← was "address"
      scheduledDate: new Date(scheduledDate),  // ← was "pickupDate"
      pickupTime: pickupTime || '09:00',
      deliveryType: deliveryType || 'standard',
      parcelType: parcelType || 'parcel',
      assignedAgent: assignedAgent || null,
      notes: notes || '',
      status: 'Requested',
      statusHistory: [{ status: 'Requested', note: 'Pickup created.' }],
    });

    return res.status(201).json({ 
      success: true, 
      data: { pickup } 
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get all pickups
const getPickups = async (req, res) => {
  try {
    const pickups = await Pickup.find()
      .populate('customer', 'name phone email')
      .populate('assignedAgent', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ 
      success: true, 
      data: { pickups } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get pickup by ID
const getPickupById = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('customer', 'name phone email companyName')
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name email');

    if (!pickup) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pickup not found.' 
      });
    }

    return res.json({ 
      success: true, 
      data: { pickup } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Update pickup status
const updatePickupStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const pickupId = req.params.id;

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required.' 
      });
    }

    const pickup = await Pickup.findByIdAndUpdate(
      pickupId,
      { 
        status,
        $push: {
          statusHistory: {
            status,
            note: note || '',
            updatedBy: req.user?.id,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate('customer', 'name phone email')
     .populate('assignedAgent', 'name email');

    if (!pickup) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pickup not found.' 
      });
    }

    return res.json({ 
      success: true, 
      data: { pickup } 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  createPickup,
  getPickups,
  getPickupById,
  updatePickupStatus
};
