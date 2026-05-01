# BobbaExpress Test Environment Setup Guide

## 🎯 Overview
This guide helps you set up a complete test environment for BobbaExpress development and testing.

## 📋 Prerequisites

### **System Requirements**
- ✅ Node.js 18+ installed
- ✅ MongoDB installed and running
- ✅ Git installed
- ✅ Modern web browser (Chrome/Firefox/Safari)

### **Software Dependencies**
- ✅ Visual Studio Code (recommended)
- ✅ Postman or similar API testing tool
- ✅ MongoDB Compass (optional, for database visualization)

## 🚀 Quick Setup

### **1. Clone and Install Dependencies**
```bash
# Clone the repository
git clone <repository-url>
cd "Bobba Express"

# Install all dependencies (root, client, server)
npm run install:all
```

### **2. Environment Configuration**
```bash
# Copy environment template
cp server/.env.example server/.env

# Edit the environment file
notepad server/.env
```

**Required Environment Variables:**
```env
MONGODB_URI=mongodb://localhost:27017/bobbaexpress
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:8080
```

**Optional (for real SMS/Email):**
```env
FAST2SMS_API_KEY=your-fast2sms-api-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### **3. Database Setup**
```bash
# Start MongoDB (if not already running)
mongod

# Seed the database with test data
npm run db:seed
```

### **4. Start Development Servers**
```bash
# Start both client and server
npm run dev

# Or start individually:
npm run dev:server  # Backend on port 5000
npm run dev:client  # Frontend on port 8080
```

## 🔍 Test Environment Verification

### **Automated Environment Check**
```bash
# Run the environment setup verification
npm run test:env
```

This script will check:
- ✅ API Server running on port 5000
- ✅ Client Server running on port 8080
- ✅ Database connection
- ✅ Test user accounts
- ✅ Environment variables
- ✅ Email/SMS configuration

### **Manual Verification Steps**

#### **1. Server Status Check**
```bash
# Check API server
curl http://localhost:5000/api/health

# Check client server
curl http://localhost:8080
```

#### **2. Database Connection Check**
```bash
# Connect to MongoDB
mongo bobbaexpress

# List collections
show collections
```

#### **3. Test User Accounts**
The following accounts are created during seeding:

| Email | Role | Password |
|-------|------|----------|
| admin@bobba.com | Admin | Admin@1234 |
| agent@bobba.com | Agent | Agent@1234 |
| driver@bobba.com | Driver | Driver@1234 |
| staff@bobba.com | Staff | Staff@1234 |

## 📊 Test Data Overview

### **Created Entities**
- ✅ **4 Test Users** (Admin, Agent, Driver, Staff)
- ✅ **3 Test Customers** (John Doe, Jane Smith, Siti Aminah)
- ✅ **3 Test Pickups** (Different statuses)
- ✅ **5 Test Parcels** (Various tracking statuses)
- ✅ **2 Test Shipments** (For testing workflows)

### **Key Test Shipments**
- **SH-2025-001**: Dispatched with 3 parcels (for TC-009 testing)
- **SH-2025-002**: Received with 1 parcel (for general testing)

## 🧪 Running Tests

### **TC-009 Delivery Completion Test**
```bash
# Run the specific test case
node test_tc009.js

# Or follow manual test steps:
# 1. Navigate to http://localhost:8080
# 2. Login as admin@bobba.com / Admin@1234
# 3. Go to Shipments → SH-2025-001
# 4. Click "Mark Delivered"
# 5. Fill delivery form and submit
```

### **Database Reset and Reseed**
```bash
# Reset database (clear all data)
npm run db:reset

# Reseed with fresh test data
npm run db:seed

