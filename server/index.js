const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Bobba Express Server is running!' });
});

// Add customer routes
const customerRoutes = require('./routes/customer.routes');
app.use('/api/customers', customerRoutes);

// Add tracking routes
const trackingRoutes = require('./routes/tracking.routes');
app.use('/api/tracking', trackingRoutes);

// Add pickup routes
const pickupRoutes = require('./routes/pickup.routes');
app.use('/api/pickups', pickupRoutes);

// Add parcel routes
const parcelRoutes = require('./routes/parcel.routes');
app.use('/api/parcels', parcelRoutes);

// Add shipment routes
const shipmentRoutes = require('./routes/shipment.routes');
app.use('/api/shipments', shipmentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
