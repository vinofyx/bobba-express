/**
 * Database Seeding Script for BobbaExpress Test Environment
 * 
 * This script creates test data for:
 * - Admin, Agent, and Driver user accounts
 * - Test customers
 * - Test pickups
 * - Test parcels
 * - Test shipments
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../../models/User');
const Customer = require('../../models/customer.model');
const Pickup = require('../../models/pickup.model');
const Parcel = require('../../models/parcel.model');
const Shipment = require('../../models/shipment.model');
const TrackingLog = require('../../models/tracking.model');

// Test data
const testUsers = [
  {
    email: 'admin@bobba.com',
    password: 'Admin@1234',
    name: 'Admin User',
    role: 'admin',
    phone: '9876543210',
    isActive: true
  },
  {
    email: 'agent@bobba.com',
    password: 'Agent@1234',
    name: 'Agent User',
    role: 'agent',
    phone: '9876543211',
    isActive: true
  },
  {
    email: 'driver@bobba.com',
    password: 'Driver@1234',
    name: 'Driver User',
    role: 'agent',
    phone: '9876543212',
    isActive: true
  },
  {
    email: 'staff@bobba.com',
    password: 'Staff@1234',
    name: 'Staff User',
    role: 'staff',
    phone: '9876543213',
    isActive: true
  }
];

const testCustomers = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '9876543220',
    address: {
      line1: '123 Main Street',
      city: 'Kuala Lumpur',
      state: 'Kuala Lumpur',
      pincode: '500001',
    },
    isActive: true
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '9876543221',
    address: {
      line1: '456 Oak Avenue',
      city: 'Petaling Jaya',
      state: 'Selangor',
      pincode: '460001',
    },
    isActive: true
  },
  {
    name: 'Siti Aminah',
    email: 'siti.aminah@example.com',
    phone: '9876543222',
    address: {
      line1: '789 Palm Road',
      city: 'Shah Alam',
      state: 'Selangor',
      pincode: '400001',
    },
    isActive: true
  }
];

// Generate customer ID
const generateCustomerId = async () => {
  const Customer = require('../../models/customer.model');
  const count = await Customer.countDocuments();
  const nextId = String(count + 1).padStart(3, '0');
  return `CUST-${nextId}`;
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bobbaexpress');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Pickup.deleteMany({});
    await Parcel.deleteMany({});
    await Shipment.deleteMany({});
    await TrackingLog.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create users
    console.log('👥 Creating test users...');
    const createdUsers = [];
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      createdUsers.push(user);
      console.log(`   ✅ Created ${user.role}: ${user.email}`);
    }

    // Create customers
    console.log('👤 Creating test customers...');
    const createdCustomers = [];
    for (let i = 0; i < testCustomers.length; i++) {
      const customerData = {
        ...testCustomers[i],
        customerId: await generateCustomerId(),
        phone: `01${String(234567880 + i).slice(-9)}`, // Malaysian format
      };
      const customer = new Customer(customerData);
      await customer.save();
      createdCustomers.push(customer);
      console.log(`   ✅ Created customer: ${customer.name} (${customer.customerId})`);
    }

    // Generate pickup ID
const generatePickupId = async () => {
  const Pickup = require('../../models/pickup.model');
  const count = await Pickup.countDocuments();
  const year = new Date().getFullYear();
  const nextId = String(count + 1).padStart(3, '0');
  return `PU-${year}-${nextId}`;
};

// Create pickups
    console.log('📦 Creating test pickups...');
    const agentUser = createdUsers.find(u => u.role === 'agent');
    const createdPickups = [];
    
    for (let i = 0; i < 3; i++) {
      const pickupData = {
        pickupId: await generatePickupId(),
        customer: createdCustomers[i]._id,
        pickupAddress: createdCustomers[i].address,
        scheduledDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // Next 3 days
        pickupTime: '10:00 AM',
        deliveryType: 'express',
        parcelType: 'parcel',
        parcelCount: Math.floor(Math.random() * 5) + 1, // Random 1-5 parcels
        status: i === 0 ? 'Assigned' : 'Requested',
        assignedAgent: i === 0 ? agentUser._id : null,
        statusHistory: [{
          status: i === 0 ? 'Assigned' : 'Requested',
          location: createdCustomers[i].address.city,
          note: 'Pickup created for testing',
          timestamp: new Date()
        }],
        createdBy: createdUsers[0]._id
      };
      
      const pickup = new Pickup(pickupData);
      await pickup.save();
      createdPickups.push(pickup);
      console.log(`   ✅ Created pickup: ${pickup.pickupId} (${pickup.parcelCount} parcels)`);
    }

    // Create parcels
    console.log('📮 Creating test parcels...');
    const createdParcels = [];
    
    for (let i = 0; i < 5; i++) {
      const parcel = new Parcel({
        trackingId: `TRK-2025-${String(i + 1).padStart(3, '0')}`,
        barcode: `BC-${Date.now()}-${i}`,
        pickupId: createdPickups[i % 3]._id,
        customer: createdCustomers[i % 3]._id,
        weight: Math.floor(Math.random() * 10) + 1,
        dimensions: {
          length: 20,
          width: 15,
          height: 10
        },
        type: 'parcel',
        quantity: 1,
        codAmount: Math.floor(Math.random() * 100) + 50,
        status: i < 2 ? 'In Transit' : i < 4 ? 'At Center' : 'Delivered',
        currentLocation: i < 2 ? 'In Transit' : i < 4 ? 'Kuala Lumpur Hub' : 'Delivered',
        assignedAgent: i < 2 ? agentUser._id : null,
        statusHistory: [{
          status: i < 2 ? 'In Transit' : i < 4 ? 'At Center' : 'Delivered',
          location: i < 2 ? 'In Transit' : i < 4 ? 'Kuala Lumpur Hub' : 'Delivered',
          note: 'Test parcel created',
          timestamp: new Date()
        }],
        createdBy: createdUsers[0]._id
      });
      await parcel.save();
      createdParcels.push(parcel);
      console.log(`   ✅ Created parcel: ${parcel.trackingId}`);
    }

    // Create shipments
    console.log('🚚 Creating test shipments...');
    const staffUser = createdUsers.find(u => u.role === 'staff');
    const createdShipments = [];
    
    // Shipment 1: In Transit (for TC-009 testing)
    const shipment1 = new Shipment({
      shipmentId: 'SH-2025-001',
      parcels: [createdParcels[0]._id, createdParcels[1]._id, createdParcels[2]._id],
      vehicleNumber: 'ABC 1234',
      driver: {
        name: 'Driver User',
        phone: '9876543212'
      },
      originHub: 'Kuala Lumpur Hub',
      destinationHub: 'Petaling Jaya Hub',
      status: 'Dispatched',
      statusHistory: [{
        status: 'Created',
        location: 'Kuala Lumpur Hub',
        note: 'Shipment created for testing',
        updatedBy: staffUser._id,
        timestamp: new Date()
      }, {
        status: 'Dispatched',
        location: 'Origin Hub',
        note: 'Shipment dispatched to destination',
        updatedBy: staffUser._id,
        timestamp: new Date()
      }],
      dispatchedAt: new Date(),
      createdBy: staffUser._id
    });
    await shipment1.save();
    createdShipments.push(shipment1);
    console.log(`   ✅ Created shipment: ${shipment1.shipmentId} (Dispatched)`);

    // Shipment 2: Received
    const shipment2 = new Shipment({
      shipmentId: 'SH-2025-002',
      parcels: [createdParcels[3]._id],
      vehicleNumber: 'XYZ 5678',
      driver: {
        name: 'Driver User',
        phone: '9876543212'
      },
      originHub: 'Penang Hub',
      destinationHub: 'Kuala Lumpur Hub',
      status: 'Received',
      statusHistory: [{
        status: 'Created',
        location: 'Penang Hub',
        note: 'Shipment created',
        updatedBy: staffUser._id,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }, {
        status: 'Dispatched',
        location: 'Origin Hub',
        note: 'Shipment dispatched',
        updatedBy: staffUser._id,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }, {
        status: 'Received',
        location: 'Destination Hub',
        note: 'Shipment received at destination',
        updatedBy: staffUser._id,
        timestamp: new Date()
      }],
      dispatchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      receivedAt: new Date(),
      createdBy: staffUser._id
    });
    await shipment2.save();
    createdShipments.push(shipment2);
    console.log(`   ✅ Created shipment: ${shipment2.shipmentId} (Received)`);

    // Create tracking logs
    console.log('📍 Creating tracking logs...');
    for (const parcel of createdParcels) {
      const trackingLog = new TrackingLog({
        parcelId: parcel._id,
        status: parcel.status,
        location: parcel.currentLocation,
        note: 'Test tracking log',
        updatedBy: createdUsers[0]._id,
        timestamp: new Date()
      });
      await trackingLog.save();
      console.log(`   ✅ Created tracking log for: ${parcel.trackingId}`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Test Accounts Created:');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ Email              │ Role   │ Password         │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│ admin@bobba.com    │ Admin  │ Admin@1234       │');
    console.log('│ agent@bobba.com    │ Agent  │ Agent@1234       │');
    console.log('│ driver@bobba.com   │ Driver │ Driver@1234      │');
    console.log('│ staff@bobba.com    │ Staff  │ Staff@1234       │');
    console.log('└─────────────────────────────────────────────────┘');
    
    console.log('\n📦 Test Shipments Created:');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│ Shipment ID │ Status      │ Parcels │ Purpose     │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│ SH-2025-001 │ Dispatched  │    3    │ TC-009 Test │');
    console.log('│ SH-2025-002 │ Received    │    1    │ General Test│');
    console.log('└─────────────────────────────────────────────────┘');

    console.log('\n🚀 Test environment is ready!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding script
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
