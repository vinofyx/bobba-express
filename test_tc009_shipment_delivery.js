/**
 * Test Case TC-009: Shipment Delivery Completion
 * 
 * This script tests the complete shipment delivery workflow including:
 * - Marking shipment as delivered from admin interface
 * - Agent app delivery completion functionality
 * - Photo proof and recipient information collection
 * - Automatic parcel status updates
 * - Customer notifications
 * - Invoice/receipt generation
 * - Tracking page updates
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:8080';

// Test data
const VALID_DELIVERY = {
  photoProof: 'https://example.com/delivery-photo.jpg',
  recipientName: 'Siti Aminah',
  signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  note: 'Delivered to recipient at office entrance'
};

const INVALID_DELIVERY = {
  noPhoto: {
    recipientName: 'Siti Aminah',
    signature: 'signature-data'
  },
  noRecipient: {
    photoProof: 'https://example.com/delivery-photo.jpg',
    signature: 'signature-data'
  },
  emptyRecipient: {
    photoProof: 'https://example.com/delivery-photo.jpg',
    recipientName: '',
    signature: 'signature-data'
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

// Helper function to get shipments
const getShipments = async (token, status = 'In Transit') => {
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

// Helper function to mark shipment as delivered
const markShipmentDelivered = async (shipmentId, deliveryData, token) => {
  try {
    const response = await axios.patch(`${BASE_URL}/shipments/${shipmentId}/delivered`, deliveryData, {
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

// Helper function to get agent deliveries
const getAgentDeliveries = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/shipments/agent/deliveries`, {
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

// Helper function to get tracking
const getTracking = async (trackingId) => {
  try {
    const response = await axios.get(`${BASE_URL}/tracking/${trackingId}`, {
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

// Test 1: Get available shipments for delivery
const testGetAvailableShipments = async (adminToken) => {
  logSection('TC-009: Get Available Shipments for Delivery');
  
  const result = await getShipments(adminToken, 'In Transit');
  
  if (result.success) {
    const { shipments } = result.data.data;
    logResult('Get In Transit shipments', true, `Found ${shipments.length} shipments`);
    
    if (shipments.length > 0) {
      const testShipment = shipments[0];
      log(`🚚 Using shipment: ${testShipment.shipmentId}`, 'cyan');
      log(`📍 Route: ${testShipment.route?.origin?.city} → ${testShipment.route?.destination?.city}`, 'cyan');
      log(`📦 Parcels: ${testShipment.parcels?.length || 0}`, 'cyan');
      
      return testShipment;
    } else {
      logResult('No In Transit shipments available', false);
      return null;
    }
  } else {
    logResult('Get shipments', false, result.error.message);
    return null;
  }
};

// Test 2: Successful shipment delivery completion
const testSuccessfulDeliveryCompletion = async (shipment, adminToken) => {
  logSection('TC-009: Successful Shipment Delivery Completion');
  
  if (!shipment) {
    logResult('No shipment available for delivery test', false);
    return null;
  }
  
  const result = await markShipmentDelivered(shipment._id, VALID_DELIVERY, adminToken);
  
  if (result.success) {
    logResult('Shipment delivery completion', true);
    
    const { shipment: updatedShipment, parcels, invoice } = result.data.data;
    
    // Check shipment status
    if (updatedShipment.status === 'Completed') {
      logResult('Shipment status updated', true, 'Completed');
    } else {
      logResult('Shipment status', false, `Expected Completed, got ${updatedShipment.status}`);
    }
    
    // Check delivery timestamp
    if (updatedShipment.deliveredAt) {
      logResult('Delivery timestamp saved', true, updatedShipment.deliveredAt.toLocaleString());
    } else {
      logResult('Delivery timestamp', false);
    }
    
    // Check delivery proof
    if (updatedShipment.deliveryProof) {
      logResult('Delivery proof saved', true);
      
      if (updatedShipment.deliveryProof.recipientName === VALID_DELIVERY.recipientName) {
        logResult('Recipient name saved', true, updatedShipment.deliveryProof.recipientName);
      } else {
        logResult('Recipient name', false);
      }
      
      if (updatedShipment.deliveryProof.photoProof === VALID_DELIVERY.photoProof) {
        logResult('Photo proof saved', true);
      } else {
        logResult('Photo proof', false);
      }
      
      if (updatedShipment.deliveryProof.signature) {
        logResult('Signature saved', true);
      } else {
        logResult('Signature', false);
      }
    } else {
      logResult('Delivery proof', false);
    }
    
    // Check parcel statuses
    if (parcels && parcels.length > 0) {
      logResult('Parcels returned', true, `${parcels.length} parcels`);
      
      const allDelivered = parcels.every(parcel => parcel.status === 'Delivered');
      if (allDelivered) {
        logResult('All parcels delivered', true);
        
        parcels.forEach(parcel => {
          logResult(`Parcel ${parcel.trackingId}`, true, 'Delivered');
        });
      } else {
        logResult('All parcels delivered', false, 'Some parcels not delivered');
      }
    } else {
      logResult('Parcels returned', false);
    }
    
    // Check invoice generation
    if (invoice) {
      logResult('Invoice generated', true, invoice.invoiceId);
      
      if (invoice.shipmentId === updatedShipment.shipmentId) {
        logResult('Invoice shipment ID', true);
      } else {
        logResult('Invoice shipment ID', false);
      }
      
      if (invoice.totalParcels === parcels.length) {
        logResult('Invoice parcel count', true);
      } else {
        logResult('Invoice parcel count', false);
      }
    } else {
      logResult('Invoice generation', false);
    }
    
    return { updatedShipment, parcels, invoice };
  } else {
    logResult('Shipment delivery completion', false, result.error.message);
    return null;
  }
};

// Test 3: Verify tracking page updates
const testTrackingPageUpdates = async (parcels) => {
  logSection('TC-009: Verify Tracking Page Updates');
  
  if (!parcels || parcels.length === 0) {
    logResult('No parcels available for tracking test', false);
    return;
  }
  
  // Test tracking for each parcel
  for (const parcel of parcels) {
    const result = await getTracking(parcel.trackingId);
    
    if (result.success) {
      const { timeline } = result.data.data;
      
      logResult(`Tracking lookup for ${parcel.trackingId}`, true);
      
      // Check all timeline steps are green (completed)
      if (timeline && timeline.length > 0) {
        const allCompleted = timeline.every(step => step.completed);
        if (allCompleted) {
          logResult(`All timeline steps completed for ${parcel.trackingId}`, true);
          
          // Check specific steps
          const deliveredStep = timeline.find(step => step.status === 'Delivered');
          if (deliveredStep && deliveredStep.completed) {
            logResult(`Delivered step completed for ${parcel.trackingId}`, true, '✅ green');
          } else {
            logResult(`Delivered step for ${parcel.trackingId}`, false);
          }
        } else {
          logResult(`All timeline steps for ${parcel.trackingId}`, false, 'Some steps still pending');
        }
      } else {
        logResult(`Timeline for ${parcel.trackingId}`, false);
      }
    } else {
      logResult(`Tracking lookup for ${parcel.trackingId}`, false, result.error.message);
    }
  }
};

// Test 4: Agent app delivery completion
const testAgentAppDelivery = async (agentToken) => {
  logSection('TC-009: Agent App Delivery Completion');
  
  // Get agent deliveries
  const deliveriesResult = await getAgentDeliveries(agentToken);
  
  if (deliveriesResult.success) {
    const { shipments } = deliveriesResult.data.data;
    logResult('Get agent deliveries', true, `Found ${shipments.length} deliveries`);
    
    if (shipments.length > 0) {
      const agentShipment = shipments[0];
      log(`🚚 Agent shipment: ${agentShipment.shipmentId}`, 'cyan');
      log(`📍 Route: ${agentShipment.route?.origin?.city} → ${agentShipment.route?.destination?.city}`, 'cyan');
      
      // Complete delivery from agent app
      const deliveryResult = await markShipmentDelivered(agentShipment._id, VALID_DELIVERY, agentToken);
      
      if (deliveryResult.success) {
        logResult('Agent app delivery completion', true);
        
        const { shipment: updatedShipment, parcels } = deliveryResult.data.data;
        
        if (updatedShipment.status === 'Completed') {
          logResult('Agent shipment status', true, 'Completed');
        } else {
          logResult('Agent shipment status', false);
        }
        
        if (parcels && parcels.every(p => p.status === 'Delivered')) {
          logResult('Agent parcels delivered', true);
        } else {
          logResult('Agent parcels delivered', false);
        }
      } else {
        logResult('Agent app delivery completion', false, deliveryResult.error.message);
      }
    } else {
      logResult('No agent deliveries available', false);
    }
  } else {
    logResult('Get agent deliveries', false, deliveriesResult.error.message);
  }
};

// Test 5: Validation errors
const testValidationErrors = async (adminToken, shipment) => {
  logSection('TC-009: Validation Errors');
  
  if (!shipment) {
    logResult('No shipment available for validation tests', false);
    return;
  }
  
  // Test missing photo proof
  const result1 = await markShipmentDelivered(shipment._id, INVALID_DELIVERY.noPhoto, adminToken);
  if (!result1.success && result1.status === 400) {
    logResult('Missing photo proof rejected', true);
    
    if (result1.error.message && result1.error.message.includes('Photo proof is required')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result1.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Missing photo proof validation', false);
  }
  
  // Test missing recipient name
  const result2 = await markShipmentDelivered(shipment._id, INVALID_DELIVERY.noRecipient, adminToken);
  if (!result2.success && result2.status === 400) {
    logResult('Missing recipient name rejected', true);
    
    if (result2.error.message && result2.error.message.includes('Recipient name is required')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result2.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Missing recipient name validation', false);
  }
  
  // Test empty recipient name
  const result3 = await markShipmentDelivered(shipment._id, INVALID_DELIVERY.emptyRecipient, adminToken);
  if (!result3.success && result3.status === 400) {
    logResult('Empty recipient name rejected', true);
    
    if (result3.error.message && result3.error.message.includes('Recipient name is required')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result3.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Empty recipient name validation', false);
  }
};

// Main test runner
const runAllTests = async () => {
  log('🧪 BobbaExpress - TC-009 Shipment Delivery Test Suite', 'blue');
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
  
  // Get admin and agent tokens
  const adminToken = await getAuthToken('admin@bobba.com', 'Admin@1234');
  if (!adminToken) {
    log('❌ Cannot proceed without admin authentication', 'red');
    return;
  }
  log('✅ Admin authentication successful', 'green');
  
  const agentToken = await getAuthToken('agent@bobba.com', 'Agent@1234');
  if (!agentToken) {
    log('⚠️  Agent authentication failed, some tests will be skipped', 'yellow');
  } else {
    log('✅ Agent authentication successful', 'green');
  }
  
  let testShipment = null;
  let deliveryResult = null;
  
  // Run all test cases
  testShipment = await testGetAvailableShipments(adminToken);
  
  if (testShipment) {
    deliveryResult = await testSuccessfulDeliveryCompletion(testShipment, adminToken);
    
    if (deliveryResult) {
      await testTrackingPageUpdates(deliveryResult.parcels);
    }
  }
  
  if (agentToken) {
    await testAgentAppDelivery(agentToken);
  }
  
  await testValidationErrors(adminToken, testShipment);
  
  // Final summary
  logSection('Test Summary');
  log('🎉 TC-009 Shipment Delivery Testing Complete!', 'blue');
  log('📊 Review the results above for any failed tests.', 'yellow');
  log('🔐 All delivery and notification features should be working.', 'yellow');
  
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Open browser and navigate to:', CLIENT_URL);
  console.log('2. Login with admin@bobba.com / Admin@1234');
  console.log('3. Navigate to Shipments page');
  console.log('4. Find shipment SH-2025-001 and click [Mark Delivered]');
  console.log('5. Fill delivery form:');
  console.log('   - Photo proof: Upload delivery photo');
  console.log('   - Recipient name: Siti Aminah');
  console.log('   - Signature: Collect signature');
  console.log('6. Click [Complete Delivery]');
  console.log('7. Verify:');
  console.log('   - All 3 parcels → "Delivered"');
  console.log('   - Shipment status → "Completed"');
  console.log('   - Delivery timestamp saved');
  console.log('   - Customer email: "Your parcel has been delivered"');
  console.log('   - Tracking page → all 5 steps green ✅');
  console.log('   - Invoice/receipt auto-generated');
  console.log('8. Test agent app delivery completion');
  console.log('9. Test negative cases manually in the UI');
};

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  getShipments,
  markShipmentDelivered,
  getAgentDeliveries,
  getTracking,
  getAuthToken
};
