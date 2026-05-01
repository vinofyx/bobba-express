const express = require('express');
const mongoose = require('mongoose');
const Pickup = require('./server/models/pickup.model');

async function testPickupNoAuth() {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/bobbaexpress');
    console.log('✅ Connected to MongoDB');
    
    // Create express app
    const app = express();
    app.use(express.json());
    
    // Simple pickup creation endpoint
    app.post('/test-pickup', async (req, res) => {
      try {
        console.log('📝 Pickup creation request:', req.body);
        
        const pickupData = {
          pickupId: 'TEST-003',
          customer: req.body.customer,
          pickupAddress: req.body.pickupAddress,
          scheduledDate: new Date(req.body.scheduledDate),
          pickupTime: req.body.pickupTime,
          parcelCount: req.body.parcelCount || 1,
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
        
        res.json({ success: true, data: { pickup } });
      } catch (error) {
        console.error('❌ Pickup creation error:', error);
        res.status(500).json({ success: false, message: error.message });
      }
    });
    
    // Start server
    app.listen(5001, () => {
      console.log('🚀 Test server running on port 5001');
      
      // Test the endpoint
      const testPickup = async () => {
        try {
          const axios = require('axios');
          
          const pickupData = {
            customer: '69f216d5d5f0030acb561893',
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
          
          const response = await axios.post('http://localhost:5001/test-pickup', pickupData);
          console.log('✅ Test successful:', response.data);
          
          process.exit(0);
        } catch (error) {
          console.error('❌ Test failed:', error.message);
          process.exit(1);
        }
      };
      
      // Wait a bit for server to start, then test
      setTimeout(testPickup, 1000);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPickupNoAuth();
