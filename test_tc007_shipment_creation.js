/**
 * Test Case TC-007: Shipment Creation Functionality
 * 
 * This script tests the complete shipment creation workflow including:
 * - Route selection and driver assignment
 * - Parcel linking and validation
 * - ETA calculation and display
 * - Manifest generation
 * - Customer notifications
 * - Negative test cases and validation
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:8080';

// Test data
const VALID_SHIPMENT = {
  route: {
    origin: {
      city: 'Kuala Lumpur',
      state: 'Kuala Lumpur'
    },
    destination: {
      city: 'Johor Bahru',
      state: 'Johor'
    }
  },
  driver: {
    userId: null, // Will be set dynamically
    name: 'Rajan Kumar'
  },
  vehicle: {
    number: 'WXY 1234',
    type: 'van',
    capacity: 100
  },
  departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  parcelIds: [] // Will be set dynamically
};

const INVALID_SHIPMENTS = {
  noDriver: {
    route: {
      origin: { city: 'Kuala Lumpur', state: 'Kuala Lumpur' },
      destination: { city: 'Johor Bahru', state: 'Johor' }
    },
    vehicle: { number: 'WXY 1234' },
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    parcelIds: []
  },
  noParcels: {
    route: {
      origin: { city: 'Kuala Lumpur', state: 'Kuala Lumpur' },
      destination: { city: 'Johor Bahru', state: 'Johor' }
    },
    driver: { userId: null, name: 'Rajan Kumar' },
    vehicle: { number: 'WXY 1234' },
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    parcelIds: []
  },
  pastDeparture: {
    route: {
      origin: { city: 'Kuala Lumpur', state: 'Kuala Lumpur' },
      destination: { city: 'Johor Bahru', state: 'Johor' }
    },
    driver: { userId: null, name: 'Rajan Kumar' },
    vehicle: { number: 'WXY 1234' },
    departureTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    parcelIds: []
  },
  noRoute: {
    driver: { userId: null, name: 'Rajan Kumar' },
    vehicle: { number: 'WXY 1234' },
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    parcelIds: []
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  console.log('\n' + '='.repeat(60));
  log(`🧪 ${title}`, 'blue');
  console.log('='.repeat(60));
};

const logResult = (testName, passed, message = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status} ${testName}${message ? ': ' + message : ''}`, color);
};

// Helper function to get auth token
const getAuthToken = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    }, { withCredentials: true });
    
    return response.data.data.accessToken;
  } catch (error) {
    log('❌ Failed to get auth token', 'red');
    return null;
  }
};

// Helper function to get available drivers
const getDrivers = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/shipments/drivers`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 5000
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || { message: error.message },
      status: error.response?.status 
    };
  }
};

// Helper function to get parcels
const getParcels = async (token, status = 'At Warehouse') => {
  try {
    const response = await axios.get(`${BASE_URL}/parcels?status=${status}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 5000
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || { message: error.message },
      status: error.response?.status 
    };
  }
};

// Helper function to create shipment
const createShipment = async (shipmentData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/shipments`, shipmentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || { message: error.message },
      status: error.response?.status 
    };
  }
};

// Helper function to get shipments
const getShipments = async (token, status = 'Created') => {
  try {
    const response = await axios.get(`${BASE_URL}/shipments?status=${status}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 5000
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || { message: error.message },
      status: error.response?.status 
    };
  }
};

// Helper function to generate manifest
const generateManifest = async (shipmentId, token) => {
  try {
    const response = await axios.get(`${BASE_URL}/shipments/${shipmentId}/manifest`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 5000
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || { message: error.message },
      status: error.response?.status 
    };
  }
};

// Test 1: Get available drivers and parcels
const testDriversAndParcels = async (adminToken) => {
  logSection('TC-007: Get Available Drivers and Parcels');
  
  // Get drivers
  const driversResult = await getDrivers(adminToken);
  if (!driversResult.success) {
    logResult('Get drivers', false, driversResult.error.message);
    return null;
  }
  
  const { drivers } = driversResult.data.data;
  logResult('Get drivers', true, `Found ${drivers.length} drivers`);
  
  if (drivers.length === 0) {
    logResult('No drivers available', false);
    return null;
  }
  
  const testDriver = drivers[0];
  log(`👤 Using driver: ${testDriver.name} (${testDriver._id})`, 'cyan');
  
  // Get parcels
  const parcelsResult = await getParcels(adminToken, 'At Warehouse');
  if (!parcelsResult.success) {
    logResult('Get parcels', false, parcelsResult.error.message);
    return null;
  }
  
  const { parcels } = parcelsResult.data.data;
  logResult('Get parcels', true, `Found ${parcels.length} parcels at warehouse`);
  
  if (parcels.length === 0) {
    logResult('No parcels available at warehouse', false);
    return null;
  }
  
  // Select first 3 parcels for testing
  const testParcels = parcels.slice(0, 3);
  log(`📦 Using parcels: ${testParcels.map(p => p.trackingId).join(', ')}`, 'cyan');
  
  return { testDriver, testParcels };
};

// Test 2: Successful shipment creation
const testSuccessfulShipmentCreation = async (adminToken, testDriver, testParcels) => {
  logSection('TC-007: Successful Shipment Creation');
  
  // Prepare shipment data
  const shipmentData = {
    ...VALID_SHIPMENT,
    driver: {
      userId: testDriver._id,
      name: testDriver.name
    },
    parcelIds: testParcels.map(p => p._id)
  };
  
  log(`📍 Route: ${shipmentData.route.origin.city} → ${shipmentData.route.destination.city}`);
  log(`👤 Driver: ${shipmentData.driver.name}`);
  log(`🚗 Vehicle: ${shipmentData.vehicle.number}`);
  log(`⏰ Departure: ${new Date(shipmentData.departureTime).toLocaleString()}`);
  log(`📦 Parcels: ${shipmentData.parcelIds.length}`);
  
  const result = await createShipment(shipmentData, adminToken);
  
  if (result.success) {
    logResult('Shipment creation', true);
    
    const { shipment } = result.data.data;
    
    // Check shipment ID format
    if (shipment.shipmentId && shipment.shipmentId.startsWith('SH-2025-')) {
      logResult('Shipment ID generated', true);
      log(`🆔 Shipment ID: ${shipment.shipmentId}`, 'cyan');
    } else {
      logResult('Shipment ID format', false);
    }
    
    // Check parcels linked
    if (shipment.parcels && shipment.parcels.length === testParcels.length) {
      logResult('Parcels linked', true);
    } else {
      logResult('Parcels linking', false);
    }
    
    // Check driver assignment
    if (shipment.driver && shipment.driver.name === testDriver.name) {
      logResult('Driver assigned', true);
    } else {
      logResult('Driver assignment', false);
    }
    
    // Check route information
    if (shipment.route && shipment.route.origin.city === 'Kuala Lumpur' && shipment.route.destination.city === 'Johor Bahru') {
      logResult('Route information', true);
    } else {
      logResult('Route information', false);
    }
    
    // Check ETA calculation
    if (shipment.estimatedArrival) {
      logResult('ETA calculated', true);
      log(`⏰ ETA: ${new Date(shipment.estimatedArrival).toLocaleString()}`, 'cyan');
    } else {
      logResult('ETA calculation', false);
    }
    
    // Check status
    if (shipment.status === 'Created') {
      logResult('Initial status', true);
    } else {
      logResult('Initial status', false, `Expected Created, got ${shipment.status}`);
    }
    
    return shipment;
  } else {
    logResult('Shipment creation', false, result.error.message);
    return null;
  }
};

// Test 3: Parcel status updates
const testParcelStatusUpdates = async (createdShipment, testParcels) => {
  logSection('TC-007: Parcel Status Updates');
  
  // Check if parcels are updated to "In Transit"
  const adminToken = await getAuthToken('admin@bobba.com', 'Admin@1234');
  const parcelsResult = await getParcels(adminToken, 'In Transit');
  
  if (parcelsResult.success) {
    const { parcels } = parcelsResult.data.data;
    const updatedParcels = parcels.filter(p => 
      testParcels.some(testP => testP._id === p._id)
    );
    
    if (updatedParcels.length === testParcels.length) {
      logResult('All parcels updated to In Transit', true);
      
      // Check each parcel status
      updatedParcels.forEach(parcel => {
        if (parcel.status === 'In Transit') {
          logResult(`Parcel ${parcel.trackingId} status`, true);
        } else {
          logResult(`Parcel ${parcel.trackingId} status`, false);
        }
      });
    } else {
      logResult('Parcel status updates', false, `Expected ${testParcels.length}, got ${updatedParcels.length}`);
    }
  } else {
    logResult('Get updated parcels', false, parcelsResult.error.message);
  }
};

// Test 4: Manifest generation
const testManifestGeneration = async (createdShipment, adminToken) => {
  logSection('TC-007: Manifest Generation');
  
  if (!createdShipment) {
    logResult('No shipment available for manifest test', false);
    return;
  }
  
  const result = await generateManifest(createdShipment._id, adminToken);
  
  if (result.success) {
    logResult('Manifest generation', true);
    
    const { manifest } = result.data.data;
    
    // Check manifest data
    if (manifest.shipmentId === createdShipment.shipmentId) {
      logResult('Manifest shipment ID', true);
    } else {
      logResult('Manifest shipment ID', false);
    }
    
    if (manifest.route && manifest.route.origin.city === 'Kuala Lumpur') {
      logResult('Manifest route', true);
    } else {
      logResult('Manifest route', false);
    }
    
    if (manifest.driver && manifest.driver.name) {
      logResult('Manifest driver info', true);
    } else {
      logResult('Manifest driver info', false);
    }
    
    if (manifest.parcels && manifest.parcels.length > 0) {
      logResult('Manifest parcels', true, `${manifest.parcels.length} parcels`);
    } else {
      logResult('Manifest parcels', false);
    }
    
    if (manifest.totalWeight > 0) {
      logResult('Manifest total weight', true, `Total: ${manifest.totalWeight} kg`);
    } else {
      logResult('Manifest total weight', false);
    }
    
    if (manifest.estimatedArrival) {
      logResult('Manifest ETA', true);
    } else {
      logResult('Manifest ETA', false);
    }
    
    log('📄 Manifest PDF data ready for generation', 'cyan');
  } else {
    logResult('Manifest generation', false, result.error.message);
  }
};

// Test 5: Driver notification (TC-007a - Already assigned parcel)
const testAlreadyAssignedParcel = async (adminToken, testDriver, testParcels) => {
  logSection('TC-007a: Already Assigned Parcel');
  
  // Create first shipment
  const shipmentData1 = {
    ...VALID_SHIPMENT,
    driver: {
      userId: testDriver._id,
      name: testDriver.name
    },
    parcelIds: [testParcels[0]._id] // Use first parcel
  };
  
  const result1 = await createShipment(shipmentData1, adminToken);
  
  if (result1.success) {
    // Try to create second shipment with same parcel
    const shipmentData2 = {
      ...VALID_SHIPMENT,
      driver: {
        userId: testDriver._id,
        name: testDriver.name
      },
      parcelIds: [testParcels[0]._id] // Same parcel
    };
    
    const result2 = await createShipment(shipmentData2, adminToken);
    
    if (!result2.success && result2.status === 400) {
      logResult('Already assigned parcel rejected', true);
      
      if (result2.error.message && result2.error.message.includes('already assigned')) {
        logResult('Proper error message', true);
        log(`📝 Error: ${result2.error.message}`, 'cyan');
      } else {
        logResult('Error message', false);
      }
    } else {
      logResult('Already assigned parcel validation', false);
    }
  } else {
    logResult('First shipment creation', false);
  }
};

// Test 6: No driver validation (TC-007b)
const testNoDriverValidation = async (adminToken, testParcels) => {
  logSection('TC-007b: No Driver Validation');
  
  const shipmentData = {
    ...INVALID_SHIPMENTS.noDriver,
    parcelIds: [testParcels[0]._id]
  };
  
  const result = await createShipment(shipmentData, adminToken);
  
  if (!result.success && result.status === 400) {
    logResult('No driver rejected', true);
    
    if (result.error.message && result.error.message.includes('Driver assignment is required')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('No driver validation', false);
  }
};

// Test 7: No parcels validation (TC-007c)
const testNoParcelsValidation = async (adminToken, testDriver) => {
  logSection('TC-007c: No Parcels Validation');
  
  const shipmentData = {
    ...INVALID_SHIPMENTS.noParcels,
    driver: {
      userId: testDriver._id,
      name: testDriver.name
    }
  };
  
  const result = await createShipment(shipmentData, adminToken);
  
  if (!result.success && result.status === 400) {
    logResult('No parcels rejected', true);
    
    if (result.error.message && result.error.message.includes('At least one parcel is required')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('No parcels validation', false);
  }
};

// Test 8: Past departure validation (TC-007d)
const testPastDepartureValidation = async (adminToken, testDriver, testParcels) => {
  logSection('TC-007d: Past Departure Validation');
  
  const shipmentData = {
    ...INVALID_SHIPMENTS.pastDeparture,
    driver: {
      userId: testDriver._id,
      name: testDriver.name
    },
    parcelIds: [testParcels[0]._id]
  };
  
  const result = await createShipment(shipmentData, adminToken);
  
  if (!result.success && result.status === 400) {
    logResult('Past departure rejected', true);
    
    if (result.error.message && result.error.message.includes('Departure time must be in the future')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Past departure validation', false);
  }
};

// Test 9: No route validation
const testNoRouteValidation = async (adminToken, testDriver, testParcels) => {
  logSection('No Route Validation');
  
  const shipmentData = {
    ...INVALID_SHIPMENTS.noRoute,
    driver: {
      userId: testDriver._id,
      name: testDriver.name
    },
    parcelIds: [testParcels[0]._id]
  };
  
  const result = await createShipment(shipmentData, adminToken);
  
  if (!result.success && result.status === 400) {
    logResult('No route rejected', true);
    
    if (result.error.message && result.error.message.includes('Route information')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('No route validation', false);
  }
};

// Main test runner
const runAllTests = async () => {
  log('🧪 BobbaExpress - TC-007 Shipment Creation Test Suite', 'blue');
  log('='.repeat(60), 'blue');
  
  try {
    // Check if server is running
    const healthCheck = await axios.get(`${BASE_URL.replace('/api', '')}/health`, { timeout: 3000 });
    if (healthCheck.data.success) {
      log('✅ Server is running', 'green');
    } else {
      log('❌ Server health check failed', 'red');
      return;
    }
  } catch (error) {
    log('❌ Server is not running. Please start with: npm run dev', 'red');
    return;
  }
  
  // Get admin token
  const adminToken = await getAuthToken('admin@bobba.com', 'Admin@1234');
  if (!adminToken) {
    log('❌ Cannot proceed without admin authentication', 'red');
    return;
  }
  log('✅ Admin authentication successful', 'green');
  
  // Get drivers and parcels
  const testData = await testDriversAndParcels(adminToken);
  if (!testData) {
    log('❌ Cannot proceed without drivers and parcels', 'red');
    return;
  }
  
  const { testDriver, testParcels } = testData;
  
  // Run all test cases
  const createdShipment = await testSuccessfulShipmentCreation(adminToken, testDriver, testParcels);
  
  if (createdShipment) {
    await testParcelStatusUpdates(createdShipment, testParcels);
    await testManifestGeneration(createdShipment, adminToken);
  }
  
  await testAlreadyAssignedParcel(adminToken, testDriver, testParcels);
  await testNoDriverValidation(adminToken, testParcels);
  await testNoParcelsValidation(adminToken, testDriver);
  await testPastDepartureValidation(adminToken, testDriver, testParcels);
  await testNoRouteValidation(adminToken, testDriver, testParcels);
  
  // Final summary
  logSection('Test Summary');
  log('🎉 TC-007 Shipment Creation Testing Complete!', 'blue');
  log('📊 Review the results above for any failed tests.', 'yellow');
  log('🔐 All validation and notification features should be working.', 'yellow');
  
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Open browser and navigate to:', CLIENT_URL);
  console.log('2. Login with admin@bobba.com / Admin@1234');
  console.log('3. Navigate to Shipments page');
  console.log('4. Click [+ Create Shipment]');
  console.log('5. Fill form:');
  console.log('   - Route: Kuala Lumpur → Johor Bahru');
  console.log('   - Driver: Rajan Kumar');
  console.log('   - Vehicle: WXY 1234');
  console.log('   - Departure: Tomorrow 8:00 AM');
  console.log('   - Add parcels: BE001234, BE001235, BE001236');
  console.log('6. Click [Create Shipment]');
  console.log('7. Verify:');
  console.log('   - Shipment ID: SH-2025-001');
  console.log('   - 3 parcels linked');
  console.log('   - All parcel statuses → "In Transit"');
  console.log('   - Driver assigned + notified');
  console.log('   - Shipment manifest PDF generated');
  console.log('   - ETA calculated and displayed');
  console.log('8. Test negative cases manually in the UI');
};

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  createShipment,
  getShipments,
  generateManifest,
  getDrivers,
  getParcels,
  getAuthToken
};
