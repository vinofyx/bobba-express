/**
 * Database Reset Script for BobbaExpress
 * 
 * This script clears all data from the database
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('../../models/User');
const Customer = require('../../models/customer.model');
const Pickup = require('../../models/pickup.model');
const Parcel = require('../../models/parcel.model');
const Shipment = require('../../models/shipment.model');
const TrackingLog = require('../../models/tracking.model');

const resetDatabase = async () => {
  try {
    console.log('🗑️  Starting database reset...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bobbaexpress');
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    console.log('🧹 Clearing all collections...');
    
    const collections = [
      { name: 'Users', model: User },
      { name: 'Customers', model: Customer },
      { name: 'Pickups', model: Pickup },
      { name: 'Parcels', model: Parcel },
      { name: 'Shipments', model: Shipment },
      { name: 'Tracking Logs', model: TrackingLog }
    ];

    for (const collection of collections) {
      const result = await collection.model.deleteMany({});
      console.log(`   ✅ Cleared ${collection.name}: ${result.deletedCount} documents`);
    }

    console.log('\n🎉 Database reset completed successfully!');
    console.log('📊 All collections have been cleared.');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the reset script
if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;
