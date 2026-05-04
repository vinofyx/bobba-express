/**
 * 📩 SMS Service — Fast2SMS (India)
 * Supports:
 * - Core SMS sending
 * - Tracking links
 * - OTP
 * - Pickup / Parcel / Shipment notifications
 */

const axios = require("axios");

// ─────────────────────────────────────────────
// 🔧 CORE SMS FUNCTION
// ─────────────────────────────────────────────
const sendSMS = async (phone, message) => {
  if (!phone || !message) {
    console.warn("[SMS] Missing phone or message");
    return { success: false };
  }

  const API_KEY = process.env.FAST2SMS_API_KEY || "";

  const DEV_MODE =
    !API_KEY || API_KEY.startsWith("your-") || API_KEY.length < 10;

  const cleaned = String(phone)
    .replace(/^\+?91/, "")
    .replace(/\D/g, "")
    .slice(-10);

  if (cleaned.length !== 10) {
    console.warn("[SMS] Invalid phone:", phone);
    return { success: false };
  }

  // 🟡 DEV MODE
  if (DEV_MODE) {
    console.log("\n📩 [SMS DEV MODE]");
    console.log("To:", `+91${cleaned}`);
    console.log("Message:", message);
    console.log("--------------------------\n");
    return { success: true, mode: "DEV" };
  }

  // 🟢 LIVE MODE
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: message.slice(0, 459),
        language: "english",
        numbers: cleaned,
      },
      {
        headers: {
          authorization: API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    if (response.data?.return === true) {
      console.log(`[SMS] ✅ Sent to +91${cleaned}`);
      return { success: true };
    } else {
      console.error("[SMS] ❌ Failed:", response.data);
      return { success: false, error: response.data };
    }
  } catch (err) {
    console.error("[SMS] ❌ Error:", err.response?.data || err.message);
    return { success: false };
  }
};

// ─────────────────────────────────────────────
// 🔗 TRACKING LINK
// ─────────────────────────────────────────────
const getTrackingLink = (trackingId) => {
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  return `${base}/track/${trackingId}`;
};

// ─────────────────────────────────────────────
// 🔐 OTP FUNCTION
// ─────────────────────────────────────────────
const sendOTP = async (phone, otp) => {
  return await sendSMS(phone, `🔐 Your OTP is ${otp}. Valid for 5 minutes.`);
};

// ─────────────────────────────────────────────
// 📦 CUSTOMER
// ─────────────────────────────────────────────
const sendCustomerCreated = async (customer) => {
  await sendSMS(
    customer.phone,
    `Hi ${customer.name}, welcome to BobbaExpress 🚀`
  );
};

// ─────────────────────────────────────────────
// 🚚 PICKUP
// ─────────────────────────────────────────────
const sendPickupScheduled = async (pickup) => {
  await sendSMS(
    pickup?.customer?.phone,
    `📦 Pickup scheduled on ${new Date(
      pickup.scheduledDate
    ).toDateString()}`
  );
};

const sendPickupAssigned = async (pickup) => {
  await sendSMS(
    pickup?.assignedAgent?.phone,
    `🚚 Pickup assigned from ${pickup?.customer?.name}`
  );
};

const sendDriverAssigned = async (pickup) => {
  await sendSMS(
    pickup?.customer?.phone,
    `🚚 Driver assigned for your pickup`
  );
};

const sendPickupCompleted = async (pickup) => {
  await sendSMS(
    pickup?.assignedAgent?.phone,
    `✅ Pickup completed`
  );
};

const sendPickupCompletedCustomer = async (pickup) => {
  await sendSMS(
    pickup?.customer?.phone,
    `✅ Your pickup is completed`
  );
};

// ─────────────────────────────────────────────
// 📦 PARCEL
// ─────────────────────────────────────────────
const sendParcelCreated = async (parcel) => {
  const link = getTrackingLink(parcel.trackingId);

  await sendSMS(
    parcel?.customer?.phone,
    `📦 Parcel created. Track: ${link}`
  );
};

const sendParcelDelivered = async (parcel) => {
  const link = getTrackingLink(parcel.trackingId);

  await sendSMS(
    parcel?.customer?.phone,
    `✅ Parcel delivered. Track: ${link}`
  );
};

// ─────────────────────────────────────────────
// 🚛 SHIPMENT
// ─────────────────────────────────────────────
const sendShipmentDispatched = async (shipment) => {
  await sendSMS(
    shipment?.driver?.phone,
    `🚛 Shipment ${shipment.shipmentId} dispatched`
  );
};

const sendShipmentDispatchedCustomer = async (parcel) => {
  const link = getTrackingLink(parcel.trackingId);

  await sendSMS(
    parcel?.customer?.phone,
    `🚛 Your parcel is on the way. Track: ${link}`
  );
};

// ─────────────────────────────────────────────
// 📤 EXPORTS
// ─────────────────────────────────────────────
module.exports = {
  sendSMS,
  sendOTP,

  // Customer
  sendCustomerCreated,

  // Pickup
  sendPickupScheduled,
  sendPickupAssigned,
  sendDriverAssigned,
  sendPickupCompleted,
  sendPickupCompletedCustomer,

  // Parcel
  sendParcelCreated,
  sendParcelDelivered,

  // Shipment
  sendShipmentDispatched,
  sendShipmentDispatchedCustomer,
};