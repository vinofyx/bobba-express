const Customer    = require('../models/customer.model');
const Pickup      = require('../models/pickup.model');
const Parcel      = require('../models/parcel.model');
const Shipment    = require('../models/shipment.model');
const TrackingLog = require('../models/tracking.model');

// GET /api/dashboard/stats   (Phase 4)
const getStats = async (req, res) => {
  try {
    const [
      totalCustomers,
      totalPickups,
      activeShipments,
      deliveredParcels,
      pendingPickups,
      pickedPickups,
      inTransitParcels,
      atCenterParcels,
      recentPickups,
      pickupStatusCounts,
      parcelStatusCounts,
    ] = await Promise.all([
      Customer.countDocuments({ isActive: true }),
      Pickup.countDocuments(),
      Shipment.countDocuments({ status: { $in: ['Dispatched', 'In Transit'] } }),
      Parcel.countDocuments({ status: 'Delivered' }),
      Pickup.countDocuments({ status: 'Requested' }),
      Pickup.countDocuments({ status: 'Picked' }),
      Parcel.countDocuments({ status: 'In Transit' }),
      Parcel.countDocuments({ status: 'At Center' }),
      Pickup.find().sort({ createdAt: -1 }).limit(8)
        .populate('customer', 'name phone')
        .populate('assignedAgent', 'name'),
      Pickup.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Parcel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    return res.json({
      success: true,
      data: {
        stats: {
          totalCustomers,
          totalPickups,
          activeShipments,
          deliveredParcels,
          pendingPickups,
          pickedPickups,
          inTransitParcels,
          atCenterParcels,
        },
        charts: {
          pickupByStatus: pickupStatusCounts,
          parcelByStatus: parcelStatusCounts,
        },
        recentPickups,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStats };
