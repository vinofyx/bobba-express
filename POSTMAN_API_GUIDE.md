# 📮 BobbaExpress API Testing Guide

## 🚀 Quick Start

### **1. Import Collection and Environment**
1. Open Postman
2. Click **Import** → **Select Files**
3. Import `postman/BobbaExpress-API-Tests.postman_collection.json`
4. Import `postman/BobbaExpress-Environment.postman_environment.json`
5. Select the "BobbaExpress Environment" in the environment dropdown

### **2. Set Base URL**
- Default: `http://localhost:5000/api`
- Update if your server runs on a different port

### **3. Run Tests**
- Execute requests in order (1-8)
- Each request sets environment variables for the next

---

## 📋 API Test Sequence

### **REQUEST 1: Authentication**
```http
POST /auth/login
```

**Purpose**: Get JWT token for authenticated requests

**Request Body:**
```json
{
  "email": "admin@bobba.com",
  "password": "Admin@1234"
}
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "admin@bobba.com",
    "role": "admin"
  }
}
```

**Tests:**
- ✅ Status 200
- ✅ Token returned
- ✅ TOKEN environment variable set

---

### **REQUEST 2: Create Customer**
```http
POST /customers
```

**Purpose**: Create a new customer for pickup scheduling

**Headers:**
```
Authorization: Bearer {{TOKEN}}
```

**Request Body:**
```json
{
  "fullName": "Ahmad Zulkifli",
  "email": "ahmad@test.com",
  "phone": "0123456789",
  "address": "No 5, Jalan Ampang, KL"
}
```

**Expected Response:**
```json
{
  "id": "customer_id",
  "fullName": "Ahmad Zulkifli",
  "email": "ahmad@test.com",
  "phone": "0123456789",
  "address": "No 5, Jalan Ampang, KL",
  "createdAt": "2025-04-29T10:00:00.000Z"
}
```

**Tests:**
- ✅ Status 201
- ✅ Customer ID returned
- ✅ CUSTOMER_ID environment variable set

---

### **REQUEST 3: Create Pickup**
```http
POST /pickups
```

**Purpose**: Schedule a pickup for the created customer

**Headers:**
```
Authorization: Bearer {{TOKEN}}
```

**Request Body:**
```json
{
  "customerId": "{{CUSTOMER_ID}}",
  "pickupDate": "2025-04-29",
  "pickupTime": "10:00",
  "parcelCount": 3,
  "notes": "Fragile items"
}
```

**Expected Response:**
```json
{
  "id": "pickup_id",
  "customerId": "{{CUSTOMER_ID}}",
  "pickupDate": "2025-04-29",
  "pickupTime": "10:00",
  "parcelCount": 3,
  "notes": "Fragile items",
  "status": "pending",
  "createdAt": "2025-04-29T10:00:00.000Z"
}
```

**Tests:**
- ✅ Status 201
- ✅ Status is pending
- ✅ PICKUP_ID environment variable set

---

### **REQUEST 4: Assign Agent to Pickup**
```http
PATCH /pickups/{{PICKUP_ID}}/assign
```

**Purpose**: Assign an agent to handle the pickup

**Headers:**
```
Authorization: Bearer {{TOKEN}}
```

**Request Body:**
```json
{
  "agentId": "agent-001"
}
```

**Expected Response:**
```json
{
  "id": "{{PICKUP_ID}}",
  "agentId": "agent-001",
  "status": "assigned",
  "updatedAt": "2025-04-29T10:05:00.000Z"
}
```

**Tests:**
- ✅ Status 200
- ✅ Status is assigned

---

### **REQUEST 5: Complete Pickup**
```http
PATCH /pickups/{{PICKUP_ID}}/complete
```

**Purpose**: Mark pickup as completed with actual count and photo

**Headers:**
```
Authorization: Bearer {{TOKEN}}
Content-Type: multipart/form-data
```

**Request Body (form-data):**
```
actualCount: 3
notes: "All collected"
photo: [file upload]
```

**Expected Response:**
```json
{
  "id": "{{PICKUP_ID}}",
  "status": "completed",
  "actualCount": 3,
  "photoUrl": "https://example.com/pickup-photo.jpg",
  "completedAt": "2025-04-29T10:30:00.000Z"
}
```

**Tests:**
- ✅ Status 200
- ✅ Status is completed

---

### **REQUEST 6: Get Parcels by Pickup**
```http
GET /parcels?pickupId={{PICKUP_ID}}
```

