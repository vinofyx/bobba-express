/**
 * Test Case TC-005: Pickup Completion Functionality
 * 
 * This script tests the complete pickup completion workflow including:
 * - Agent login and pickup access
 * - Photo proof upload and validation
 * - Parcel count verification
 * - Signature capture (optional)
 * - Completion notes and GPS location
 * - Customer notifications
 * - Status updates and audit trail
 * - Negative test cases and edge cases
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:8080';

// Test data
const VALID_COMPLETION = {
  photoUrl: 'https://example.com/photo-proof.jpg',
  actualCount: 3,
  signatureUrl: 'https://example.com/signature.png',
  completionNotes: 'All items collected',
  location: 'Kuala Lumpur, Malaysia',
  gps: {
    lat: 3.1390,
    lng: 101.6869
  }
};

const INVALID_COMPLETIONS = {
  noPhoto: {
    actualCount: 3,
    completionNotes: 'All items collected'
  },
  countMismatch: {
    photoUrl: 'https://example.com/photo-proof.jpg',
    actualCount: 2, // Different from expected 3
    completionNotes: 'Only 2 items found'
  },
  noCount: {
    photoUrl: 'https://example.com/photo-proof.jpg',
    completionNotes: 'All items collected'
  },
  negativeCount: {
    photoUrl: 'https://example.com/photo-proof.jpg',
    actualCount: -1,
    completionNotes: 'Invalid count'
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

// Helper function to get assigned pickups for agent
const getAgentPickups = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/pickups?status=Assigned&onlyMine=true`, {
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

// Helper function to complete pickup
const completePickup = async (pickupId, completionData, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/pickups/${pickupId}/complete`, completionData, {
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

// Helper function to get pickup details
const getPickupById = async (pickupId, token) => {
  try {
    const response = await axios.get(`${BASE_URL}/pickups/${pickupId}`, {
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

// Test 1: Agent Login and Pickup Access
const testAgentLoginAndAccess = async () => {
  logSection('TC-005: Agent Login and Pickup Access');
  
  // Login as agent
  const agentToken = await getAuthToken('agent@bobba.com', 'Agent@1234');
  if (!agentToken) {
    logResult('Agent login', false);
    return null;
  }
  logResult('Agent login', true);
  
  // Get agent's assigned pickups
  const pickupsResult = await getAgentPickups(agentToken);
  if (!pickupsResult.success) {
    logResult('Get agent pickups', false, pickupsResult.error.message);
    return null;
  }
  
  const { pickups } = pickupsResult.data.data;
  logResult('Get agent pickups', true, `Found ${pickups.length} assigned pickups`);
  
  if (pickups.length === 0) {
    logResult('No assigned pickups available', false);
    return null;
  }
  
  const testPickup = pickups[0];
  log(`📦 Using pickup: ${testPickup.pickupId} (${testPickup._id})`, 'cyan');
  
  return { agentToken, testPickup };
};

// Test 2: Successful Pickup Completion
const testSuccessfulPickupCompletion = async (agentToken, testPickup) => {
  logSection('TC-005: Successful Pickup Completion');
  
  log(`📝 Completing pickup: ${testPickup.pickupId}`);
  log(`📸 Photo proof: ${VALID_COMPLETION.photoUrl}`);
  log(`📦 Actual count: ${VALID_COMPLETION.actualCount}`);
  log(`📝 Notes: ${VALID_COMPLETION.completionNotes}`);
  log(`📍 Location: ${VALID_COMPLETION.location}`);
  log(`🌍 GPS: ${VALID_COMPLETION.gps.lat}, ${VALID_COMPLETION.gps.lng}`);
  
  const result = await completePickup(testPickup._id, VALID_COMPLETION, agentToken);
  
  if (result.success) {
    logResult('Pickup completion', true);
    
    const { pickup: completedPickup } = result.data.data;
    
    // Check status change
    if (completedPickup.status === 'Picked') {
      logResult('Pickup status changed to Picked', true);
    } else {
      logResult('Pickup status change', false, `Expected Picked, got ${completedPickup.status}`);
    }
    
    // Check completion proof
    if (completedPickup.completionProof) {
      logResult('Completion proof saved', true);
      
      if (completedPickup.completionProof.photoUrl === VALID_COMPLETION.photoUrl) {
        logResult('Photo proof stored', true);
      } else {
        logResult('Photo proof storage', false);
      }
      
      if (completedPickup.completionProof.actualCount === VALID_COMPLETION.actualCount) {
        logResult('Actual count saved', true);
      } else {
        logResult('Actual count saving', false);
      }
      
      if (completedPickup.completionProof.completedAt) {
        logResult('Completion timestamp saved', true);
        log(`⏰ Completed at: ${completedPickup.completionProof.completedAt}`, 'cyan');
      } else {
        logResult('Completion timestamp', false);
      }
      
      if (completedPickup.completionProof.location === VALID_COMPLETION.location) {
        logResult('Location saved', true);
      } else {
        logResult('Location saving', false);
      }
      
      if (completedPickup.completionProof.gps && 
          completedPickup.completionProof.gps.lat === VALID_COMPLETION.gps.lat &&
          completedPickup.completionProof.gps.lng === VALID_COMPLETION.gps.lng) {
        logResult('GPS coordinates saved', true);
      } else {
        logResult('GPS coordinates saving', false);
      }
    } else {
      logResult('Completion proof', false);
    }
    
    // Check status history
    if (completedPickup.statusHistory && completedPickup.statusHistory.length > 0) {
      const lastHistory = completedPickup.statusHistory[completedPickup.statusHistory.length - 1];
      if (lastHistory.status === 'Picked') {
        logResult('Status history updated', true);
        log(`📝 Log entry: ${lastHistory.note}`, 'cyan');
      } else {
        logResult('Status history update', false);
      }
    } else {
      logResult('Status history', false);
    }
    
    return completedPickup;
  } else {
    logResult('Pickup completion', false, result.error.message);
    return null;
  }
};

// Test 3: Admin View Verification
const testAdminViewVerification = async (completedPickup) => {
  logSection('TC-005: Admin View Verification');
  
  // Login as admin
  const adminToken = await getAuthToken('admin@bobba.com', 'Admin@1234');
  if (!adminToken) {
    logResult('Admin login', false);
    return;
  }
  logResult('Admin login', true);
  
  // Get pickup details as admin
  const pickupResult = await getPickupById(completedPickup._id, adminToken);
  if (!pickupResult.success) {
    logResult('Get pickup as admin', false, pickupResult.error.message);
    return;
  }
  
  const { pickup: adminPickup } = pickupResult.data.data;
  
  // Verify admin can see completion details
  if (adminPickup.status === 'Picked') {
    logResult('Admin sees completed status', true);
  } else {
    logResult('Admin status view', false);
  }
  
  if (adminPickup.completionProof && adminPickup.completionProof.photoUrl) {
    logResult('Admin sees photo proof', true);
  } else {
    logResult('Admin photo proof view', false);
  }
  
  if (adminPickup.completionProof && adminPickup.completionProof.completedAt) {
    logResult('Admin sees completion timestamp', true);
  } else {
    logResult('Admin timestamp view', false);
  }
  
  log('✅ Admin view verification complete', 'green');
};

// Test 4: No Photo Validation (TC-005a)
const testNoPhotoValidation = async (agentToken) => {
  logSection('TC-005a: No Photo Validation');
  
  // Get an unassigned pickup for testing
  const adminToken = await getAuthToken('admin@bobba.com', 'Admin@1234');
  const pickupsResult = await axios.get(`${BASE_URL}/pickups?status=Assigned`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  if (pickupsResult.data.data.pickups.length === 0) {
    logResult('No pickups available for photo test', false);
    return;
  }
  
  const testPickup = pickupsResult.data.data.pickups[0];
  
  const result = await completePickup(testPickup._id, INVALID_COMPLETIONS.noPhoto, agentToken);
  
  if (!result.success && result.status === 400) {
    logResult('No photo rejected', true);
    
    if (result.error.message && result.error.message.includes('Photo proof')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('No photo validation', false);
  }
};

// Test 5: Count Mismatch Validation (TC-005b)
const testCountMismatchValidation = async (agentToken) => {
  logSection('TC-005b: Count Mismatch Validation');
  
  // Get an unassigned pickup for testing
  const adminToken = await getAuthToken('admin@bobba.com', 'Admin@1234');
  const pickupsResult = await axios.get(`${BASE_URL}/pickups?status=Assigned`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  if (pickupsResult.data.data.pickups.length === 0) {
    logResult('No pickups available for count test', false);
    return;
  }
  
  const testPickup = pickupsResult.data.data.pickups[0];
  
  const result = await completePickup(testPickup._id, INVALID_COMPLETIONS.countMismatch, agentToken);
  
  if (!result.success && result.status === 400 && result.error.warning) {
    logResult('Count mismatch warning shown', true);
    
    if (result.error.expectedCount && result.error.actualCount) {
      logResult('Count details provided', true);
      log(`⚠️ Expected: ${result.error.expectedCount}, Actual: ${result.error.actualCount}`, 'yellow');
    } else {
      logResult('Count details', false);
    }
    
    log(`📝 Warning: ${result.error.message}`, 'cyan');
  } else {
    logResult('Count mismatch validation', false);
  }
};

// Test 6: Complete Without Assignment (TC-005c)
const testCompleteWithoutAssignment = async () => {
  logSection('TC-005c: Complete Without Assignment');
  
  // Login as agent
  const agentToken = await getAuthToken('agent@bobba.com', 'Agent@1234');
  
  // Get unassigned pickup
  const adminToken = await getAuthToken('admin@bobba.com', 'Admin@1234');
  const pickupsResult = await axios.get(`${BASE_URL}/pickups?status=Requested`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  if (pickupsResult.data.data.pickups.length === 0) {
    logResult('No unassigned pickups available', false);
    return;
  }
  
  const testPickup = pickupsResult.data.data.pickups[0];
  
  const result = await completePickup(testPickup._id, VALID_COMPLETION, agentToken);
  
  if (!result.success && result.status === 400) {
    logResult('Complete without assignment rejected', true);
    
    if (result.error.message && result.error.message.includes('assigned')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Complete without assignment validation', false);
  }
};

// Test 7: Unauthorized Completion
const testUnauthorizedCompletion = async () => {
  logSection('Unauthorized Completion Test');
  
  // Get an assigned pickup
  const adminToken = await getAuthToken('admin@bobba.com', 'Admin@1234');
  const pickupsResult = await axios.get(`${BASE_URL}/pickups?status=Assigned`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  if (pickupsResult.data.data.pickups.length === 0) {
    logResult('No assigned pickups available', false);
    return;
  }
  
  const testPickup = pickupsResult.data.data.pickups[0];
  
  // Try to complete with different agent
  const otherAgentToken = await getAuthToken('driver@bobba.com', 'Driver@1234');
  const result = await completePickup(testPickup._id, VALID_COMPLETION, otherAgentToken);
  
  if (!result.success && result.status === 403) {
    logResult('Unauthorized completion rejected', true);
    
    if (result.error.message && result.error.message.includes('Only the assigned agent')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Unauthorized completion validation', false);
  }
};

// Main test runner
const runAllTests = async () => {
  log('🧪 BobbaExpress - TC-005 Pickup Completion Test Suite', 'blue');
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
  
  // Test 1: Agent login and access
  const agentAccess = await testAgentLoginAndAccess();
  if (!agentAccess) {
    log('❌ Cannot proceed without agent access', 'red');
    return;
  }
  
  const { agentToken, testPickup } = agentAccess;
  
  // Test 2: Successful completion
  const completedPickup = await testSuccessfulPickupCompletion(agentToken, testPickup);
  
  // Test 3: Admin view verification
  if (completedPickup) {
    await testAdminViewVerification(completedPickup);
  }
  
  // Test 4-7: Negative test cases
  await testNoPhotoValidation(agentToken);
  await testCountMismatchValidation(agentToken);
  await testCompleteWithoutAssignment();
  await testUnauthorizedCompletion();
  
  // Final summary
  logSection('Test Summary');
  log('🎉 TC-005 Pickup Completion Testing Complete!', 'blue');
  log('📊 Review the results above for any failed tests.', 'yellow');
  log('🔐 All validation and notification features should be working.', 'yellow');
  
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Open browser and navigate to:', CLIENT_URL);
  console.log('2. Login with agent@bobba.com / Agent@1234');
  console.log('3. Navigate to My Pickups');
  console.log('4. Click on PU-2025-001 or any assigned pickup');
  console.log('5. Click [Mark as Picked Up]');
  console.log('6. Fill completion form:');
  console.log('   - Photo proof: Upload image of parcels');
  console.log('   - Actual count: 3 parcels confirmed');
  console.log('   - Signature: Customer signs (or skip if absent)');
  console.log('   - Notes: "All items collected"');
  console.log('7. Click [Complete Pickup]');
  console.log('8. Verify:');
  console.log('   - Pickup status → "Completed" (green badge)');
  console.log('   - Completion timestamp saved');
  console.log('   - Photo proof stored');
  console.log('   - Customer notified via SMS');
  console.log('9. Test negative cases manually in the mobile app simulation');
};

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  completePickup,
  getAgentPickups,
  getPickupById,
  getAuthToken
};
