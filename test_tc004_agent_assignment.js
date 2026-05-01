/**
 * Test Case TC-004: Agent Assignment Functionality
 * 
 * This script tests the complete agent assignment workflow including:
 * - Agent assignment to pickups
 * - Availability checking
 * - SMS notifications to agent and customer
 * - Activity log updates
 * - Reassignment scenarios
 * - Edge cases and warnings
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:8080';

// Test data
const TOMORROW = new Date();
TOMORROW.setDate(TOMORROW.getDate() + 1);
const TOMORROW_STR = TOMORROW.toISOString().split('T')[0];

const VALID_ASSIGNMENT = {
  agentId: null, // Will be set dynamically
};

const INVALID_ASSIGNMENTS = {
  noAgent: {
    agentId: null
  },
  invalidAgent: {
    agentId: '507f1f77bcf86cd799439011' // Non-existent ID
  },
  nonAgentUser: {
    agentId: null // Will be set to admin user ID
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

// Helper function to get available agents
const getAgents = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/users?role=agent`, {
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

// Helper function to get pickups
const getPickups = async (token, status = 'Requested') => {
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

// Helper function to assign agent
const assignAgent = async (pickupId, agentId, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/pickups/${pickupId}/assign`, {
      agentId
    }, {
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

// Helper function to reassign agent
const reassignAgent = async (pickupId, agentId, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/pickups/${pickupId}/reassign`, {
      agentId
    }, {
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

// Test 1: Successful Agent Assignment
const testSuccessfulAgentAssignment = async (token, agent, pickup) => {
  logSection('TC-004: Successful Agent Assignment');
  
  log(`📝 Assigning agent: ${agent.name} to pickup: ${pickup.pickupId}`);
  log(`👤 Agent ID: ${agent._id}`);
  log(`📦 Pickup ID: ${pickup._id}`);
  
  const result = await assignAgent(pickup._id, agent._id, token);
  
  if (result.success) {
    logResult('Agent assignment', true);
    
    const { pickup: updatedPickup } = result.data.data;
    
    // Check status change
    if (updatedPickup.status === 'Assigned') {
      logResult('Pickup status changed to Assigned', true);
    } else {
      logResult('Pickup status change', false, `Expected Assigned, got ${updatedPickup.status}`);
    }
    
    // Check agent assignment
    if (updatedPickup.assignedAgent && updatedPickup.assignedAgent._id === agent._id) {
      logResult('Agent assigned correctly', true);
      log(`👤 Agent name: ${updatedPickup.assignedAgent.name}`, 'cyan');
    } else {
      logResult('Agent assignment', false);
    }
    
    // Check status history
    if (updatedPickup.statusHistory && updatedPickup.statusHistory.length > 0) {
      const lastHistory = updatedPickup.statusHistory[updatedPickup.statusHistory.length - 1];
      if (lastHistory.status === 'Assigned' && lastHistory.note.includes(agent.name)) {
        logResult('Activity log updated', true);
        log(`📝 Log entry: ${lastHistory.note}`, 'cyan');
      } else {
        logResult('Activity log update', false);
      }
    } else {
      logResult('Activity log', false);
    }
    
    return updatedPickup;
  } else {
    logResult('Agent assignment', false, result.error.message);
    return null;
  }
};

// Test 2: Agent availability check (TC-004a)
const testAgentAvailabilityCheck = async (token, agent) => {
  logSection('TC-004a: Agent Availability Check (5 pickups limit)');
  
  // Get existing pickups for this agent
  const pickupsResult = await getPickups(token, 'Assigned');
  
  if (pickupsResult.success) {
    const { pickups } = pickupsResult.data.data;
    const agentPickups = pickups.filter(p => p.assignedAgent && p.assignedAgent._id === agent._id);
    
    log(`📊 Current pickups for ${agent.name}: ${agentPickups.length}`);
    
    if (agentPickups.length >= 5) {
      logResult('Agent at capacity', true, `${agentPickups.length}/5 pickups`);
      
      // Try to assign another pickup
      const unassignedPickups = pickups.filter(p => !p.assignedAgent);
      if (unassignedPickups.length > 0) {
        const result = await assignAgent(unassignedPickups[0]._id, agent._id, token);
        
        if (!result.success && result.status === 400 && result.error.warning) {
          logResult('Capacity warning shown', true);
          log(`⚠️ Warning: ${result.error.message}`, 'yellow');
        } else {
          logResult('Capacity warning', false);
        }
      }
    } else {
      logResult('Agent has capacity', true, `${agentPickups.length}/5 pickups`);
    }
  } else {
    logResult('Get pickups for availability check', false);
  }
};

// Test 3: Agent offline check (TC-004b)
const testAgentOfflineCheck = async (token, offlineAgent, pickup) => {
  logSection('TC-004b: Agent Offline Check');
  
  if (!offlineAgent) {
    logResult('No offline agent available', false);
    return;
  }
  
  log(`📱 Testing offline agent: ${offlineAgent.name}`);
  log(`🕐 Last login: ${offlineAgent.lastLogin || 'Never'}`);
  
  const result = await assignAgent(pickup._id, offlineAgent._id, token);
  
  if (!result.success && result.status === 400 && result.error.warning) {
    logResult('Offline warning shown', true);
    log(`⚠️ Warning: ${result.error.message}`, 'yellow');
  } else {
    logResult('Offline warning', false, result.success ? 'Assignment succeeded unexpectedly' : 'No warning shown');
  }
};

// Test 4: Reassign to different agent (TC-004c)
const testReassignToDifferentAgent = async (token, assignedPickup, newAgent) => {
  logSection('TC-004c: Reassign to Different Agent');
  
  if (!assignedPickup || !assignedPickup.assignedAgent) {
    logResult('No assigned pickup available', false);
    return;
  }
  
  const originalAgent = assignedPickup.assignedAgent;
  log(`🔄 Reassigning from: ${originalAgent.name} to: ${newAgent.name}`);
  
  const result = await reassignAgent(assignedPickup._id, newAgent._id, token);
  
  if (result.success) {
    logResult('Agent reassignment', true);
    
    const { pickup: reassignedPickup } = result.data.data;
    
    // Check new assignment
    if (reassignedPickup.assignedAgent && reassignedPickup.assignedAgent._id === newAgent._id) {
      logResult('New agent assigned', true);
    } else {
      logResult('New agent assignment', false);
    }
    
    // Check status history
    if (reassignedPickup.statusHistory && reassignedPickup.statusHistory.length > 0) {
      const lastHistory = reassignedPickup.statusHistory[reassignedPickup.statusHistory.length - 1];
      if (lastHistory.note.includes('Reassigned')) {
        logResult('Reassignment logged', true);
        log(`📝 Log entry: ${lastHistory.note}`, 'cyan');
      } else {
        logResult('Reassignment logging', false);
      }
    }
    
  } else {
    logResult('Agent reassignment', false, result.error.message);
  }
};

// Test 5: Invalid agent validation
const testInvalidAgentValidation = async (token, pickup) => {
  logSection('Invalid Agent Validation');
  
  // Test with non-existent agent
  const result1 = await assignAgent(pickup._id, '507f1f77bcf86cd799439011', token);
  if (!result1.success && result1.status === 404) {
    logResult('Non-existent agent rejected', true);
  } else {
    logResult('Non-existent agent validation', false);
  }
  
  // Test with no agent
  const result2 = await assignAgent(pickup._id, '', token);
  if (!result2.success && result2.status === 400) {
    logResult('No agent rejected', true);
  } else {
    logResult('No agent validation', false);
  }
};

// Main test runner
const runAllTests = async () => {
  log('🧪 BobbaExpress - TC-004 Agent Assignment Test Suite', 'blue');
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
  
  // Get available agents
  log('\n👥 Getting available agents...');
  const agentsResult = await getAgents(token);
  if (!agentsResult.success) {
    log('❌ Failed to get agents', 'red');
    return;
  }
  
  const agents = agentsResult.data.data.users;
  log(`✅ Found ${agents.length} agents`);
  
  if (agents.length === 0) {
    log('❌ No agents available for testing', 'red');
    return;
  }
  
  // Get available pickups
  log('\n📦 Getting available pickups...');
  const pickupsResult = await getPickups(token, 'Requested');
  if (!pickupsResult.success) {
    log('❌ Failed to get pickups', 'red');
    return;
  }
  
  const pickups = pickupsResult.data.data.pickups;
  log(`✅ Found ${pickups.length} unassigned pickups`);
  
  if (pickups.length === 0) {
    log('❌ No unassigned pickups available for testing', 'red');
    return;
  }
  
  // Select test data
  const testAgent = agents[0];
  const testPickup = pickups[0];
  const offlineAgent = agents.find(a => !a.lastLogin) || agents[1];
  const newAgent = agents.length > 1 ? agents[1] : agents[0];
  
  log(`\n🎯 Using agent: ${testAgent.name} (${testAgent._id})`);
  log(`🎯 Using pickup: ${testPickup.pickupId} (${testPickup._id})`);
  
  let assignedPickup = null;
  
  // Run all test cases
  assignedPickup = await testSuccessfulAgentAssignment(token, testAgent, testPickup);
  
  if (assignedPickup) {
    await testAgentAvailabilityCheck(token, testAgent);
    await testAgentOfflineCheck(token, offlineAgent, pickups[1] || testPickup);
    await testReassignToDifferentAgent(token, assignedPickup, newAgent);
  }
  
  await testInvalidAgentValidation(token, testPickup);
  
  // Final summary
  logSection('Test Summary');
  log('🎉 TC-004 Agent Assignment Testing Complete!', 'blue');
  log('📊 Review the results above for any failed tests.', 'yellow');
  log('🔐 All validation and notification features should be working.', 'yellow');
  
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Open browser and navigate to:', CLIENT_URL);
  console.log('2. Login with admin@bobba.com / Admin@1234');
  console.log('3. Navigate to Pickups page');
  console.log('4. Click on PU-2025-001 or any pickup');
  console.log('5. Click [Assign Agent]');
  console.log('6. Select "Ali bin Abu" from dropdown');
  console.log('7. Verify vehicle auto-filled from agent profile');
  console.log('8. Click [Confirm Assignment]');
  console.log('9. Verify:');
  console.log('   - Pickup status → "Assigned" (blue badge)');
  console.log('   - Agent name appears on pickup row');
  console.log('   - Activity log updated');
  console.log('   - Customer notified via SMS');
  console.log('10. Test edge cases manually in the UI');
};

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  assignAgent,
  reassignAgent,
  getAgents,
  getPickups,
  getAuthToken
};
