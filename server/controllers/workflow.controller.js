const Pickup = require('../models/pickup.model');
const Parcel = require('../models/parcel.model');
const Shipment = require('../models/shipment.model');
const TrackingLog = require('../models/tracking.model');
const { nanoid } = require('nanoid');

/**
 * Complete Logistics Workflow
 * Customer → CREATE PICKUP → Agent Assignment → Parcel Creation → Tracking → Shipment → Delivery
 */

// 1. Customer creates pickup request
exports.createPickupRequest = async (req, res) => {
  try {
    const { customer, pickupAddress, scheduledDate, pickupTime, deliveryType, parcelType, notes } = req.body;

    const pickup = await Pickup.create({
      customer,
      pickupAddress,
      scheduledDate: new Date(scheduledDate),
      pickupTime: pickupTime || '09:00',
      deliveryType: deliveryType || 'standard',
      parcelType: parcelType || 'parcel',
      notes: notes || '',
      status: 'Requested',
      statusHistory: [{ status: 'Requested', note: 'Pickup request created by customer' }],
      createdBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      message: 'Pickup request created successfully',
      data: { pickup }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 2. Agent assigns pickup to themselves
exports.assignPickupAgent = async (req, res) => {
  try {
    const { pickupId } = req.params;
    const { agentId } = req.body;

    const pickup = await Pickup.findByIdAndUpdate(
      pickupId,
      {
        assignedAgent: agentId,
        status: 'Assigned',
        $push: {
          statusHistory: {
            status: 'Assigned',
            note: 'Agent assigned to pickup',
            updatedBy: agentId,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate('customer assignedAgent');

    res.json({
      success: true,
      message: 'Agent assigned successfully',
      data: { pickup }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 3. Agent picks up items - creates parcel(s)
exports.createParcelFromPickup = async (req, res) => {
  try {
    const { pickupId } = req.params;
    const { parcels } = req.body; // Array of parcel details

    const pickup = await Pickup.findById(pickupId);
    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    const createdParcels = [];
    
    for (const parcelData of parcels) {
      const trackingId = 'TRK' + nanoid(10).toUpperCase();
      const barcode = 'BC' + Date.now().toString(36).toUpperCase();
      
      const parcel = await Parcel.create({
        trackingId,
        barcode,
        pickupId: pickup._id,
        customer: pickup.customer,
        weight: parcelData.weight,
        dimensions: parcelData.dimensions,
        type: pickup.parcelType,
        quantity: parcelData.quantity || 1,
        codAmount: parcelData.codAmount || 0,
        status: 'In Pickup',
        statusHistory: [{
          status: 'In Pickup',
          location: pickup.pickupAddress.city,
          note: 'Parcel created during pickup',
          updatedBy: pickup.assignedAgent,
          timestamp: new Date()
        }],
        currentLocation: pickup.pickupAddress.city,
        createdBy: pickup.assignedAgent
      });

      createdParcels.push(parcel);
    }

    // Update pickup status
    await Pickup.findByIdAndUpdate(pickupId, {
      status: 'Picked',
      $push: {
        statusHistory: {
          status: 'Picked',
          note: `Created ${createdParcels.length} parcel(s)`,
          updatedBy: pickup.assignedAgent,
          timestamp: new Date()
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Parcels created successfully',
      data: { parcels: createdParcels }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 4. Parcel arrives at center - create tracking log
exports.arriveAtCenter = async (req, res) => {
  try {
    const { parcelId } = req.params;
    const { centerLocation, notes } = req.body;

    const parcel = await Parcel.findByIdAndUpdate(
      parcelId,
      {
        status: 'At Center',
        currentLocation: centerLocation,
        $push: {
          statusHistory: {
            status: 'At Center',
            location: centerLocation,
            note: notes || 'Arrived at center',
            updatedBy: req.user?.id,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    // Create tracking log entry
    const trackingLog = await TrackingLog.create({
      parcelId: parcel._id,
      status: 'At Center',
      location: centerLocation,
      note: notes || 'Arrived at sorting center',
      updatedBy: req.user?.id,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Parcel arrived at center',
      data: { parcel, trackingLog }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 5. Create shipment with parcels
exports.createShipment = async (req, res) => {
  try {
    const { parcelIds, vehicleNumber, driver, originHub, destinationHub } = req.body;

    const shipment = await Shipment.create({
      parcels: parcelIds,
      vehicleNumber,
      driver: {
        name: driver.name,
        phone: driver.phone
      },
      originHub,
      destinationHub,
      status: 'Created',
      statusHistory: [{
        status: 'Created',
        location: originHub,
        note: 'Shipment created',
        updatedBy: req.user?.id,
        timestamp: new Date()
      }],
      createdBy: req.user?.id
    });

    // Update parcel statuses to show they're in shipment
    await Parcel.updateMany(
      { _id: { $in: parcelIds } },
      {
        status: 'In Transit',
        $push: {
          statusHistory: {
            status: 'In Transit',
            location: originHub,
            note: 'Added to shipment ' + shipment.shipmentId,
            updatedBy: req.user?.id,
            timestamp: new Date()
          }
        }
      }
    );

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: { shipment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 6. Dispatch shipment
exports.dispatchShipment = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { notes } = req.body;

    const shipment = await Shipment.findByIdAndUpdate(
      shipmentId,
      {
        status: 'Dispatched',
        dispatchedAt: new Date(),
        $push: {
          statusHistory: {
            status: 'Dispatched',
            location: shipment.destinationHub,
            note: notes || 'Shipment dispatched to destination',
            updatedBy: req.user?.id,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate('parcels');

    // Create tracking logs for all parcels
    const trackingLogs = await Promise.all(
      shipment.parcels.map(parcel =>
        TrackingLog.create({
          parcelId: parcel._id,
          status: 'In Transit',
          location: `In Transit to ${shipment.destinationHub}`,
          note: `Shipment ${shipment.shipmentId} dispatched`,
          updatedBy: req.user?.id,
          timestamp: new Date()
        })
      )
    );

    res.json({
      success: true,
      message: 'Shipment dispatched successfully',
      data: { shipment, trackingLogs }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 7. Receive shipment at destination
exports.receiveShipment = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { notes } = req.body;

    const shipment = await Shipment.findByIdAndUpdate(
      shipmentId,
      {
        status: 'Received',
        receivedAt: new Date(),
        $push: {
          statusHistory: {
            status: 'Received',
            location: shipment.destinationHub,
            note: notes || 'Shipment received at destination',
            updatedBy: req.user?.id,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate('parcels');

    // Update parcel statuses
    await Parcel.updateMany(
      { _id: { $in: shipment.parcels } },
      {
        status: 'At Center',
        currentLocation: shipment.destinationHub,
        $push: {
          statusHistory: {
            status: 'At Center',
            location: shipment.destinationHub,
            note: 'Arrived at destination center',
            updatedBy: req.user?.id,
            timestamp: new Date()
          }
        }
      }
    );

    res.json({
      success: true,
      message: 'Shipment received successfully',
      data: { shipment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 8. Deliver parcel - final step
exports.deliverParcel = async (req, res) => {
  try {
    const { parcelId } = req.params;
    const { deliveryNotes, recipientName } = req.body;

    const parcel = await Parcel.findByIdAndUpdate(
      parcelId,
      {
        status: 'Delivered',
        currentLocation: 'Delivered',
        $push: {
          statusHistory: {
            status: 'Delivered',
            location: 'Delivered',
            note: `Delivered to ${recipientName}. ${deliveryNotes || ''}`,
            updatedBy: req.user?.id,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    // Create final tracking log entry
    const trackingLog = await TrackingLog.create({
      parcelId: parcel._id,
      status: 'Delivered',
      location: 'Delivered',
      note: `Parcel delivered to ${recipientName}. ${deliveryNotes || ''}`,
      updatedBy: req.user?.id,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Parcel delivered successfully',
      data: { parcel, trackingLog }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get complete workflow status for a pickup
exports.getWorkflowStatus = async (req, res) => {
  try {
    const { pickupId } = req.params;

    const pickup = await Pickup.findById(pickupId)
      .populate('customer')
      .populate('assignedAgent');

    const parcels = await Parcel.find({ pickupId })
      .populate('customer');

    const trackingLogs = await TrackingLog.find({
      parcelId: { $in: parcels.map(p => p._id) }
    }).sort({ timestamp: -1 });

    const shipments = await Shipment.find({
      parcels: { $in: parcels.map(p => p._id) }
    }).populate('parcels');

    res.json({
      success: true,
      data: {
        pickup,
        parcels,
        trackingLogs,
        shipments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
