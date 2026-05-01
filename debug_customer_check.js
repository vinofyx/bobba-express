const mongoose = require('mongoose');
const Customer = require('./server/models/customer.model');
const Pickup = require('./server/models/pickup.model');

async function debugCustomerCheck() {
  try {
    await mongoose.connect('mongodb://localhost:27017/bobbaexpress');
    console.log('✅ Connected to MongoDB');
    
    // Check customers
    const customers = await Customer.find({});
    console.log('📋 Customers found:', customers.length);
    customers.forEach(c => {
      console.log(`  - ${c.customerId}: ${c.name} (${c._id})`);
    });
    
    // Check if CUST-001 exists
    const customer = await Customer.findOne({ customerId: 'CUST-001' });
    if (customer) {
      console.log('✅ Customer CUST-001 found:', customer.name);
      console.log('   ID:', customer._id);
    } else {
      console.log('❌ Customer CUST-001 not found');
    }
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCustomerCheck();
