const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const connectDB    = require("./config/db");

// Routes
const authRoutes      = require("./routes/auth.routes");
const userRoutes      = require("./routes/user.routes");
const customerRoutes  = require("./routes/customer.routes");
const pickupRoutes    = require("./routes/pickup.routes");
const parcelRoutes    = require("./routes/parcel.routes");
const shipmentRoutes  = require("./routes/shipment.routes");
const trackingRoutes  = require("./routes/tracking.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

// ✅ IMPORT SMS SERVICE (IMPORTANT FIX)
const { sendSMS } = require("./services/sms.service");

// DB
connectDB().catch((err) => {
  console.error("[DB] Startup connection failed:", err.message);
});

const app = express();

// ── CORS ─────────────────────────
const productionOrigins = (process.env.CLIENT_URL || "")
  .split(",").map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    if (productionOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── HEALTH ───────────────────────
app.get("/", (_, res) => res.json({ success: true, message: "API running" }));
app.get("/api/test", (_, res) => res.json({ success: true }));

// ── ✅ SMS TEST ROUTE (FIXED)
app.get("/api/sms-test/:phone", async (req, res) => {
  try {
    const phone = req.params.phone;

    const result = await sendSMS(
      phone,
      "🚀 Test SMS from BobbaExpress"
    );

    return res.json({
      success: result.success,
      phone,
      result
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ── API ROUTES ───────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/pickups",   pickupRoutes);
app.use("/api/parcels",   parcelRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/tracking",  trackingRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── 404 ─────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
  });
});

// ── ERROR ───────────────────────
app.use((err, req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ success: false, message: err.message });
});

module.exports = app;