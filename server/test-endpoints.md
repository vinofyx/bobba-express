# Bobba Express API Testing Guide

## Setup Instructions

1. **Stop backend server** (if running)
2. **All models are already created** in `/models/` directory
3. **Install nanoid** (if not installed):
   ```bash
   cd server
   npm install nanoid
   ```
4. **Start server**:
   ```bash
   node src/server.js
   ```

## Test Endpoints in Order

### 1. Create Customer
```bash
POST /api/customers
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "address": {
    "line1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

### 2. Create Pickup
```bash
POST /api/pickups
Content-Type: application/json

{
  "customer": "CUSTOMER_ID_FROM_STEP_1",
  "pickupAddress": {
    "line1": "123 Main St",
    "city": "Mumbai", 
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "scheduledDate": "2026-04-24",
  "pickupTime": "10:00",
  "deliveryType": "standard",
  "parcelType": "parcel"
}
```

### 3. Create Parcel (link to pickup)
```bash
POST /api/parcels
Content-Type: application/json

{
  "pickupId": "PICKUP_ID_FROM_STEP_2",
  "weight": 2.5,
  "dimensions": {
    "length": 20,
    "width": 15,
    "height": 10
  },
  "quantity": 1,
  "codAmount": 0
}
```

### 4. Create Shipment (add parcel IDs)
```bash
POST /api/shipments
Content-Type: application/json

{
  "parcelIds": ["PARCEL_ID_FROM_STEP_3"],
  "vehicleNumber": "MH01AB1234",
  "driver": {
    "name": "Driver Name",
    "phone": "9876543211"
  },
  "originHub": "Mumbai Hub",
  "destinationHub": "Delhi Hub"
}
```

### 5. Add Tracking Event
```bash
POST /api/tracking
Content-Type: application/json

{
  "parcelId": "PARCEL_ID_FROM_STEP_3",
  "status": "In Transit",
  "location": "Mumbai Hub",
  "note": "Parcel dispatched from origin hub"
}
```

### 6. Verify Public Tracking
```bash
GET /api/tracking/TRACKING_ID_FROM_STEP_3
```

## Expected Response Format
All endpoints return:
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

## Notes
- Replace IDs in caps with actual IDs from previous responses
- Ensure MongoDB is running on localhost:27017
- Server runs on port 5000 by default
