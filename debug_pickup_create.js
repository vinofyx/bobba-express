const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function debugPickupCreation() {
  try {
    // Get auth token
    const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@bobba.com',
      password: 'Admin@1234'
    }, { withCredentials: true });
    
    const token = authResponse.data.data.accessToken;
    console.log('✅ Auth token obtained');
    
    // Test data
    const pickupData = {
      customer: 'CUST-001',
      pickupAddress: {
        line1: 'No 5, Jalan Ampang',
        city: 'Kuala Lumpur',
        state: 'Kuala Lumpur',
        pincode: '500001'
      },
      scheduledDate: '2026-04-30',
      pickupTime: '10:00 AM',
      deliveryType: 'express',
      parcelType: 'parcel',
      parcelCount: 3,
      notes: 'Fragile items, handle with care'
    };
    
    console.log('📝 Pickup data:', JSON.stringify(pickupData, null, 2));
    
    // Create pickup
    const response = await axios.post(`${BASE_URL}/pickups`, pickupData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('✅ Pickup created successfully');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugPickupCreation();
