const Pickup = require('./server/models/pickup.model');

async function testPickupModel() {
  try {
    console.log('Testing pickup model...');
    
    // Test creating a pickup
    const pickupData = {
      pickupId: 'TEST-001',
      customer: '69f216d5d5f0030acb561893', // John Doe's ID
      pickupAddress: {
        line1: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      scheduledDate: new Date(),
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
    console.log('✅ Pickup model created successfully');
    console.log('Pickup data:', pickup.pickupId);
    
  } catch (error) {
    console.error('❌ Pickup model error:', error.message);
  }
}

testPickupModel();
