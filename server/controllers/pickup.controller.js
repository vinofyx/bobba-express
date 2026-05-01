const Pickup     = require('../models/pickup.model');
const TrackingLog = require('../models/tracking.model');
const sms        = require('../services/sms.service');

// POST /api/pickups
const createPickup = async (req, res) => {
  try {
    const { 
      customer, 
      pickupAddress, 
      scheduledDate, 
      pickupTime, 
      deliveryType, 
      parcelType, 
      notes,
      parcelCount 
    } = req.body;
    
    console.log('Pickup creation request:', req.body);
    
    // Generate pickup ID
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
      pickupTime: pickupTime,
      deliveryType: deliveryType || 'standard',
      parcelType:   parcelType   || 'parcel',
      parcelCount: parcelCount || 1,
      notes:        notes        || '',
      status: 'Requested',
      statusHistory: [{ 
        status: 'Requested', 
        note: parcelCount ? `Pickup request created for ${parcelCount} parcel(s).` : 'Pickup request created.', 
        updatedBy: req.user?._id,
        timestamp: new Date()
      }],
      createdBy: req.user?._id,
    });

    console.log('Pickup created successfully:', pickup.pickupId);

    // SMS: notify pickup scheduled (populate customer so phone/name are available)
    const populated = await Pickup.findById(pickup._id).populate('customer', 'name phone');
    await sms.sendPickupScheduled(populated);

    return res.status(201).json({ 
      success: true, 
      message: 'Pickup scheduled successfully',
      data: { pickup } 
    });
  } catch (err) {
    console.error('Pickup creation error:', err);
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

// PUT /api/pickups/:id/assign   (assign OR reassign agent)
const assignAgent = async (req, res) => {
  try {
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ success: false, message: 'agentId is required.' });

    const pickup = await Pickup.findById(req.params.id).populate('customer', 'name phone email');
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found.' });

    const User = require('../models/User');
    const agent = await User.findById(agentId);
    if (!agent || !agent.isActive)
      return res.status(404).json({ success: false, message: 'Agent not found or inactive.' });
    if (agent.role !== 'agent')
      return res.status(400).json({ success: false, message: 'Selected user is not an agent.' });

    const isReassign = !!pickup.assignedAgent;
    let previousAgentName = null;
    
    if (isReassign && pickup.assignedAgent) {
      previousAgentName = pickup.assignedAgent.name;
    }

    const updatedPickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      {
        assignedAgent: agentId,
        status: 'Assigned',
        $push: {
          statusHistory: {
            status: 'Assigned',
            note: isReassign ? `Reassigned to ${agent.name}` : `Assigned to ${agent.name}`,
            updatedBy: req.user?._id,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    ).populate('customer', 'name phone email')
     .populate('assignedAgent', 'name email phone');

    // SMS — non-blocking: don't let SMS failure break the assignment
    try { await sms.sendPickupAssigned(updatedPickup); }  catch (e) { console.warn('SMS sendPickupAssigned failed:', e.message); }
    try { await sms.sendDriverAssigned(updatedPickup); }  catch (e) { console.warn('SMS sendDriverAssigned failed:', e.message); }

    console.log(`✅ Pickup ${updatedPickup.pickupId} ${isReassign ? `reassigned from ${previousAgentName}` : 'assigned'} to ${agent.name}`);

    return res.json({
      success: true,
      message: isReassign ? 'Pickup reassigned successfully' : 'Pickup assigned successfully',
      data: { pickup: updatedPickup },
    });
  } catch (err) {
    console.error('❌ Agent assignment error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to assign agent.' });
  }
};