**Purpose**: Retrieve parcels created from the completed pickup

**Headers:**
```
Authorization: Bearer {{TOKEN}}
```

**Expected Response:**
```json
{
  "data": [
    {
      "trackingNumber": "BE001234",
      "pickupId": "{{PICKUP_ID}}",
      "status": "picked_up",
      "weight": 2.5,
      "dimensions": {
        "length": 20,
        "width": 15,
        "height": 10
      }
    },
    {
      "trackingNumber": "BE001235",
      "pickupId": "{{PICKUP_ID}}",
      "status": "picked_up",
      "weight": 1.8,
      "dimensions": {
        "length": 15,
        "width": 10,
        "height": 8
      }
    },
    {
      "trackingNumber": "BE001236",
      "pickupId": "{{PICKUP_ID}}",
      "status": "picked_up",
      "weight": 3.2,
      "dimensions": {
        "length": 25,
        "width": 20,
        "height": 15
      }
    }
  ],
  "total": 3
}
```

**Tests:**
- ✅ Status 200
- ✅ 3 parcels created
- ✅ PARCEL_1, PARCEL_2, PARCEL_3 environment variables set

---

### **REQUEST 7: Create Shipment**
```http
POST /shipments
```

**Purpose**: Create a shipment to transport the parcels

**Headers:**
```
Authorization: Bearer {{TOKEN}}
```

**Request Body:**
```json
{
  "origin": "Kuala Lumpur",
  "destination": "Johor Bahru",
  "driverId": "driver-001",
  "departureDate": "2025-04-29",
  "departureTime": "08:00",
  "parcelIds": ["{{PARCEL_1}}", "{{PARCEL_2}}", "{{PARCEL_3}}"]
}
```

**Expected Response:**
```json
{
  "id": "shipment_id",
  "origin": "Kuala Lumpur",
  "destination": "Johor Bahru",
  "driverId": "driver-001",
  "departureDate": "2025-04-29",
  "departureTime": "08:00",
  "parcelIds": ["{{PARCEL_1}}", "{{PARCEL_2}}", "{{PARCEL_3}}"],
  "status": "in_transit",
  "createdAt": "2025-04-29T07:00:00.000Z"
}
```

**Tests:**
- ✅ Status 201
- ✅ Shipment ID returned
- ✅ SHIPMENT_ID environment variable set

---

### **REQUEST 8: Track Parcel**
```http
GET /tracking/{{PARCEL_1}}
```

**Purpose**: Test public tracking functionality (TC-008)

**Headers:**
```
No authentication required (public endpoint)
```

**Expected Response:**
```json
{
  "trackingNumber": "{{PARCEL_1}}",
  "currentStatus": "in_transit",
  "timeline": [
    {
      "status": "picked_up",
      "location": "Kuala Lumpur",
      "timestamp": "2025-04-29T10:30:00.000Z",
      "note": "Parcel collected from customer"
    },
    {
      "status": "at_warehouse",
      "location": "Kuala Lumpur Hub",
      "timestamp": "2025-04-29T11:00:00.000Z",
      "note": "Parcel received at warehouse"
    },
    {
      "status": "in_transit",
      "location": "On the way to Johor Bahru",
      "timestamp": "2025-04-29T08:00:00.000Z",
      "note": "Parcel in transit to destination"
    }
  ],
  "eta": "2025-04-30T14:00:00.000Z",
  "sender": {
    "name": "Ahmad Zulkifli",
    "phone": "0123XXXX89"
  },
  "receiver": {
    "name": "Jane Doe",
    "phone": "0147XXXX56",
    "address": "123 Main Street, Johor Bahru"
  },
  "shareableLink": "http://localhost:3000/tracking?id={{PARCEL_1}}"
}
```

**Tests:**
- ✅ Status 200
- ✅ Timeline has 3 steps
- ✅ In Transit status
- ✅ ETA present

---

## 🔧 Environment Variables

### **Initial Variables:**
- `BASE_URL`: API base URL
- `TOKEN`: JWT authentication token
- `CUSTOMER_ID`: Created customer ID
- `PICKUP_ID`: Created pickup ID
- `PARCEL_1`, `PARCEL_2`, `PARCEL_3`: Parcel tracking numbers
- `SHIPMENT_ID`: Created shipment ID

