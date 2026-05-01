const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPickupSimple() {
  try {
    // Get auth token
    const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@bobba.com',
      password: 'Admin@1234'
    }, { withCredentials: true });
    
    const token = authResponse.data.data.accessToken;
    console.log('✅ Auth token obtained');
    
    // Simple test data
    const pickupData = {
      customer: '69f216d5d5f0030acb561893', // Use actual ObjectId
      pickupAddress: {
        line1: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      scheduledDate: '2026-04-30',
      pickupTime: '10:00 AM',
      parcelCount: 1
    };
    
    console.log('📝 Creating pickup...');
    
    // Create pickup
    const response = await axios.post(`${BASE_URL}/pickups`, pickupData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Pickup created successfully');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testPickupSimple();
