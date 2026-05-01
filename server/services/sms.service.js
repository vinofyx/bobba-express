/**
 * SMS Service — Fast2SMS (India)
 * Docs: https://docs.fast2sms.com
 *
 * Setup:
 *   1. Sign up at fast2sms.com
 *   2. Get your API key: Dashboard → Dev API → API Key
 *   3. Add to server/.env:  FAST2SMS_API_KEY=<your_real_key>
 *
 * Dev mode (no key set or placeholder left):
 *   SMS is printed to console so you can verify the content without sending.
 */
const axios = require('axios');

// ── Core send ─────────────────────────────────────────────────────────────────
const send = async (phone, message) => {
  if (!phone || !message) return;

  const API_KEY = process.env.FAST2SMS_API_KEY || '';

  // Treat missing or unset placeholder keys as dev mode
  const DEV_MODE = !API_KEY || API_KEY.startsWith('your-') || API_KEY.length < 10;

  // Strip country code, keep last 10 digits (Indian mobile format)
  const cleaned = String(phone).replace(/^\+?91/, '').replace(/\D/g, '').slice(-10);
  if (cleaned.length !== 10) {
    console.warn(`[SMS] Skipped — invalid phone number: ${phone}`);
    return;
  }

  if (DEV_MODE) {
    console.log(`\n[SMS ⚠ DEV MODE — add a real FAST2SMS_API_KEY to .env to send real SMS]`);
    console.log(`  To : +91${cleaned}`);
    console.log(`  Msg: ${message}\n`);
    return;
  }

  try {
    console.log(`[SMS] Sending to +91${cleaned}…`);

    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      // authorization goes in HEADERS only — putting it in the body too causes rejection
      {
        route:    'q',       // Quick SMS — no DLT template registration needed
        message:  message.slice(0, 459), // Fast2SMS max per segment × 3
        language: 'english',
        flash:    0,
        numbers:  cleaned,
      },
      {
        headers: {
          authorization: API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      }
    );

    if (response.data?.return === true) {
      console.log(`[SMS] ✓ Sent to +91${cleaned}`);
    } else {
      console.error(`[SMS] ✗ Fast2SMS rejected +91${cleaned}:`, JSON.stringify(response.data));
    }
  } catch (err) {
    const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.error(`[SMS] ✗ Error for +91${cleaned}: ${detail}`);
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

// ── Trigger 1: Pickup Scheduled (→ customer) ─────────────────────────────────
const sendPickupScheduled = async (pickup) => {
  const phone = pickup?.customer?.phone;
  if (!phone) return;

  const name = pickup.customer?.name || 'Customer';
  const date = fmtDate(pickup.scheduledDate) || 'the scheduled date';
  const time = pickup.pickupTime ? ` at ${pickup.pickupTime}` : '';
  const type = pickup.deliveryType ? ` (${pickup.deliveryType})` : '';

  await send(
    phone,
    `BobbaExpress: Hi ${name}, your pickup is scheduled for ${date}${time}${type}. Our agent will be assigned shortly. -BobbaExpress`
  );
};

// ── Trigger 2: Agent Assigned (→ agent) ──────────────────────────────────────
const sendPickupAssigned = async (pickup) => {
  const phone = pickup?.assignedAgent?.phone;
  if (!phone) return;

  const agentName    = pickup.assignedAgent?.name || 'Agent';
  const customerName = pickup.customer?.name      || 'Customer';
  const date         = fmtDate(pickup.scheduledDate) || 'the scheduled date';
  const time         = pickup.pickupTime ? ` at ${pickup.pickupTime}` : '';

  const addr = pickup.pickupAddress
    ? [pickup.pickupAddress.line1, pickup.pickupAddress.city].filter(Boolean).join(', ')
    : 'the pickup address';

  await send(
    phone,
    `BobbaExpress: Hi ${agentName}, new pickup assigned! Customer: ${customerName}, Address: ${addr}, Date: ${date}${time}. Please confirm. -BobbaExpress`
  );
};

// ── Trigger 3: Driver Assigned (→ customer) ───────────────────────────────────
const sendDriverAssigned = async (pickup) => {
  const phone = pickup?.customer?.phone;
  if (!phone) return;

  const name      = pickup.customer?.name      || 'Customer';
  const agentName = pickup.assignedAgent?.name || 'our agent';
  const date      = fmtDate(pickup.scheduledDate) || 'the scheduled date';
  const time      = pickup.pickupTime ? ` at ${pickup.pickupTime}` : '';

  await send(
    phone,
    `BobbaExpress: Hi ${name}, driver ${agentName} has been assigned for your pickup on ${date}${time}. Please keep your items ready. -BobbaExpress`
  );
};

// ── Trigger 4: Pickup Completed (→ agent) ────────────────────────────────────
const sendPickupCompleted = async (pickup) => {
  const phone = pickup?.assignedAgent?.phone || pickup?.customer?.phone;
  if (!phone) return;

  const name  = pickup.customer?.name || 'Customer';
  const count = pickup.completionProof?.actualCount ?? pickup.parcelCount ?? 1;

  await send(
    phone,
    `BobbaExpress: Pickup ${pickup.pickupId} completed. ${count} parcel(s) collected from ${name}. Items are now at the warehouse. -BobbaExpress`
  );
};

// ── Trigger 5: Pickup Completed (→ customer) ──────────────────────────────────
const sendPickupCompletedCustomer = async (pickup) => {
  const phone = pickup?.customer?.phone;
  if (!phone) return;

  const name      = pickup.customer?.name      || 'Customer';
  const agentName = pickup.assignedAgent?.name || 'our agent';
  const count     = pickup.completionProof?.actualCount ?? pickup.parcelCount ?? 1;

  await send(
    phone,
    `BobbaExpress: Hi ${name}, your pickup (${pickup.pickupId}) is complete! ${agentName} collected ${count} parcel(s). Your items are on their way to the warehouse. -BobbaExpress`
  );
};

// ── Trigger 6: Shipment Dispatched (→ driver/internal) ───────────────────────
// parcelsWithCustomers is an optional array; shipment alone is enough for driver notify
const sendShipmentDispatched = async (shipment, parcelsWithCustomers = []) => {
  const origin = shipment.originHub || shipment.route?.origin?.city || '';
  const dest   = shipment.destinationHub || shipment.route?.destination?.city || 'destination';

  // Notify each unique customer
  const seen = new Set();
  for (const parcel of parcelsWithCustomers) {
    const phone = parcel?.customer?.phone;
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);

    const name = parcel.customer?.name || 'Customer';
    await send(
      phone,
      `BobbaExpress: Hi ${name}, your parcel${parcel.trackingId ? ` (${parcel.trackingId})` : ''} has been dispatched${origin ? ` from ${origin}` : ''} to ${dest}. We will notify you on delivery. -BobbaExpress`
    );
  }
};

// ── Trigger 7: Shipment Created (→ customer per parcel) ──────────────────────
const sendShipmentDispatchedCustomer = async (parcel, shipment) => {
  const phone = parcel?.customer?.phone;
  if (!phone) return;

  const name   = parcel.customer?.name || 'Customer';
  const origin = shipment.originHub || shipment.route?.origin?.city || '';
  const dest   = shipment.destinationHub || shipment.route?.destination?.city || 'destination';

  await send(
    phone,
    `BobbaExpress: Hi ${name}, your parcel ${parcel.trackingId} is in transit${origin ? ` from ${origin}` : ''} to ${dest}. Shipment ID: ${shipment.shipmentId}. -BobbaExpress`
  );
};

// ── Trigger 8: Parcel Delivered (→ customer) ──────────────────────────────────
const sendParcelDelivered = async (parcel) => {
  const phone = parcel?.customer?.phone;
  if (!phone) return;

  const name = parcel.customer?.name || 'Customer';

  await send(
    phone,
    `BobbaExpress: Hi ${name}, your parcel${parcel.trackingId ? ` (${parcel.trackingId})` : ''} has been delivered successfully. Thank you for choosing BobbaExpress! -BobbaExpress`
  );
};

module.exports = {
  send,
  sendPickupScheduled,
  sendPickupAssigned,
  sendPickupCompleted,
  sendDriverAssigned,
  sendPickupCompletedCustomer,
  sendShipmentDispatched,
  sendShipmentDispatchedCustomer,
  sendParcelDelivered,
};
