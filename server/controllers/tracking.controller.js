const TrackingLog = require('../models/tracking.model');
const Parcel      = require('../models/parcel.model');

// GET /api/tracking/:trackingId   — public, used by customers (Phase 8 + Enhanced TC-008)
const getTracking = async (req, res) => {
  try {
    const { trackingId } = req.params;

    // Validate tracking ID
    if (!trackingId || trackingId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tracking ID is required.',
        usage: 'GET /api/tracking/BE-XXXXXX'
      });
    }

    // Detect placeholder / example values used literally
    const looksLikePlaceholder = /^:|\{|\}|trackingId|tracking_id|<|>/i.test(trackingId.trim());
    if (looksLikePlaceholder) {
      return res.status(400).json({
        success: false,
        message: 'That looks like a placeholder, not a real tracking ID.',
        example: 'GET /api/tracking/BE-123456',
        tip: 'Replace :trackingId with an actual tracking number like BE-ABC123',
      });
    }

    // Normalize tracking ID (handle BE format)
    const normalizedTrackingId = trackingId.trim().toUpperCase();

    const parcel = await Parcel.findOne({ trackingId: normalizedTrackingId })
      .populate('customer', 'name phone email')
      .populate('sender', 'name phone')
      .populate('receiver', 'name phone address')
      .populate('pickupId', 'pickupId scheduledDate pickupTime')
      .populate('statusHistory', 'status timestamp location note updatedBy');
    
    if (!parcel) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parcel not found' 
      });
    }

    // Get tracking logs
    const logs = await TrackingLog.find({ parcelId: parcel._id })
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('updatedBy', 'name role');

    // Build timeline with status indicators
    const timeline = buildTrackingTimeline(parcel, logs);
    
    // Calculate ETA if applicable
    const eta = calculateETA(parcel, logs);
    
    // Generate shareable link
    const shareLink = `${req.protocol}://${req.get('host')}/tracking?id=${normalizedTrackingId}`;
    
    // Generate download link for PDF
    const downloadLink = `${req.protocol}://${req.get('host')}/api/tracking/${normalizedTrackingId}/download`;
    
    // Mask sensitive information
    const maskedParcel = maskSensitiveInfo(parcel);
    
    return res.json({ 
      success: true, 
      data: { 
        parcel: maskedParcel,
        timeline,
        logs: logs.map(log => ({
          ...log.toObject(),
          timestamp: log.timestamp
        })),
        eta,
        shareLink,
        downloadLink
      }
    });
  } catch (err) {
    console.error('❌ Tracking error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Helper function to build tracking timeline
const buildTrackingTimeline = (parcel, logs) => {
  const statusSteps = [
    { status: 'Picked Up', icon: '📦', color: 'green', completed: false },
    { status: 'At Center', icon: '🏢', color: 'green', completed: false },
    { status: 'In Transit', icon: '🚚', color: 'blue', completed: false },
    { status: 'Out for Delivery', icon: '🚴', color: 'orange', completed: false },
    { status: 'Delivered', icon: '✅', color: 'green', completed: false }
  ];

  const timeline = [];
  const completedStatuses = new Set();
  
  // Add completed steps from status history
  parcel.statusHistory.forEach(history => {
    if (!completedStatuses.has(history.status)) {
      const stepInfo = statusSteps.find(s => s.status === history.status);
      if (stepInfo) {
        timeline.push({
          ...stepInfo,
          completed: true,
          timestamp: history.timestamp,
          location: history.location,
          note: history.note,
          updatedBy: history.updatedBy
        });
        completedStatuses.add(history.status);
      }
    }
  });
  
  // Add remaining steps
  statusSteps.forEach(step => {
    if (!completedStatuses.has(step.status)) {
      timeline.push({
        ...step,
        completed: false,
        timestamp: null,
        location: null,
        note: null
      });
    }
  });
  
  // Add tracking logs for additional details
  logs.forEach(log => {
    const existingStep = timeline.find(step => step.status === log.status);
    if (existingStep) {
      existingStep.timestamp = log.timestamp;
      existingStep.location = log.location;
      existingStep.note = log.note;
      existingStep.updatedBy = log.updatedBy;
    }
  });
  
  return timeline;
};

// Helper function to calculate ETA
const calculateETA = (parcel, logs) => {
  if (parcel.status === 'Delivered') {
    return null;
  }
  
  // Find the most recent "In Transit" log
  const inTransitLog = logs.find(log => log.status === 'In Transit');
  if (!inTransitLog) {
    return null;
  }
  
  // Simple ETA calculation (in production, use more sophisticated logic)
  const now = new Date();
  const hoursSinceTransit = (now - inTransitLog.timestamp) / (1000 * 60 * 60);
  
  // Estimate remaining time based on typical delivery patterns
  const estimatedTotalHours = 24; // 1 day typical
  const remainingHours = Math.max(0, estimatedTotalHours - hoursSinceTransit);
  
  const eta = new Date(now.getTime() + (remainingHours * 60 * 60 * 1000));
  
  return {
    estimatedArrival: eta,
    message: `Estimated delivery: ${eta.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`,
    progress: Math.min(100, (hoursSinceTransit / estimatedTotalHours) * 100)
  };
};

// Helper function to mask sensitive information
const maskSensitiveInfo = (parcel) => {
  const masked = parcel.toObject();
  
  // Mask phone numbers
  if (masked.customer?.phone) {
    masked.customer.phone = masked.customer.phone.slice(0, -4) + 'XXXX';
  }
  
  if (masked.sender?.phone) {
    masked.sender.phone = masked.sender.phone.slice(0, -4) + 'XXXX';
  }
  
  if (masked.receiver?.phone) {
    masked.receiver.phone = masked.receiver.phone.slice(0, -4) + 'XXXX';
  }
  
  // Mask address (show only city and state)
  if (masked.receiver?.address) {
    const { city, state } = masked.receiver.address;
    masked.receiver.address = {
      ...masked.receiver.address,
      line1: 'XXXX',
      line2: `${city}, ${state}`,
      city,
      state
    };
  }
  
  if (masked.sender?.address) {
    const { city, state } = masked.sender.address;
    masked.sender.address = {
      ...masked.sender.address,
      line1: 'XXXX',
      line2: `${city}, ${state}`,
      city,
      state
    };
  }
  
  return masked;
};

// GET /api/tracking/:trackingId/download   — Download tracking PDF
const downloadTrackingPDF = async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    if (!trackingId || trackingId.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tracking ID is required.', usage: 'GET /api/tracking/BE-XXXXXX/download' });
    }

    const looksLikePlaceholder = /^:|\{|\}|trackingId|tracking_id|<|>/i.test(trackingId.trim());
    if (looksLikePlaceholder) {
      return res.status(400).json({
        success: false,
        message: 'That looks like a placeholder, not a real tracking ID.',
        example: 'GET /api/tracking/BE-123456/download',
        tip: 'Replace :trackingId with an actual tracking number like BE-ABC123',
      });
    }

    const normalizedTrackingId = trackingId.trim().toUpperCase();

    const parcel = await Parcel.findOne({ trackingId: normalizedTrackingId })
      .populate('customer', 'name phone email')
      .populate('sender', 'name phone')
      .populate('receiver', 'name phone address')
      .populate('statusHistory', 'status timestamp location note updatedBy');
    
    if (!parcel) {
      return res.status(404).json({ success: false, message: 'Parcel not found' });
    }

    // Get tracking logs
    const logs = await TrackingLog.find({ parcelId: parcel._id })
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('updatedBy', 'name role');

    // Build timeline
    const timeline = buildTrackingTimeline(parcel, logs);
    
    // Calculate ETA
    const eta = calculateETA(parcel, logs);
    
    // Generate PDF data (simplified - in production, use a PDF library)
    const pdfData = {
      trackingId: parcel.trackingId,
      barcode: parcel.barcode,
      status: parcel.status,
      currentLocation: parcel.currentLocation,
      timeline,
      eta,
      parcel: {
        weight: parcel.weight,
        dimensions: parcel.dimensions,
        type: parcel.type
      },
      sender: parcel.sender,
      receiver: parcel.receiver,
      customer: parcel.customer,
      createdAt: parcel.createdAt
    };

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="tracking-${normalizedTrackingId}.json"`);
    
    return res.json({ success: true, data: { pdfData } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tracking/:trackingId/subscribe   — Subscribe to tracking updates
const subscribeToTracking = async (req, res) => {
  try {
    const { trackingId, email } = req.body;
    
    if (!trackingId || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tracking ID and email are required for subscription.' 
      });
    }

    const normalizedTrackingId = trackingId.trim().toUpperCase();
    
    // Validate parcel exists
    const parcel = await Parcel.findOne({ trackingId: normalizedTrackingId });
    if (!parcel) {
      return res.status(404).json({ success: false, message: 'Parcel not found' });
    }

    // Validate email format
    const emailRegex = /^[^\s*[^@\s]+@[^@\s]+\.[^@\s]+\s*$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address.' 
      });
    }

    // In production, save subscription to database
    // For now, just return success
    const subscriptionData = {
      trackingId: normalizedTrackingId,
      email,
      parcelId: parcel._id,
      status: 'active',
      createdAt: new Date()
    };

    console.log(`📧 Subscription created for ${normalizedTrackingId} - ${email}`);

    return res.json({ 
      success: true, 
      message: 'Successfully subscribed to tracking updates',
      data: { subscription: subscriptionData }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tracking   — staff/admin adds manual tracking event (Phase 8)
const addTrackingEvent = async (req, res) => {
  try {
    const { parcelId, status, location, note, gps } = req.body;
    if (!parcelId || !status || !location)
      return res.status(400).json({ success: false, message: 'parcelId, status and location are required.' });

    const logData = { parcelId, status, location, note: note || '', updatedBy: req.user?._id };
    if (gps?.lat && gps?.lng) logData.gps = gps;

    const log = await TrackingLog.create(logData);

    // Sync parcel status
    const parcelUpdate = { status, currentLocation: location, $push: { statusHistory: { status, location, note: note || '', updatedBy: req.user?._id, timestamp: new Date() } } };
    if (gps?.lat && gps?.lng) parcelUpdate.$push.statusHistory.gps = gps;
    await Parcel.findByIdAndUpdate(parcelId, parcelUpdate);

    return res.status(201).json({ success: true, data: { log } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  getTracking, 
  downloadTrackingPDF, 
  subscribeToTracking, 
  addTrackingEvent 
};
