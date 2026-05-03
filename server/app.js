const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const connectDB    = require("./config/db");

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes      = require("./routes/auth.routes");
const userRoutes      = require("./routes/user.routes");
const customerRoutes  = require("./routes/customer.routes");
const pickupRoutes    = require("./routes/pickup.routes");
const parcelRoutes    = require("./routes/parcel.routes");
const shipmentRoutes  = require("./routes/shipment.routes");
const trackingRoutes  = require("./routes/tracking.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

// ── DB ────────────────────────────────────────────────────────────────────────
connectDB().catch((err) => {
  console.error("[DB] Startup connection failed:", err.message);
});

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow ANY localhost port (Vite uses 5173, 8080, 3000, 4173, etc.)
// + production origins listed in CLIENT_URL env var (comma-separated)
const productionOrigins = (process.env.CLIENT_URL || "")
  .split(",").map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);                          // Postman / curl
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true); // any localhost
    if (productionOrigins.includes(origin)) return callback(null, true);          // prod URLs
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── Health ────────────────────────────────────────────────────────────────────
const health = (res) => res.json({
  success: true,
  message: "BobbaExpress API is running",
  version: "1.0.0",
  timestamp: new Date().toISOString(),
  endpoints: {
    auth:      "POST /api/auth/login  |  POST /api/auth/register",
    customers: "GET/POST /api/customers  (Bearer token required)",
    pickups:   "GET/POST /api/pickups    (Bearer token required)",
    parcels:   "GET/POST /api/parcels    (Bearer token required)",
    shipments: "GET/POST /api/shipments  (Bearer token required)",
    tracking:  "GET /api/tracking/:trackingId  (public)",
    dashboard: "GET /api/dashboard             (Bearer token required)",
  },
});

app.get("/",           (_, res) => health(res));
app.get("/health",     (_, res) => health(res));
app.get("/api",        (_, res) => health(res));
app.get("/api/health", (_, res) => health(res));
app.get("/api/test",   (_, res) => res.json({ success: true, message: "API test OK" }));

// ── Auth GET → helpful hints (no redirects — would break API clients) ─────────
const authHint = (body) => (_, res) => res.status(405).json({
  success: false,
  message: "This endpoint requires POST, not GET.",
  correctMethod: "POST",
  body: body || "No body needed",
});
app.get("/api/auth", (_, res) => res.json({
  success: true, message: "Auth API",
  endpoints: {
    "POST /api/auth/register": { name: "string", email: "string", password: "min 8 chars", role: "admin|staff|agent" },
    "POST /api/auth/login":    { email: "string", password: "string" },
    "GET  /api/auth/me":       "requires Authorization: Bearer <token>",
    "POST /api/auth/refresh":  "uses httpOnly refresh cookie",
    "POST /api/auth/logout":   "requires Authorization: Bearer <token>",
  },
}));
app.get("/api/auth/login",    authHint({ email: "you@example.com", password: "yourpassword" }));
app.get("/api/auth/register", authHint({ name: "John", email: "you@example.com", password: "min8chars", role: "staff" }));
app.get("/api/auth/logout",   authHint(null));
app.get("/api/auth/refresh",  authHint(null));

// ── Protected GET hints (no token → show info instead of 401) ────────────────
const protectedHint = (label) => (req, res, next) => {
  if (!req.headers.authorization) {
    return res.json({
      success: true,
      message: `${label} endpoint is active.`,
      how_to_access: "POST /api/auth/login → copy accessToken → set header:  Authorization: Bearer <token>",
    });
  }
  next();
};
app.get("/api/customers", protectedHint("Customers"));
app.get("/api/pickups",   protectedHint("Pickups"));
app.get("/api/parcels",   protectedHint("Parcels"));
app.get("/api/shipments", protectedHint("Shipments"));
app.get("/api/users",     protectedHint("Users"));
app.get("/api/dashboard", protectedHint("Dashboard"));
app.get("/api/tracking",  (_, res) => res.json({ success: true, message: "Provide a tracking ID", usage: "GET /api/tracking/:trackingId" }));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/pickups",   pickupRoutes);
app.use("/api/parcels",   parcelRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/tracking",  trackingRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({
  success: false,
  message: `Route not found: ${req.method} ${req.url}`,
}));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body.",
      tip: "Body must be valid JSON. Put the Authorization token in the Headers tab, not the Body.",
    });
  }
  console.error("[Error]", err.message);
  res.status(500).json({ success: false, message: err.message || "Unexpected server error." });
});

module.exports = app;
