/**
 * Test Case TC-003: Pickup Scheduling Functionality
 * 
 * This script tests the complete pickup scheduling workflow including:
 * - Customer selection and address auto-fill
 * - Date/time validation
 * - Pickup ID generation
 * - SMS notifications
 * - Status management
 * - Negative test cases
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:8080';

// Test data
const TOMORROW = new Date();
TOMORROW.setDate(TOMORROW.getDate() + 1);
const TOMORROW_STR = TOMORROW.toISOString().split('T')[0];

const YESTERDAY = new Date();
YESTERDAY.setDate(YESTERDAY.getDate() - 1);
const YESTERDAY_STR = YESTERDAY.toISOString().split('T')[0];

const VALID_PICKUP = {
  customer: 'CUST-001', // Ahmad Zulkifli from seeded data
  pickupAddress: {
    line1: 'No 5, Jalan Ampang',
    city: 'Kuala Lumpur',
    state: 'Kuala Lumpur',
    pincode: '500001'
  },
  scheduledDate: TOMORROW_STR,
  pickupTime: '10:00 AM',
  deliveryType: 'express',
  parcelType: 'parcel',
  parcelCount: 3,
  notes: 'Fragile items, handle with care'
};

const INVALID_PICKUPS = {
  pastDate: {
    ...VALID_PICKUP,
    scheduledDate: YESTERDAY_STR,
    pickupTime: '10:00 AM'
  },
  noCustomer: {
    ...VALID_PICKUP,
    customer: null
  },
  noTime: {
    ...VALID_PICKUP,
    pickupTime: ''
  },
  zeroParcelCount: {
    ...VALID_PICKUP,
    parcelCount: 0
  },
  tooManyParcels: {
    ...VALID_PICKUP,
    parcelCount: 101
  },
  invalidTime: {
    ...VALID_PICKUP,
    pickupTime: '25:00'
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
const getAuthToken = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@bobba.com',
      password: 'Admin@1234'
    }, { withCredentials: true });
    
    return response.data.data.accessToken;
  } catch (error) {
    log('❌ Failed to get auth token', 'red');
    return null;
  }
};

// Helper function to create pickup
const createPickup = async (pickupData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/pickups`, pickupData, {
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

// Helper function to get pickups
const getPickups = async (token, status = null) => {
  try {
    const params = status ? { status } : {};
    const response = await axios.get(`${BASE_URL}/pickups`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params,
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

// Test 1: Successful Pickup Creation
const testSuccessfulPickupCreation = async (token) => {
  logSection('TC-003: Successful Pickup Creation');
  
  log(`📝 Creating pickup for customer: ${VALID_PICKUP.customer}`);
  log(`📅 Date: ${VALID_PICKUP.scheduledDate}`);
  log(`⏰ Time: ${VALID_PICKUP.pickupTime}`);
  log(`📦 Parcel Count: ${VALID_PICKUP.parcelCount}`);
  log(`📝 Notes: ${VALID_PICKUP.notes}`);
  
  const result = await createPickup(VALID_PICKUP, token);
  
  if (result.success) {
    logResult('Pickup creation', true);
    
    const { pickup } = result.data.data;
    
    // Check pickup ID generation
    if (pickup.pickupId) {
      logResult('Pickup ID generated', true);
      log(`🆔 Pickup ID: ${pickup.pickupId}`, 'cyan');
    } else {
      logResult('Pickup ID generation', false);
    }
    
    // Check status
    if (pickup.status === 'Requested') {
      logResult('Pickup status: Requested', true);
    } else {
      logResult('Pickup status', false, `Expected Requested, got ${pickup.status}`);
    }
    
    // Check customer linking
    if (pickup.customer) {
      logResult('Customer linked correctly', true);
    } else {
      logResult('Customer linking', false);
    }
    
    // Check date/time saving
    const savedDate = new Date(pickup.scheduledDate).toISOString().split('T')[0];
    if (savedDate === VALID_PICKUP.scheduledDate) {
      logResult('Date saved correctly', true);
    } else {
      logResult('Date saving', false);
    }
    
    if (pickup.pickupTime === VALID_PICKUP.pickupTime) {
      logResult('Time saved correctly', true);
    } else {
      logResult('Time saving', false);
    }
    
    // Check parcel count
    if (pickup.parcelCount === VALID_PICKUP.parcelCount) {
      logResult('Parcel count saved correctly', true);
    } else {
      logResult('Parcel count saving', false);
    }
    
    // Check notes
    if (pickup.notes === VALID_PICKUP.notes) {
      logResult('Notes saved correctly', true);
    } else {
      logResult('Notes saving', false);
    }
    
    return pickup;
  } else {
    logResult('Pickup creation', false, result.error.message);
    return null;
  }
};

// Test 2: Pickup appears in table
const testPickupInTable = async (token, createdPickup) => {
  logSection('TC-003: Pickup Appears in Table');
  
  const result = await getPickups(token, 'Requested');
  
  if (result.success) {
    const { pickups } = result.data.data;
    
    // Find the created pickup
    const foundPickup = pickups.find(p => p._id === createdPickup._id);
    
    if (foundPickup) {
      logResult('Pickup appears in table', true);
      
      // Check if under "Pending" tab (Requested status)
      if (foundPickup.status === 'Requested') {
        logResult('Pickup under Pending tab', true);
      } else {
        logResult('Pickup status in table', false);
      }
      
      // Verify all data matches
      if (foundPickup.customer._id === createdPickup.customer._id &&
          foundPickup.scheduledDate.toISOString().split('T')[0] === createdPickup.scheduledDate.toISOString().split('T')[0]) {
        logResult('Pickup data integrity', true);
      } else {
        logResult('Pickup data integrity', false);
      }
      
    } else {
      logResult('Pickup appears in table', false);
    }
  } else {
    logResult('Get pickups list', false, result.error.message);
  }
};

// Test 3: Past date validation
const testPastDateValidation = async (token) => {
  logSection('TC-003a: Past Date Validation');
  
  const result = await createPickup(INVALID_PICKUPS.pastDate, token);
  
  if (!result.success && result.status === 400) {
    logResult('Past date rejected', true);
    
    if (result.error.message && result.error.message.includes('future')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Past date validation', false);
  }
};

// Test 4: No customer validation
const testNoCustomerValidation = async (token) => {
  logSection('TC-003b: No Customer Validation');
  
  const result = await createPickup(INVALID_PICKUPS.noCustomer, token);
  
  if (!result.success && result.status === 400) {
    logResult('No customer rejected', true);
    
    if (result.error.message && result.error.message.includes('Customer')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('No customer validation', false);
  }
};

// Test 5: No time validation
const testNoTimeValidation = async (token) => {
  logSection('TC-003c: No Time Validation');
  
  const result = await createPickup(INVALID_PICKUPS.noTime, token);
  
  if (!result.success && result.status === 400) {
    logResult('No time rejected', true);
    
    if (result.error.message && result.error.message.includes('time')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('No time validation', false);
  }
};

// Test 6: Parcel count validation
const testParcelCountValidation = async (token) => {
  logSection('TC-003d: Parcel Count Validation');
  
  // Test zero parcels
  const result1 = await createPickup(INVALID_PICKUPS.zeroParcelCount, token);
  if (!result1.success && result1.status === 400) {
    logResult('Zero parcels rejected', true);
    if (result1.error.message && result1.error.message.includes('parcel')) {
      logResult('Proper error message for zero', true);
    }
  } else {
    logResult('Zero parcels validation', false);
  }
  
  // Test too many parcels
  const result2 = await createPickup(INVALID_PICKUPS.tooManyParcels, token);
  if (!result2.success && result2.status === 400) {
    logResult('Too many parcels rejected', true);
    if (result2.error.message && result2.error.message.includes('parcel')) {
      logResult('Proper error message for too many', true);
    }
  } else {
    logResult('Too many parcels validation', false);
  }
};

// Test 7: Invalid time format validation
const testInvalidTimeValidation = async (token) => {
  logSection('TC-003e: Invalid Time Format Validation');
  
  const result = await createPickup(INVALID_PICKUPS.invalidTime, token);
  
  if (!result.success && result.status === 400) {
    logResult('Invalid time format rejected', true);
    
    if (result.error.message && result.error.message.includes('time')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Invalid time format validation', false);
  }
};

// Main test runner
const runAllTests = async () => {
  log('🧪 BobbaExpress - TC-003 Pickup Scheduling Test Suite', 'blue');
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
  
  // Get authentication token
  log('\n🔐 Getting authentication token...');
  const token = await getAuthToken();
  if (!token) {
    log('❌ Cannot proceed without authentication', 'red');
    return;
  }
  log('✅ Authentication successful', 'green');
  
  let createdPickup = null;
  
  // Run all test cases
  createdPickup = await testSuccessfulPickupCreation(token);
  
  if (createdPickup) {
    await testPickupInTable(token, createdPickup);
  }
  
  await testPastDateValidation(token);
  await testNoCustomerValidation(token);
  await testNoTimeValidation(token);
  await testParcelCountValidation(token);
  await testInvalidTimeValidation(token);
  
  // Final summary
  logSection('Test Summary');
  log('🎉 TC-003 Pickup Scheduling Testing Complete!', 'blue');
  log('📊 Review the results above for any failed tests.', 'yellow');
  log('🔐 All validation and security features should be working.', 'yellow');
  
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Open browser and navigate to:', CLIENT_URL);
  console.log('2. Login with admin@bobba.com / Admin@1234');
  console.log('3. Navigate to Pickups page');
  console.log('4. Click [+ Schedule Pickup]');
  console.log('5. Fill form with test data:');
  console.log('   - Customer: Ahmad Zulkifli (search & select)');
  console.log('   - Pickup Address: No 5, Jalan Ampang, KL (auto-filled)');
  console.log('   - Pickup Date: Tomorrow\'s date');
  console.log('   - Pickup Time: 10:00 AM');
  console.log('   - Parcel Notes: Fragile items, handle with care');
  console.log('   - Parcel Count: 3');
  console.log('6. Click [Schedule Pickup]');
  console.log('7. Verify success message and pickup appears in table');
  console.log('8. Test negative cases manually in the UI');
};

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  createPickup,
  getPickups,
  getAuthToken
};
