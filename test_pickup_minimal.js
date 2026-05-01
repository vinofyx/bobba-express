const mongoose = require('mongoose');
const Pickup = require('./server/models/pickup.model');

async function testPickupMinimal() {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/bobbaexpress');
    console.log('✅ Connected to MongoDB');
    
    // Create pickup directly
    const pickupData = {
      pickupId: 'TEST-002',
      customer: '69f216d5d5f0030acb561893',
      pickupAddress: {
        line1: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      scheduledDate: new Date('2026-04-30'),
      pickupTime: '10:00 AM',
      parcelCount: 1,
      status: 'Requested',
      statusHistory: [{
        status: 'Requested',
        note: 'Test pickup',
        updatedBy: '69f216d5d5f0030acb561893',
        timestamp: new Date()
      }],
      createdBy: '69f216d5d5f0030acb561893'
    };
    
    const pickup = new Pickup(pickupData);
    await pickup.save();
    
    console.log('✅ Pickup created successfully:', pickup.pickupId);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPickupMinimal();
