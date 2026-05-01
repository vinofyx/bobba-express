const { v4: uuidv4 } = require('uuid');
const Parcel      = require('../models/parcel.model');
const Pickup      = require('../models/pickup.model');
const TrackingLog = require('../models/tracking.model');
const sms         = require('../services/sms.service');

// POST /api/parcels   (Phase 7)
const createParcel = async (req, res) => {
  try {
    const { 
      pickupId, 
      weight, 
      dimensions, 
      quantity, 
      codAmount, 
      type,
      receiver,
      trackingId: customTrackingId 
    } = req.body;
    
    // Validation
    if (!pickupId || !weight)
      return res.status(400).json({ success: false, message: 'pickupId and weight are required.' });

    if (!weight || weight <= 0)
      return res.status(400).json({ success: false, message: 'Weight must be greater than 0.' });

    if (receiver && (!receiver.name || !receiver.address.line1 || !receiver.address.city || !receiver.address.state || !receiver.address.pincode)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Receiver information is incomplete. Name and complete address are required.' 
      });
    }

    const pickup = await Pickup.findById(pickupId).populate('customer');
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found.' });

    // Generate unique tracking ID
    let trackingId = customTrackingId;
    let attempts = 0;
    const maxAttempts = 10;
    
    if (!trackingId) {
      do {
        trackingId = 'BE' + Date.now().toString(36).toUpperCase() + 
                     Math.random().toString(36).slice(2, 5).toUpperCase();
        attempts++;
        
        if (attempts > maxAttempts) {
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to generate unique tracking ID after multiple attempts.' 
          });
        }
      } while (await Parcel.findOne({ trackingId }));
    } else {
      // Check if custom tracking ID already exists
      const existingParcel = await Parcel.findOne({ trackingId });
      if (existingParcel) {
        // Regenerate tracking ID
        do {
          trackingId = 'BE' + Date.now().toString(36).toUpperCase() + 
                       Math.random().toString(36).slice(2, 5).toUpperCase();
          attempts++;
          
          if (attempts > maxAttempts) {
            return res.status(500).json({ 
              success: false, 
              message: 'Failed to generate unique tracking ID after multiple attempts.' 
            });
          }
        } while (await Parcel.findOne({ trackingId }));
      }
    }

    const parcel = new Parcel({
      trackingId,
      pickupId: pickup._id,
      customer: pickup.customer._id,
      weight,
      dimensions,
      quantity:  quantity  || 1,
      codAmount: codAmount || 0,
      type:      type      || pickup.parcelType,
      barcode:   uuidv4(),        // UUID barcode (Phase 7)
      status: 'At Center',
      assignedAgent: pickup.assignedAgent,
      statusHistory: [{
        status: 'At Center',
        location: 'BobbaExpress Warehouse',
        note: 'Parcel created manually.',
        updatedBy: req.user?._id,
        timestamp: new Date(),
      }],
      currentLocation: 'BobbaExpress Warehouse',
      createdBy: req.user?._id,
      
      // Populate sender information from customer
      sender: {
        name: pickup.customer.name,
        phone: pickup.customer.phone,
        address: pickup.customer.address
      },
      
      // Receiver — optional at creation; can be filled in before dispatch
      receiver: receiver || {}
    });

    await parcel.save();

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

// PUT /api/parcels/:id   (Update parcel details)
const updateParcel = async (req, res) => {
  try {
    const { 
      weight, 
      dimensions, 
      type, 
      codAmount, 
      receiver,
      allowIncompleteReceiver 
    } = req.body;
    
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ success: false, message: 'Parcel not found.' });

    // Validation for weight
    if (weight !== undefined) {
      if (!weight || weight <= 0) {
        return res.status(400).json({ success: false, message: 'Weight must be greater than 0.' });
      }
      
      // Check if parcel can move to shipment without weight
      if (parcel.status === 'At Center' && !weight) {
        return res.status(400).json({ 
          success: false, 
          message: 'Weight is required before parcel can be moved to shipment.' 
        });
      }
    }

    // Validation for receiver address
    if (receiver) {
      const isComplete = receiver.name && 
                        receiver.address.line1 && 
                        receiver.address.city && 
                        receiver.address.state && 
                        receiver.address.pincode;
      
      if (!isComplete && !allowIncompleteReceiver) {
        return res.status(400).json({ 
          success: false, 
          message: 'Receiver address is incomplete. Please provide complete receiver information before proceeding.',
          warning: true
        });
      }
    }

    // Update parcel
    const updateData = {};
    if (weight !== undefined) updateData.weight = weight;
    if (dimensions) updateData.dimensions = dimensions;
    if (type) updateData.type = type;
    if (codAmount !== undefined) updateData.codAmount = codAmount;
    if (receiver) updateData.receiver = receiver;

    const updatedParcel = await Parcel.findByIdAndUpdate(
      req.params.id,
      {
        ...updateData,
        $push: {
          statusHistory: {
            status: parcel.status,
            note: 'Parcel details updated.',
            updatedBy: req.user._id,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate('customer', 'name phone email')
     .populate('assignedAgent', 'name email')
     .populate('pickupId');

    return res.json({ 
      success: true, 
      message: 'Parcel updated successfully',
      data: { parcel: updatedParcel } 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/parcels/:id/label   (Generate shipping label)
const generateLabel = async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id)
      .populate('customer', 'name phone email address')
      .populate('pickupId');
    
    if (!parcel) return res.status(404).json({ success: false, message: 'Parcel not found.' });

    // In a real implementation, this would generate a PDF
    // For now, we'll return the label data
    const labelData = {
      trackingId: parcel.trackingId,
      barcode: parcel.barcode,
      sender: parcel.sender,
      receiver: parcel.receiver,
      weight: parcel.weight,
      dimensions: parcel.dimensions,
      type: parcel.type,
      createdAt: parcel.createdAt
    };

    return res.json({ 
      success: true, 
      message: 'Label data retrieved successfully',
      data: { label: labelData } 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  createParcel, 
  getParcels, 
  getParcelById, 
  updateParcel, 
  updateParcelStatus,
  generateLabel 
};
