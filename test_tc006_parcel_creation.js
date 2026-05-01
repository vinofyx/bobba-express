/**
 * Test Case TC-006: Parcel Auto-Creation Functionality
 * 
 * This script tests the complete parcel creation workflow including:
 * - Auto-creation on pickup completion
 * - Manual parcel creation
 * - Tracking ID generation and uniqueness
 * - Sender/receiver information population
 * - Label generation
 * - Validation and error handling
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:8080';

// Test data
const VALID_PARCEL = {
  pickupId: null, // Will be set dynamically
  weight: 2.5,
  dimensions: {
    length: 20,
    width: 15,
    height: 10
  },
  type: 'parcel',
  codAmount: 0,
  receiver: {
    name: 'John Receiver',
    phone: '01234567890',
    address: {
      line1: '123 Receiver Street',
      line2: 'Apartment 456',
      city: 'Kuala Lumpur',
      state: 'Kuala Lumpur',
      pincode: '500001'
    }
  }
};

const INVALID_PARCELS = {
  duplicateTracking: {
    pickupId: null,
    weight: 1.0,
    trackingId: 'BE001234', // Will try to duplicate
    receiver: {
      name: 'Test Receiver',
      address: {
        line1: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      }
    }
  },
  noWeight: {
    pickupId: null,
    weight: 0,
    receiver: {
      name: 'Test Receiver',
      address: {
        line1: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      }
    }
  },
  incompleteReceiver: {
    pickupId: null,
    weight: 1.0,
    receiver: {
      name: 'Test Receiver',
      address: {
        line1: 'Test Address',
        // Missing city, state, pincode
      }
    }
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

// Helper function to get pickups
const getPickups = async (token, status = 'Picked') => {
  try {
    const response = await axios.get(`${BASE_URL}/pickups?status=${status}`, {
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

// Helper function to create parcel manually
const createParcel = async (parcelData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/parcels`, parcelData, {
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

// Helper function to update parcel
const updateParcel = async (parcelId, updateData, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/parcels/${parcelId}`, updateData, {
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

// Helper function to generate label
const generateLabel = async (parcelId, token) => {
  try {
    const response = await axios.get(`${BASE_URL}/parcels/${parcelId}/label`, {
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

// Test 1: Auto-creation on pickup completion
const testAutoCreationOnPickupCompletion = async () => {
  logSection('TC-006: Auto-Creation on Pickup Completion');
  
  // Login as agent
  const agentToken = await getAuthToken('agent@bobba.com', 'Agent@1234');
  if (!agentToken) {
    logResult('Agent login', false);
    return null;
  }
  logResult('Agent login', true);
  
  // Get assigned pickups
  const pickupsResult = await getPickups(agentToken, 'Assigned');
  if (!pickupsResult.success) {
    logResult('Get assigned pickups', false);
    return null;
  }
  
  const { pickups } = pickupsResult.data.data;
  if (pickups.length === 0) {
    logResult('No assigned pickups available', false);
    return null;
  }
  
  const testPickup = pickups[0];
  log(`📦 Using pickup: ${testPickup.pickupId} (${testPickup._id})`, 'cyan');
  
  // Complete pickup to trigger auto-creation
  const completionData = {
    photoUrl: 'https://example.com/photo-proof.jpg',
    actualCount: 3,
    completionNotes: 'All items collected',
    location: 'Kuala Lumpur, Malaysia',
    gps: { lat: 3.1390, lng: 101.6869 }
  };
  
  const completionResult = await axios.put(`${BASE_URL}/pickups/${testPickup._id}/complete`, completionData, {
    headers: { 'Authorization': `Bearer ${agentToken}` }
  });
  
  if (completionResult.data.success) {
    logResult('Pickup completion', true);
    
    const { createdParcels } = completionResult.data.data;
    if (createdParcels && createdParcels.length > 0) {
      logResult('Auto-created parcels', true, `${createdParcels.length} parcels created`);
      
      // Verify parcel details
      createdParcels.forEach((parcel, index) => {
        log(`📦 Parcel ${index + 1}: ${parcel.trackingId}`, 'cyan');
        
        // Check tracking ID format
        if (parcel.trackingId && parcel.trackingId.startsWith('BE')) {
          logResult(`Tracking ID format`, true);
        } else {
          logResult(`Tracking ID format`, false);
        }
        
        // Check link to pickup
        if (parcel.pickupId === testPickup._id) {
          logResult(`Linked to pickup`, true);
        } else {
          logResult(`Linked to pickup`, false);
        }
        
        // Check link to customer
        if (parcel.customer === testPickup.customer._id) {
          logResult(`Linked to customer`, true);
        } else {
          logResult(`Linked to customer`, false);
        }
        
        // Check status
        if (parcel.status === 'At Warehouse') {
          logResult(`Status: At Warehouse`, true);
        } else {
          logResult(`Status`, false, `Expected At Warehouse, got ${parcel.status}`);
        }
        
        // Check sender information
        if (parcel.sender && parcel.sender.name === testPickup.customer.name) {
          logResult(`Sender info populated`, true);
        } else {
          logResult(`Sender info`, false);
        }
      });
      
      return createdParcels;
    } else {
      logResult('Auto-created parcels', false, 'No parcels created');
    }
  } else {
    logResult('Pickup completion', false, completionResult.data.message);
  }
  
  return null;
};

// Test 2: Manual parcel creation
const testManualParcelCreation = async (adminToken) => {
  logSection('TC-006: Manual Parcel Creation');
  
  // Get a pickup for manual parcel creation
  const pickupsResult = await getPickups(adminToken, 'Picked');
  if (!pickupsResult.success) {
    logResult('Get pickups for manual creation', false);
    return null;
  }
  
  const { pickups } = pickupsResult.data.data;
  if (pickups.length === 0) {
    logResult('No pickups available for manual creation', false);
    return null;
  }
  
  const testPickup = pickups[0];
  VALID_PARCEL.pickupId = testPickup._id;
  
  log(`📦 Creating parcel for pickup: ${testPickup.pickupId}`, 'cyan');
  
  const result = await createParcel(VALID_PARCEL, adminToken);
  
  if (result.success) {
    logResult('Manual parcel creation', true);
    
    const { parcel } = result.data.data;
    
    // Check tracking ID uniqueness
    if (parcel.trackingId && parcel.trackingId.startsWith('BE')) {
      logResult('Tracking ID generated', true);
      log(`🆔 Tracking ID: ${parcel.trackingId}`, 'cyan');
    } else {
      logResult('Tracking ID generation', false);
    }
    
    // Check barcode generation
    if (parcel.barcode) {
      logResult('Barcode generated', true);
    } else {
      logResult('Barcode generation', false);
    }
    
    // Check sender info populated
    if (parcel.sender && parcel.sender.name) {
      logResult('Sender info populated', true);
      log(`📤 Sender: ${parcel.sender.name}`, 'cyan');
    } else {
      logResult('Sender info', false);
    }
    
    // Check receiver info
    if (parcel.receiver && parcel.receiver.name === VALID_PARCEL.receiver.name) {
      logResult('Receiver info saved', true);
      log(`📥 Receiver: ${parcel.receiver.name}`, 'cyan');
    } else {
      logResult('Receiver info', false);
    }
    
    return parcel;
  } else {
    logResult('Manual parcel creation', false, result.error.message);
    return null;
  }
};

// Test 3: Parcels appear in table
const testParcelsInTable = async (adminToken) => {
  logSection('TC-006: Parcels Appear in Table');
  
  const parcelsResult = await getParcels(adminToken, 'At Warehouse');
  
  if (parcelsResult.success) {
    const { parcels } = parcelsResult.data.data;
    logResult('Get parcels from table', true, `Found ${parcels.length} parcels`);
    
    if (parcels.length > 0) {
      // Check if parcels have required fields
      const testParcel = parcels[0];
      
      if (testParcel.trackingId) {
        logResult('Tracking ID in table', true);
      } else {
        logResult('Tracking ID in table', false);
      }
      
      if (testParcel.sender && testParcel.sender.name) {
        logResult('Sender info in table', true);
      } else {
        logResult('Sender info in table', false);
      }
      
      if (testParcel.weight && testParcel.weight > 0) {
        logResult('Weight in table', true);
      } else {
        logResult('Weight in table', false);
      }
      
      if (testParcel.status === 'At Warehouse') {
        logResult('Status in table', true);
      } else {
        logResult('Status in table', false);
      }
    }
  } else {
    logResult('Get parcels from table', false, parcelsResult.error.message);
  }
};

// Test 4: Label generation
const testLabelGeneration = async (parcel, adminToken) => {
  logSection('TC-006: Label Generation');
  
  if (!parcel) {
    logResult('No parcel available for label test', false);
    return;
  }
  
  const result = await generateLabel(parcel._id, adminToken);
  
  if (result.success) {
    logResult('Label generation', true);
    
    const { label } = result.data.data;
    
    // Check label data
    if (label.trackingId) {
      logResult('Label has tracking ID', true);
    } else {
      logResult('Label tracking ID', false);
    }
    
    if (label.barcode) {
      logResult('Label has barcode', true);
    } else {
      logResult('Label barcode', false);
    }
    
    if (label.sender && label.sender.name) {
      logResult('Label has sender info', true);
    } else {
      logResult('Label sender info', false);
    }
    
    if (label.receiver && label.receiver.name) {
      logResult('Label has receiver info', true);
    } else {
      logResult('Label receiver info', false);
    }
    
    if (label.weight) {
      logResult('Label has weight', true);
    } else {
      logResult('Label weight', false);
    }
    
    log('📄 Label data ready for PDF generation', 'cyan');
  } else {
    logResult('Label generation', false, result.error.message);
  }
};

// Test 5: Duplicate tracking number (TC-006a)
const testDuplicateTrackingNumber = async (adminToken) => {
  logSection('TC-006a: Duplicate Tracking Number');
  
  // Get a pickup for testing
  const pickupsResult = await getPickups(adminToken, 'Picked');
  if (!pickupsResult.success || pickupsResult.data.data.parcels.length === 0) {
    logResult('No pickups available for duplicate test', false);
    return;
  }
  
  const testPickup = pickupsResult.data.data.parcels[0];
  INVALID_PARCELS.duplicateTracking.pickupId = testPickup._id;
  
  // Create first parcel
  const result1 = await createParcel(INVALID_PARCELS.duplicateTracking, adminToken);
  if (!result1.success) {
    logResult('First parcel creation', false);
    return;
  }
  
  const firstTrackingId = result1.data.data.parcel.trackingId;
  
  // Try to create second parcel with same tracking ID
  const result2 = await createParcel(INVALID_PARCELS.duplicateTracking, adminToken);
  
  if (result2.success) {
    const secondTrackingId = result2.data.data.parcel.trackingId;
    
    if (secondTrackingId !== firstTrackingId) {
      logResult('Duplicate tracking ID regenerated', true);
      log(`🆔 Original: ${firstTrackingId}, Regenerated: ${secondTrackingId}`, 'cyan');
    } else {
      logResult('Duplicate tracking ID handling', false, 'Same ID allowed');
    }
  } else {
    logResult('Duplicate tracking ID handling', false, result2.error.message);
  }
};

// Test 6: Weight validation (TC-006b)
const testWeightValidation = async (adminToken) => {
  logSection('TC-006b: Weight Validation');
  
  // Get a pickup for testing
  const pickupsResult = await getPickups(adminToken, 'Picked');
  if (!pickupsResult.success || pickupsResult.data.data.parcels.length === 0) {
    logResult('No pickups available for weight test', false);
    return;
  }
  
  const testPickup = pickupsResult.data.data.parcels[0];
  INVALID_PARCELS.noWeight.pickupId = testPickup._id;
  
  const result = await createParcel(INVALID_PARCELS.noWeight, adminToken);
  
  if (!result.success && result.status === 400) {
    logResult('Zero weight rejected', true);
    
    if (result.error.message && result.error.message.includes('Weight must be greater than 0')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Weight validation', false);
  }
};

// Test 7: Receiver address validation (TC-006c)
const testReceiverAddressValidation = async (adminToken) => {
  logSection('TC-006c: Receiver Address Validation');
  
  // Get a pickup for testing
  const pickupsResult = await getPickups(adminToken, 'Picked');
  if (!pickupsResult.success || pickupsResult.data.data.parcels.length === 0) {
    logResult('No pickups available for receiver test', false);
    return;
  }
  
  const testPickup = pickupsResult.data.data.parcels[0];
  INVALID_PARCELS.incompleteReceiver.pickupId = testPickup._id;
  
  const result = await createParcel(INVALID_PARCELS.incompleteReceiver, adminToken);
  
  if (!result.success && result.status === 400) {
    logResult('Incomplete receiver address rejected', true);
    
    if (result.error.message && result.error.message.includes('Receiver information is incomplete')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Receiver address validation', false);
  }
};

// Main test runner
const runAllTests = async () => {
  log('🧪 BobbaExpress - TC-006 Parcel Creation Test Suite', 'blue');
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
  
  // Get admin token for manual tests
  const adminToken = await getAuthToken('admin@bobba.com', 'Admin@1234');
  if (!adminToken) {
    log('❌ Cannot proceed without admin authentication', 'red');
    return;
  }
  log('✅ Admin authentication successful', 'green');
  
  let autoCreatedParcels = null;
  let manuallyCreatedParcel = null;
  
  // Run all test cases
  autoCreatedParcels = await testAutoCreationOnPickupCompletion();
  manuallyCreatedParcel = await testManualParcelCreation(adminToken);
  
  await testParcelsInTable(adminToken);
  
  if (manuallyCreatedParcel) {
    await testLabelGeneration(manuallyCreatedParcel, adminToken);
  }
  
  await testDuplicateTrackingNumber(adminToken);
  await testWeightValidation(adminToken);
  await testReceiverAddressValidation(adminToken);
  
  // Final summary
  logSection('Test Summary');
  log('🎉 TC-006 Parcel Creation Testing Complete!', 'blue');
  log('📊 Review the results above for any failed tests.', 'yellow');
  log('🔐 All validation and auto-creation features should be working.', 'yellow');
  
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Open browser and navigate to:', CLIENT_URL);
  console.log('2. Login with admin@bobba.com / Admin@1234');
  console.log('3. Navigate to Parcels page');
  console.log('4. Click [+ Add Parcel] for manual creation');
  console.log('5. Fill form with pickup, weight, and receiver details');
  console.log('6. Verify tracking ID generation (BE001234 format)');
  console.log('7. Check sender info auto-populated from customer');
  console.log('8. Verify parcel appears in At Warehouse table');
  console.log('9. Click [Print Label] to test PDF generation');
  console.log('10. Test negative cases manually in the UI');
};

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  createParcel,
  getParcels,
  updateParcel,
  generateLabel,
  getAuthToken
};