### **Variable Flow:**
```
TOKEN (from Request 1) 
  ↓
CUSTOMER_ID (from Request 2)
  ↓
PICKUP_ID (from Request 3)
  ↓
PARCEL_1, PARCEL_2, PARCEL_3 (from Request 6)
  ↓
SHIPMENT_ID (from Request 7)
```

---

## 🧪 Running the Tests

### **Sequential Execution:**
1. **Select all requests** in the collection
2. **Click "Run"** → **Run collection**
3. **Choose environment**: "BobbaExpress Environment"
4. **Run the collection**

### **Individual Request Testing:**
- Execute requests in order (1-8)
- Each request depends on previous requests
- Check environment variables after each request

### **Test Results:**
- **Pass/Fail status** for each test
- **Response time** metrics
- **Response body** validation
- **Environment variable** updates

---

## 🔍 Test Validation

### **Authentication Tests:**
- ✅ Valid credentials return token
- ✅ Token format validation
- ✅ Token stored in environment

### **Customer Tests:**
- ✅ Customer creation success
- ✅ Required fields validation
- ✅ Customer ID extraction

### **Pickup Tests:**
- ✅ Pickup scheduling
- ✅ Agent assignment
- ✅ Pickup completion with photo

### **Shipment Tests:**
- ✅ Shipment creation
- ✅ Parcel linking
- ✅ Driver assignment

### **Tracking Tests (TC-008):**
- ✅ Public tracking access
- ✅ Timeline generation
- ✅ ETA calculation
- ✅ Data masking (phone numbers)

---

## 🚨 Common Issues & Solutions

### **1. Authentication Failures**
```
Status: 401 Unauthorized
```
**Solution**: Ensure admin user exists and credentials are correct

### **2. Customer Creation Failures**
```
Status: 400 Bad Request
```
**Solution**: Check required fields and email format

### **3. Pickup Assignment Failures**
```
Status: 404 Not Found
```
**Solution**: Ensure pickup exists and agent ID is valid

### **4. Parcel Creation Failures**
```
Status: 500 Internal Server Error
```
**Solution**: Check pickup completion status and database connection

### **5. Shipment Creation Failures**
```
Status: 400 Bad Request
```
**Solution**: Verify parcel IDs exist and are not already in shipment

### **6. Tracking Failures**
```
Status: 404 Not Found
```
**Solution**: Ensure parcel exists and tracking number is correct

---

## 📊 Test Coverage Summary

### **API Endpoints Tested:**
- ✅ `POST /auth/login` - Authentication
- ✅ `POST /customers` - Customer creation
- ✅ `POST /pickups` - Pickup scheduling
- ✅ `PATCH /pickups/:id/assign` - Agent assignment
- ✅ `PATCH /pickups/:id/complete` - Pickup completion
- ✅ `GET /parcels` - Parcel retrieval
- ✅ `POST /shipments` - Shipment creation
- ✅ `GET /tracking/:id` - Public tracking

### **Business Logic Tested:**
- ✅ Complete workflow (customer → pickup → shipment → tracking)
- ✅ Authentication and authorization
- ✅ Data validation and error handling
- ✅ File upload (pickup photo)
- ✅ Environment variable management
- ✅ Public tracking functionality (TC-008)

### **Test Assertions:**
- ✅ HTTP status codes
- ✅ Response data structure
- ✅ Business logic validation
- ✅ Environment variable updates
- ✅ Timeline and ETA functionality

---

## 🎯 Best Practices

### **1. Sequential Execution**
- Run requests in order (1-8)
- Each request sets up data for the next
- Don't skip requests in the sequence

### **2. Environment Management**
- Clear environment before running
- Check variable values after each request
- Use environment variables for dynamic data

### **3. Test Validation**
- Review all test assertions
- Check response bodies match expected format
- Verify business logic is correctly implemented

### **4. Error Handling**
- Test both success and failure scenarios
- Validate error messages and status codes
- Ensure proper error handling in API

---

## 🚀 Ready to Test!

Your BobbaExpress API test suite is ready with:

- ✅ **8 sequential API requests**
- ✅ **Complete workflow testing**
- ✅ **Environment variable management**
- ✅ **Comprehensive test assertions**
- ✅ **TC-008 tracking functionality**
- ✅ **Error handling validation**

### **Import and Run:**
1. Import collection and environment files
2. Select "BobbaExpress Environment"
3. Run the collection sequentially
4. Review test results and environment variables

Happy API testing! 📮
