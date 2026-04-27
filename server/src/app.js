require("dotenv").config();

const express       = require("express");
const cors          = require("cors");
const cookieParser  = require("cookie-parser");
const connectDB     = require("./config/db");

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes     = require("../routes/auth.routes");
const userRoutes     = require("../routes/user.routes");
const customerRoutes = require("../routes/customer.routes");
const pickupRoutes   = require("../routes/pickup.routes");
const parcelRoutes   = require("../routes/parcel.routes");
const shipmentRoutes = require("../routes/shipment.routes");
const trackingRoutes  = require("../routes/tracking.routes");
const dashboardRoutes = require("../routes/dashboard.routes");

connectDB();

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/",       (_, res) => res.json({ success: true, message: "BobbaExpress API" }));
app.get("/health", (_, res) => res.json({ success: true, message: "OK" }));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/pickups",   pickupRoutes);
app.use("/api/parcels",   parcelRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/tracking",  trackingRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || "Unexpected server error." });
});

module.exports = app;
