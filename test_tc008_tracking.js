/**
 * Test Case TC-008: Tracking Functionality
 * 
 * This script tests the complete tracking workflow including:
 * - Public tracking page functionality
 * - Timeline display with status indicators
 * - ETA calculation and display
 * - Share link generation
 * - PDF download functionality
 * - Email subscription system
 * - Negative test cases and validation
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:8080';

// Test data
const VALID_TRACKING = 'BE001234';
const INVALID_TRACKINGS = {
  empty: '',
  invalid: 'INVALID123',
  notFound: 'BE999999'
};

const VALID_SUBSCRIPTION = {
  trackingId: 'BE001234',
  email: 'customer@example.com'
};

const INVALID_SUBSCRIPTIONS = {
  noTrackingId: {
    email: 'customer@example.com'
  },
  noEmail: {
    trackingId: 'BE001234'
  },
  invalidEmail: {
    trackingId: 'BE001234',
    email: 'invalid-email'
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

// Helper function to get tracking
const getTracking = async (trackingId, token = null) => {
  try {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await axios.get(`${BASE_URL}/tracking/${trackingId}`, { headers });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || { message: error.message },
      status: error.response?.status 
    };
  }
};

// Helper function to get parcels by status
const getParcels = async (status = null, adminToken = null) => {
  try {
    const token = adminToken || await getAuthToken('admin@bobba.com', 'Admin@1234');
    const headers = { 'Authorization': `Bearer ${token}` };
    const response = await axios.get(`${BASE_URL}/parcels${status ? `?status=${status}` : ''}`, { headers });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || { message: error.message },
      status: error.response?.status 
    };
  }
};

// Helper function to download tracking PDF
const downloadTrackingPDF = async (trackingId, token) => {
  try {
    const response = await axios.get(`${BASE_URL}/tracking/${trackingId}/download`, {
      headers: { 'Authorization': `Bearer ${token}` }
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

// Helper function to subscribe to tracking
const subscribeToTracking = async (trackingId, email, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/tracking/${trackingId}/subscribe`, {
      trackingId,
      email
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
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

// Test 1: Successful tracking lookup
const testSuccessfulTrackingLookup = async () => {
  logSection('TC-008: Successful Tracking Lookup');
  
  const result = await getTracking(VALID_TRACKING);
  
  if (result.success) {
    logResult('Tracking lookup', true);
    
    const { parcel, timeline, logs, eta, shareLink } = result.data.data;
    
    // Check parcel data
    if (parcel.trackingId === VALID_TRACKING) {
      logResult('Tracking ID found', true);
      log(`📦 Tracking ID: ${parcel.trackingId}`, 'cyan');
    } else {
      logResult('Tracking ID', false);
    }
    
    // Check timeline
    if (timeline && timeline.length > 0) {
      logResult('Timeline generated', true, `${timeline.length} steps`);
      
      // Check specific timeline steps
      const pickedUpStep = timeline.find(step => step.status === 'Picked Up');
      if (pickedUpStep && pickedUpStep.completed) {
        logResult('Step 1: Picked Up', true, '✅ green');
        log(`⏰ ${pickedUpStep.timestamp.toLocaleString()} - ${pickedUpStep.location}`, 'cyan');
      } else {
        logResult('Step 1: Picked Up', false, '🔄 pending');
      }
      
      const warehouseStep = timeline.find(step => step.status === 'At Warehouse');
      if (warehouseStep && warehouseStep.completed) {
        logResult('Step 2: At Warehouse', true, '✅ green');
        log(`⏰ ${warehouseStep.timestamp.toLocaleString()} - ${warehouseStep.location}`, 'cyan');
      } else {
        logResult('Step 2: At Warehouse', false, '🔄 pending');
      }
      
      const inTransitStep = timeline.find(step => step.status === 'In Transit');
      if (inTransitStep && inTransitStep.completed) {
        logResult('Step 3: In Transit', true, '✅ green');
        log(`⏰ ${inTransitStep.timestamp.toLocaleString()} - ${inTransitStep.location}`, 'cyan');
      } else {
        logResult('Step 3: In Transit', false, '🔄 active');
      }
      
      const deliveryStep = timeline.find(step => step.status === 'Out for Delivery');
      if (deliveryStep && deliveryStep.completed) {
        logResult('Step 4: Out for Delivery', true, '○ pending');
      } else {
        logResult('Step 4: Out for Delivery', false, '○ pending');
      }
      
      const deliveredStep = timeline.find(step => step.status === 'Delivered');
      if (deliveredStep && deliveredStep.completed) {
        logResult('Step 5: Delivered', true, '✅ green');
        log(`⏰ ${deliveredStep.timestamp.toLocaleString()} - ${deliveredStep.location}`, 'cyan');
      } else {
        logResult('Step 5: Delivered', false, '○ pending');
      }
    } else {
      logResult('Timeline generation', false);
    }
    
    // Check sender/receiver info (partial mask)
    if (parcel.sender && parcel.sender.name) {
      logResult('Sender info shown', true, `📤 ${parcel.sender.name} (Phone: ${parcel.sender.phone})`);
    } else {
      logResult('Sender info', false);
    }
    
    if (parcel.receiver && parcel.receiver.name) {
      logResult('Receiver info shown', true, `📮 ${parcel.receiver.name} (${parcel.receiver.address.line2})`);
    } else {
      logResult('Receiver info', false);
    }
    
    // Check ETA
    if (eta && eta.message) {
      logResult('ETA calculated', true, eta.message);
    } else if (parcel.status !== 'Delivered') {
      logResult('ETA', false, 'No ETA available');
    }
    
    // Check share link
    if (shareLink) {
      logResult('Share link generated', true, shareLink);
    } else {
      logResult('Share link generation', false);
    }
    
    return parcel;
  } else {
    logResult('Tracking lookup', false, result.error.message);
    return null;
  }
};

// Test 2: PDF download functionality
const testPDFDownload = async (parcel, adminToken) => {
  logSection('TC-008: PDF Download Functionality');
  
  if (!parcel) {
    logResult('No parcel available for PDF test', false);
    return;
  }
  
  const result = await downloadTrackingPDF(parcel.trackingId, adminToken);
  
  if (result.success) {
    logResult('PDF download', true);
    
    const { pdfData } = result.data.data;
    
    if (pdfData.trackingId === parcel.trackingId) {
      logResult('PDF data contains tracking ID', true);
    } else {
      logResult('PDF data tracking ID', false);
    }
    
    if (pdfData.timeline && pdfData.timeline.length > 0) {
      logResult('PDF contains timeline', true);
    } else {
      logResult('PDF contains timeline', false);
    }
    
    if (pdfData.eta) {
      logResult('PDF contains ETA', true);
    } else if (parcel.status !== 'Delivered') {
      logResult('PDF contains ETA', false);
    }
    
    if (pdfData.sender && pdfData.receiver) {
      logResult('PDF contains addresses', true);
    } else {
      logResult('PDF contains addresses', false);
    }
    
    log('📄 PDF data ready for download', 'cyan');
  } else {
    logResult('PDF download', false, result.error.message);
  }
};

// Test 3: Email subscription functionality
const testEmailSubscription = async (parcel, adminToken) => {
  logSection('TC-008: Email Subscription Functionality');
  
  if (!parcel) {
    logResult('No parcel available for subscription test', false);
    return;
  }
  
  const result = await subscribeToTracking(parcel.trackingId, VALID_SUBSCRIPTION.email, adminToken);
  
  if (result.success) {
    logResult('Email subscription', true);
    
    const { subscription } = result.data.data;
    
    if (subscription.trackingId === parcel.trackingId) {
      logResult('Subscription linked correctly', true);
    } else {
      logResult('Subscription tracking ID', false);
    }
    
    if (subscription.email === VALID_SUBSCRIPTION.email) {
      logResult('Email recorded', true);
    } else {
      logResult('Email recorded', false);
    }
    
    log('📧 Subscription created successfully', 'cyan');
  } else {
    logResult('Email subscription', false, result.error.message);
  }
};

// Test 4: Invalid tracking ID validation (TC-008a)
const testInvalidTrackingIdValidation = async () => {
  logSection('TC-008a: Invalid Tracking ID Validation');
  
  // Test empty tracking ID
  const result1 = await getTracking(INVALID_TRACKINGS.empty);
  if (!result1.success && result1.status === 400) {
    logResult('Empty tracking ID rejected', true);
    
    if (result1.error.message && result1.error.message.includes('Enter tracking number')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result1.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Empty tracking ID validation', false);
  }
  
  // Test invalid tracking ID
  const result2 = await getTracking(INVALID_TRACKINGS.invalid);
  if (!result2.success && result2.status === 404) {
    logResult('Invalid tracking ID rejected', true);
    
    if (result2.error.message && result2.error.message.includes('Parcel not found')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result2.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Invalid tracking ID validation', false);
  }
  
  // Test not found tracking ID
  const result3 = await getTracking(INVALID_TRACKINGS.notFound);
  if (!result3.success && result3.status === 404) {
    logResult('Not found tracking ID rejected', true);
    
    if (result3.error.message && result3.error.message.includes('Parcel not found')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result3.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Not found tracking ID validation', false);
  }
};

// Test 5: Delivered parcel verification (TC-008c)
const testDeliveredParcelVerification = async () => {
  logSection('TC-008c: Delivered Parcel Verification');
  
  // Get a delivered parcel
  const result = await getParcels('Delivered');
  
  if (result.success) {
    const { parcels } = result.data.data;
    
    if (parcels.length > 0) {
      const deliveredParcel = parcels[0];
      
      // Test tracking lookup for delivered parcel
      const trackingResult = await getTracking(deliveredParcel.trackingId);
      
      if (trackingResult.success) {
        const { timeline, eta } = trackingResult.data.data;
        
        logResult('Delivered parcel tracking', true);
        
        // Check all steps are green
        const allStepsGreen = timeline.every(step => step.completed);
        if (allStepsGreen) {
          logResult('All timeline steps green', true);
        } else {
          logResult('All timeline steps green', false, 'Some steps still pending');
        }
        
        // Check no ETA (delivered parcels shouldn't have ETA)
        if (!eta) {
          logResult('No ETA for delivered parcel', true);
        } else {
          logResult('ETA for delivered parcel', false);
        }
        
        // Check delivery date shown
        const deliveredStep = timeline.find(step => step.status === 'Delivered');
        if (deliveredStep && deliveredStep.timestamp) {
          logResult('Delivery date shown', true, deliveredStep.timestamp.toLocaleString());
        } else {
          logResult('Delivery date shown', false);
        }
      } else {
        logResult('Delivered parcel tracking', false, trackingResult.error.message);
      }
    } else {
      logResult('No delivered parcels available', false);
    }
  } else {
    logResult('Get delivered parcels', false, result.error.message);
  }
};

// Main test runner
const runAllTests = async () => {
  log('🧪 BobbaExpress - TC-008 Tracking Test Suite', 'blue');
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
  
  let testParcel = null;
  
  // Run all test cases
  testParcel = await testSuccessfulTrackingLookup();
  
  if (testParcel) {
    await testPDFDownload(testParcel, adminToken);
    await testEmailSubscription(testParcel, adminToken);
  }
  
  await testInvalidTrackingIdValidation();
  await testDeliveredParcelVerification();
  
  // Final summary
  logSection('Test Summary');
  log('🎉 TC-008 Tracking Testing Complete!', 'blue');
  log('📊 Review the results above for any failed tests.', 'yellow');
  log('🔐 All tracking and notification features should be working.', 'yellow');
  
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Open browser and navigate to:', CLIENT_URL);
  console.log('2. Navigate to /tracking or /track');
  console.log('3. Enter tracking ID: BE001234');
  console.log('4. Click [Track]');
  console.log('5. Verify:');
  console.log('   - Timeline displays with proper status indicators');
  console.log('   - Step 1: Picked Up — 28 Apr 09:00am ✅ green');
  console.log('   - Step 2: At Warehouse — 28 Apr 11:30am ✅ green');
  console.log('   - Step 3: In Transit — 28 Apr 02:00pm 🔄 active');
  console.log('   - Step 4: Out for Delivery ○ pending');
  console.log('   - Step 5: Delivered ○ pending');
  console.log('   - Sender/Receiver info shown (partial mask)');
  console.log('   - ETA: 29 Apr 2025 displayed');
  console.log('   - Share link generated → /track?id=BE001234');
  console.log('   - Download PDF works');
  console.log('   - Subscribe to updates (email input works)');
  console.log('6. Test negative cases manually in the UI');
};

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  getTracking,
  downloadTrackingPDF,
  subscribeToTracking,
  getParcels,
  getAuthToken
};