// PUT /api/pickups/:id/reassign   (Reassign to different agent)
const reassignAgent = async (req, res) => {
  try {
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ success: false, message: 'Agent is required.' });

    // Get the current pickup
    const pickup = await Pickup.findById(req.params.id).populate('customer', 'name phone email').populate('assignedAgent', 'name email phone');
    if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found.' });

    // Check if pickup is assigned
    if (!pickup.assignedAgent) {
      return res.status(400).json({ success: false, message: 'Pickup is not currently assigned to any agent.' });
    }

    // Store previous agent
    const previousAgentId = pickup.assignedAgent._id;
    const previousAgentName = pickup.assignedAgent.name;

    // Get new agent details
    const User = require('../models/User');
    const newAgent = await User.findById(agentId);
    if (!newAgent || !newAgent.isActive) {
      return res.status(404).json({ success: false, message: 'Agent not found or inactive.' });
    }

    if (newAgent.role !== 'agent') {
      return res.status(400).json({ success: false, message: 'Selected user is not an agent.' });
    }

    // Check if same agent is being assigned
    if (previousAgentId.toString() === agentId) {
      return res.status(400).json({ success: false, message: 'Pickup is already assigned to this agent.' });
    }

    // Check new agent availability
    const pickupDateTime = new Date(pickup.scheduledDate);
    const timeSlotStart = new Date(pickupDateTime);
    timeSlotStart.setHours(pickupDateTime.getHours() - 1);
    const timeSlotEnd = new Date(pickupDateTime);
    timeSlotEnd.setHours(pickupDateTime.getHours() + 1);

    const existingPickups = await Pickup.find({
      assignedAgent: agentId,
      status: { $in: ['Assigned', 'Requested'] },
      scheduledDate: { $gte: timeSlotStart, $lte: timeSlotEnd }
    });

    if (existingPickups.length >= 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Agent already has 5 pickups scheduled for this time slot.',
        warning: true
      });
    }

    // Update pickup with new agent
    const updatedPickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      {
        assignedAgent: agentId,
        $push: {
          statusHistory: {
            status: 'Assigned',
            note: `Reassigned from ${previousAgentName} to ${newAgent.name}`,
            updatedBy: req.user?._id,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    ).populate('customer', 'name phone email')
     .populate('assignedAgent', 'name email phone');

    // SMS — non-blocking
    try { await sms.sendPickupAssigned(updatedPickup); }  catch (e) { console.warn('SMS failed:', e.message); }
    try { await sms.sendDriverAssigned(updatedPickup); }  catch (e) { console.warn('SMS failed:', e.message); }

    console.log(`✅ Pickup ${updatedPickup.pickupId} reassigned from ${previousAgentName} to ${newAgent.name}`);

    return res.json({ 
      success: true, 
      message: 'Pickup reassigned successfully',
      data: { pickup: updatedPickup } 
    });
  } catch (err) {
    console.error('❌ Agent reassignment error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Helper function to auto-create parcels from pickup completion
const createParcelsFromPickup = async (pickup, userId) => {
  const Parcel = require('../models/parcel.model');
  const Customer = require('../models/customer.model');
  
  try {
    // Get customer details for sender information
    const customer = await Customer.findById(pickup.customer._id || pickup.customer);
    if (!customer) {
      console.error('❌ Customer not found for parcel creation');
      return [];
    }

    const actualCount = pickup.completionProof?.actualCount || pickup.parcelCount || 1;
    const createdParcels = [];

    for (let i = 0; i < actualCount; i++) {
      // Generate unique tracking ID
      let trackingId;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        trackingId = 'BE' + Date.now().toString(36).toUpperCase() + 
                     Math.random().toString(36).slice(2, 5).toUpperCase() + 
                     String(i + 1).padStart(3, '0');
        attempts++;
        
        if (attempts > maxAttempts) {
          throw new Error('Failed to generate unique tracking ID after multiple attempts');
        }
      } while (await Parcel.findOne({ trackingId }));

      // Create parcel with default values
      const parcel = new Parcel({
        trackingId,
        pickupId: pickup._id,
        customer: pickup.customer._id || pickup.customer,
        weight: 1.0, // Default weight, should be updated manually
        dimensions: {
          length: 10, // Default dimensions, should be updated manually
          width: 10,
          height: 10
        },
        type: pickup.parcelType || 'parcel',
        status: 'At Center',
        statusHistory: [{
          status: 'At Center',
          location: 'BobbaExpress Warehouse',
          note: `Auto-created from pickup ${pickup.pickupId}`,
          updatedBy: userId,
          timestamp: new Date()
        }],
        currentLocation: 'BobbaExpress Warehouse',
        createdBy: userId,
        
        // Populate sender information from customer
        sender: {
          name: customer.name,
          phone: customer.phone,
          address: customer.address
        },
        
        // Receiver is empty at creation — filled in before dispatch
        receiver: {}
      });

      await parcel.save();
      createdParcels.push(parcel);
    }

    return createdParcels;
  } catch (error) {
    console.error('❌ Error creating parcels from pickup:', error);
    throw error;
  }
};

// PUT /api/pickups/:id/complete   (Complete pickup with proof)
const completePickup = async (req, res) => {
  try {
    const { 
      photoUrl, 
      actualCount, 
      signatureUrl, 
      completionNotes, 
      location, 
      gps 
    } = req.body;
    
    // Get the pickup to be completed
    const pickup = await Pickup.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('assignedAgent', 'name email');
    
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup not found.' });
    }

    // Check if pickup is assigned
    if (!pickup.assignedAgent) {
      return res.status(400).json({ success: false, message: 'Pickup must be assigned to an agent before completion.' });
    }

    // Check if pickup is already completed
    if (pickup.status === 'Picked') {
      return res.status(400).json({ success: false, message: 'Pickup is already completed.' });
    }

    // Check if current user is the assigned agent
    if (!req.user || pickup.assignedAgent._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned agent can complete this pickup.' });
    }

    // Validate required fields
    if (!photoUrl) {
      return res.status(400).json({ success: false, message: 'Photo proof is required.' });
    }

    if (!actualCount || actualCount < 0) {
      return res.status(400).json({ success: false, message: 'Actual parcel count is required.' });
    }

    // Check for count mismatch
    if (actualCount !== pickup.parcelCount) {
      return res.status(400).json({ 
        success: false, 
        message: `Parcel count mismatch. Expected: ${pickup.parcelCount}, Actual: ${actualCount}. Please confirm.`,
        warning: true,
        expectedCount: pickup.parcelCount,
        actualCount: actualCount
      });
    }

    // Update pickup with completion proof
    const updatedPickup = await Pickup.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Picked',
        completionProof: {
          photoUrl,
          actualCount,
          signatureUrl: signatureUrl || null,
          completionNotes: completionNotes || '',
          completedAt: new Date(),
          completedBy: req.user._id,
          location: location || '',
          gps: gps || {}
        },
        $push: {
          statusHistory: {
            status: 'Picked',
            note: completionNotes || `Pickup completed with ${actualCount} parcel(s)`,
            location: location || '',
            updatedBy: req.user._id,
            timestamp: new Date(),
            gps: gps || {}
          },
        },
      },
      { new: true }
    ).populate('customer', 'name phone email')
     .populate('assignedAgent', 'name email');

    // SMS — non-blocking
    try { await sms.sendPickupCompleted(updatedPickup); }          catch (e) { console.warn('SMS failed:', e.message); }
    try { await sms.sendPickupCompletedCustomer(updatedPickup); }  catch (e) { console.warn('SMS failed:', e.message); }

    // Auto-create parcels based on pickup completion
    const createdParcels = await createParcelsFromPickup(updatedPickup, req.user._id);
    
    console.log(`✅ Pickup ${updatedPickup.pickupId} completed by agent ${req.user.name}`);
    console.log(`📦 Auto-created ${createdParcels.length} parcels`);

    return res.json({ 
      success: true, 
      message: 'Pickup completed successfully',
      data: { 
        pickup: updatedPickup,
        createdParcels: createdParcels
      } 
    });
  } catch (err) {
    console.error('❌ Pickup completion error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
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

    // SMS — non-blocking
    if (status === 'Picked') {
      try { await sms.sendPickupCompleted(pickup); } catch (e) { console.warn('SMS failed:', e.message); }
    }

    return res.json({ success: true, data: { pickup } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createPickup, getPickups, getPickupById, assignAgent, reassignAgent, completePickup, updatePickupStatus };
