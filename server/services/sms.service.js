/**
 * SMS Service — Phase 11
 *
 * Provider:  Fast2SMS (India) — https://www.fast2sms.com
 * Fallback:  console.log when FAST2SMS_API_KEY is not set (dev mode)
 *
 * To enable real SMS:
 *   1. Sign up at fast2sms.com
 *   2. Get your API key from Dashboard → Dev API
 *   3. Add to server/.env:  FAST2SMS_API_KEY=your_key_here
 */
const axios = require('axios');

const API_KEY  = process.env.FAST2SMS_API_KEY;
const DEV_MODE = !API_KEY;

// ── Core send ─────────────────────────────────────────────────────────────────
const send = async (phone, message) => {
  if (!phone) return;

  // Strip country code if present (Fast2SMS wants 10-digit Indian numbers)
  const cleaned = String(phone).replace(/^\+?91/, '').replace(/\D/g, '').slice(-10);
  if (cleaned.length !== 10) {
    console.warn(`[SMS] Invalid phone number: ${phone}`);
    return;
  }

  if (DEV_MODE) {
    console.log(`\n[SMS DEV] ─────────────────────────────`);
    console.log(`  To:  +91${cleaned}`);
    console.log(`  Msg: ${message}`);
    console.log(`────────────────────────────────────────\n`);
    return;
  }

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        authorization: API_KEY,  // Fast2SMS expects auth in body
        route:         'v3',     // v3 = Quick SMS, no DLT registration needed
        message,
        language:      'english',
        flash:         0,
        numbers:       cleaned,
      },
      {
        headers: { authorization: API_KEY },
        timeout: 8000,
      }
    );

    if (response.data?.return === true) {
      console.log(`[SMS] Sent to +91${cleaned} ✓`);
    } else {
      // Fast2SMS returns 200 but return:false on soft failures (invalid number, quota, etc.)
      console.error(`[SMS] Fast2SMS rejected message to ${cleaned}:`, JSON.stringify(response.data));
    }
  } catch (err) {
    // Never throw — SMS failure must not break the main API response
    console.error(`[SMS] Error sending to ${cleaned}:`, err.response?.data || err.message);
  }
};

// ── Trigger 1: Pickup Scheduled ───────────────────────────────────────────────
// Called in: pickup.controller.js → createPickup (after populate)
const sendPickupScheduled = async (pickup) => {
  const phone = pickup?.customer?.phone;
  if (!phone) return;

  const date = pickup.scheduledDate
    ? new Date(pickup.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'the scheduled date';

  const time = pickup.pickupTime || '';
  const type = pickup.deliveryType ? ` (${pickup.deliveryType})` : '';

  await send(
    phone,
    `BobbaExpress: Hi ${pickup.customer.name || 'Customer'}, your pickup is scheduled for ${date}${time ? ' at ' + time : ''}${type}. Our agent will be assigned shortly. -BobbaExpress Logistics`
  );
};

// ── Trigger 2: Pickup Completed (Parcel Picked Up) ────────────────────────────
// Called in: pickup.controller.js → updatePickupStatus (when status === 'Picked')
const sendPickupCompleted = async (pickup) => {
  const phone = pickup?.customer?.phone;
  if (!phone) return;

  await send(
    phone,
    `BobbaExpress: Hi ${pickup.customer?.name || 'Customer'}, your parcel has been picked up by our agent. Track your shipment on our platform. -BobbaExpress Logistics`
  );
};

// ── Trigger 3: Shipment Dispatched ───────────────────────────────────────────
// Called in: shipment.controller.js → dispatchShipment
// parcelsWithCustomers = array of { trackingId, customer: { name, phone } }
const sendShipmentDispatched = async (shipment, parcelsWithCustomers = []) => {
  if (!parcelsWithCustomers.length) {
    console.log(`[SMS] Shipment ${shipment.shipmentId} dispatched — no customer data available for SMS.`);
    return;
  }

  const dest = shipment.destinationHub || 'the destination';
  const eta  = shipment.estimatedDelivery
    ? new Date(shipment.estimatedDelivery).toLocaleDateString('en-IN')
    : null;

  // Send one SMS per unique customer phone
  const seen = new Set();
  for (const parcel of parcelsWithCustomers) {
    const phone = parcel.customer?.phone;
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);

    const name       = parcel.customer?.name || 'Customer';
    const trackingId = parcel.trackingId || '';

    await send(
      phone,
      `BobbaExpress: Hi ${name}, your parcel${trackingId ? ` (${trackingId})` : ''} has been dispatched to ${dest}${eta ? ' and will arrive by ' + eta : ''}. Track at our platform. -BobbaExpress Logistics`
    );
  }
};

// ── Trigger 4: Parcel Delivered (bonus) ──────────────────────────────────────
// Optional — call from parcel.controller when status === 'Delivered'
const sendParcelDelivered = async (parcel) => {
  const phone = parcel?.customer?.phone;
  if (!phone) return;

  await send(
    phone,
    `BobbaExpress: Hi ${parcel.customer?.name || 'Customer'}, your parcel${parcel.trackingId ? ` (${parcel.trackingId})` : ''} has been delivered successfully. Thank you for choosing BobbaExpress! -BobbaExpress Logistics`
  );
};

module.exports = {
  send,
  sendPickupScheduled,
  sendPickupCompleted,
  sendShipmentDispatched,
  sendParcelDelivered,
};