# Or do both at once
npm run test:setup
```

## 📧 Email/SMS Mock Configuration

### **Mock Mode (Default)**
When `FAST2SMS_API_KEY` and email settings are empty:
- ✅ SMS messages are logged to console
- ✅ Emails are logged to console
- ✅ No external API calls made

### **Real SMS Setup**
1. Sign up at [Fast2SMS](https://www.fast2sms.com)
2. Get API key from Dashboard → Dev API
3. Add to `.env`: `FAST2SMS_API_KEY=your_key_here`
4. Restart server

### **Real Email Setup**
1. Configure Gmail App Password
2. Add email settings to `.env`
3. Restart server

## 🔧 Development Tools

### **API Testing with Postman**
Import the Postman collection (if available) or use these endpoints:

```bash
# Authentication
POST /api/auth/login
{
  "email": "admin@bobba.com",
  "password": "Admin@1234"
}

# Get shipments
GET /api/shipments
Authorization: Bearer <jwt_token>

# Mark shipment delivered
PATCH /api/shipments/SH-2025-001/delivered
{
  "photoProof": "base64_image_data",
  "recipientName": "Siti Aminah",
  "signature": "base64_signature_data"
}
```

### **Database Management**
```bash
# Connect to database
mongo bobbaexpress

# View users
db.users.find().pretty()

# View shipments
db.shipments.find().pretty()

# View parcels
db.parcels.find().pretty()
```

## 🚨 Common Issues and Solutions

### **Issue: MongoDB Connection Failed**
```bash
# Solution: Start MongoDB
mongod

# Or check if running on different port
mongod --port 27017
```

### **Issue: Port Already in Use**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <process_id> /F
```

### **Issue: Module Not Found**
```bash
# Reinstall dependencies
npm run install:all

# Clear node modules and reinstall
rm -rf node_modules client/node_modules server/node_modules
npm run install:all
```

### **Issue: JWT Secret Missing**
```bash
# Add to .env file
echo "JWT_SECRET=your-secret-key-here" >> server/.env
```

## 📱 Mobile Testing

### **Responsive Design Testing**
- Open browser dev tools (F12)
- Toggle device emulation
- Test on different screen sizes
- Verify touch interactions

### **Agent App Testing**
- Login as agent@bobba.com / Agent@1234
- Navigate to "My Deliveries"
- Test delivery completion workflow
- Verify GPS capture functionality

## 🔍 Debugging

### **Enable Debug Logging**
```bash
# Set debug environment variable
set DEBUG=bobbaexpress:*
npm run dev

# Or add to .env
DEBUG=bobbaexpress:*
```

### **Check Logs**
```bash
# Server logs
tail -f server/logs/app.log

# Or check console output
```

### **Database Queries**
```bash
# Enable MongoDB logging
mongod --dbpath /path/to/db --logpath /path/to/log --logappend
```

## 🎯 Test Scenarios

### **Scenario 1: Complete Delivery Workflow**
1. Login as Admin
2. Navigate to Shipments
3. Find SH-2025-001
4. Mark as delivered with proof
5. Verify all parcels updated
6. Check SMS notifications

### **Scenario 2: Agent Mobile Workflow**
1. Login as Agent
2. View assigned deliveries
3. Complete delivery with photos
4. Capture signature
5. Verify real-time updates

### **Scenario 3: Multi-User Testing**
1. Open multiple browser sessions
2. Login as different users
3. Test concurrent operations
4. Verify data consistency

## 📈 Performance Testing

### **Load Testing**
```bash
# Install artillery (if needed)
npm install -g artillery

# Run load test
artillery run load-test-config.yml
```

### **Database Performance**
```bash
# Check indexes
mongo bobbaexpress
db.shipments.getIndexes()
db.parcels.getIndexes()
```

## 🎉 Success Criteria

Your test environment is ready when:

- ✅ **API Server** running on http://localhost:5000
- ✅ **Client Server** running on http://localhost:8080
- ✅ **Database** connected and seeded with test data
- ✅ **Test Users** created and accessible
- ✅ **Email/SMS** mock configuration working
- ✅ **TC-009** test case can be executed
- ✅ **All verification checks** pass

## 📞 Support

If you encounter issues:

1. Check the console output for error messages
2. Verify environment variables are set correctly
3. Ensure MongoDB is running
4. Check network connectivity
5. Review the troubleshooting section above

---

**🚀 Your BobbaExpress test environment is now ready for development and testing!**
