const express       = require("express");
const cors          = require("cors");
const cookieParser  = require("cookie-parser");
const connectDB     = require("./config/db");

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes     = require("./routes/auth.routes");
const userRoutes     = require("./routes/user.routes");
const customerRoutes = require("./routes/customer.routes");
const pickupRoutes   = require("./routes/pickup.routes");
const parcelRoutes   = require("./routes/parcel.routes");
const shipmentRoutes = require("./routes/shipment.routes");
const trackingRoutes  = require("./routes/tracking.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

// Connect to MongoDB — catch rejection so Node.js doesn't crash if URI is missing.
// Individual requests will still fail gracefully if DB is not available.
connectDB().catch((err) => {
  console.error('[DB] Startup connection failed:', err.message);
  console.error('[DB] Set MONGODB_URI in your Render/production environment variables.');
});

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
// Support comma-separated CLIENT_URL for multiple origins (e.g. Vercel preview + prod)
const extraOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:5173",
  ...extraOrigins,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests (curl, Postman, server-to-server) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── Path normalisation (runs before all route handlers) ──────────────────────
// 1. /api/v1/* → /api/*  (legacy alias)
// 2. /<resource>/* → /api/<resource>/*  (missing /api prefix — common mistake)
const API_RESOURCES = ['auth', 'customers', 'pickups', 'parcels', 'shipments', 'tracking', 'dashboard', 'users'];
app.use((req, _res, next) => {
  // Strip legacy /api/v1 prefix
  if (req.path.startsWith('/api/v1/')) {
    req.url = '/api/' + req.url.slice('/api/v1/'.length);
    return next();
  }
  if (req.path === '/api/v1') {
    req.url = '/api';
    return next();
  }
  // Rewrite bare resource paths → /api/<resource>
  // e.g. /auth/login → /api/auth/login
  const firstSegment = req.path.split('/')[1];
  if (firstSegment && API_RESOURCES.includes(firstSegment)) {
    req.url = '/api' + req.url;
  }
  next();
});

// ── Health & Root ─────────────────────────────────────────────────────────────
const healthPayload = (res) => res.json({
  success: true,
  message: "BobbaExpress API is running",
  version: "1.0.0",
  timestamp: new Date().toISOString(),
  note: "All data endpoints require Authorization: Bearer <token>. Use the frontend at http://localhost:8080",
  endpoints: {
    auth:      "POST /api/auth/login | POST /api/auth/register | GET /api/auth/me",
    customers: "GET  /api/customers",
    pickups:   "GET  /api/pickups",
    parcels:   "GET  /api/parcels",
    shipments: "GET  /api/shipments",
    tracking:  "GET  /api/tracking/:trackingId",
    dashboard: "GET  /api/dashboard",
    users:     "GET  /api/users",
  },
});

app.get("/",           (_, res) => healthPayload(res));
app.get("/health",     (_, res) => healthPayload(res));
app.get("/api",        (_, res) => healthPayload(res));
app.get("/api/",       (_, res) => healthPayload(res));
app.get("/api/health", (_, res) => healthPayload(res));
app.get("/api/test",   (_, res) => res.json({ success: true, message: "API test OK", timestamp: new Date().toISOString() }));

// ── Auth GET → redirect to frontend ──────────────────────────────────────────
// Browser navigation hits these with GET; redirect to the React UI instead.
const FRONTEND = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',')[0].trim()
  : 'http://localhost:8080';

app.get("/api/auth/register", (_, res) => res.redirect(`${FRONTEND}/register`));
app.get("/api/auth/login",    (_, res) => res.redirect(`${FRONTEND}/login`));
app.get("/api/auth/logout",   (_, res) => res.redirect(`${FRONTEND}/login`));
app.get("/api/auth/refresh",  (_, res) => res.redirect(`${FRONTEND}/login`));
app.get("/api/auth",          (_, res) => res.redirect(`${FRONTEND}/login`));

// ── Browser-friendly hints for protected GET endpoints ────────────────────────
// When accessed from browser (no token), shows info instead of 401.
// Real requests with Authorization header pass straight through to the router.
const protectedHint = (label) => (req, res, next) => {
  if (!req.headers.authorization) {
    return res.json({
      success: true,
      message: `✅ Server is running. ${label} endpoint is active.`,
      auth_required: true,
      how_to_access: "Include  Authorization: Bearer <token>  header, or use the frontend at http://localhost:8080",
      login_endpoint: "POST /api/auth/login  —  { email, password }",
    });
  }
  next(); // has token → proceed to real router
};

app.get("/api/parcels",   protectedHint("Parcels"));
app.get("/api/pickups",   protectedHint("Pickups"));
app.get("/api/customers", protectedHint("Customers"));
app.get("/api/shipments", protectedHint("Shipments"));
app.get("/api/users",     protectedHint("Users"));
app.get("/api/dashboard", protectedHint("Dashboard"));
app.get("/api/tracking",  (_, res) => res.json({
  success: true,
  message: "Tracking endpoint — provide a tracking ID",
  usage: "GET /api/tracking/:trackingId",
}));

// ── SMS Diagnostics (dev only) ────────────────────────────────────────────────
app.get("/api/sms-test/:phone", async (req, res) => {
  const axios = require("axios");
  const key   = process.env.FAST2SMS_API_KEY;
  const phone = String(req.params.phone).replace(/^\+?91/, '').replace(/\D/g, '').slice(-10);

  if (!key) {
    return res.json({ success: false, mode: "DEV_MODE",
      problem: "FAST2SMS_API_KEY is empty in server/.env",
      fix: "Set FAST2SMS_API_KEY=your_key in server/.env and restart the server" });
  }
  if (phone.length !== 10) {
    return res.json({ success: false, problem: `Invalid phone: ${req.params.phone}. Must be 10 digits.` });
  }
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      { authorization: key, route: "v3", message: "BobbaExpress test SMS.", language: "english", flash: 0, numbers: phone },
      { headers: { authorization: key, "Content-Type": "application/json" }, timeout: 10000 }
    );
    return res.json({ success: response.data?.return === true, phone_sent_to: `+91${phone}`, full_response: response.data });
  } catch (err) {
    return res.json({ success: false, problem: err.message, http_error: err.response?.data });
  }
});

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
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`,
    tip: req.url !== req.originalUrl
      ? `(original request was ${req.method} ${req.originalUrl})`
      : undefined,
  })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || "Unexpected server error." });
});

module.exports = app;
