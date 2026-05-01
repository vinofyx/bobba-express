/**
 * Test Case TC-002: Customer Creation Functionality
 * 
 * This script tests the complete customer creation workflow including:
 * - Successful customer creation with all fields
 * - Customer ID generation
 * - Duplicate email/phone validation
 * - Input validation and error handling
 * - Database record verification
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:8080';

// Test data
const VALID_CUSTOMER = {
  type: 'B2B',
  name: 'Ahmad Zulkifli',
  email: 'ahmad@test.com',
  phone: '0198765432',
  address: {
    line1: 'No 5, Jalan Ampang',
    city: 'Kuala Lumpur',
    state: 'Kuala Lumpur',
    pincode: '500001'
  },
  companyName: 'AZ Trading Sdn Bhd'
};

const INVALID_CUSTOMERS = {
  duplicateEmail: {
    ...VALID_CUSTOMER,
    email: 'john.doe@example.com' // From seeded data
  },
  duplicatePhone: {
    ...VALID_CUSTOMER,
    phone: '9876543220' // From seeded data
  },
  invalidPhone: {
    ...VALID_CUSTOMER,
    phone: '123456789' // Invalid format - doesn't start with 01
  },
  emptyFields: {
    type: '',
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      pincode: ''
    },
    companyName: ''
  },
  b2bWithoutCompany: {
    type: 'B2B',
    name: 'Test User',
    phone: '0139876543',
    address: {
      line1: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456'
    }
    // Missing companyName
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

// Helper function to create customer
const createCustomer = async (customerData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/customers`, customerData, {
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

// Helper function to get customers
const getCustomers = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/customers`, {
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

// Test 1: Successful Customer Creation
const testSuccessfulCustomerCreation = async (token) => {
  logSection('TC-002: Successful Customer Creation');
  
  log(`📝 Creating customer: ${VALID_CUSTOMER.name}`);
  log(`📧 Email: ${VALID_CUSTOMER.email}`);
  log(`📞 Phone: ${VALID_CUSTOMER.phone}`);
  log(`🏢 Company: ${VALID_CUSTOMER.companyName}`);
  log(`👤 Type: ${VALID_CUSTOMER.type}`);
  
  const result = await createCustomer(VALID_CUSTOMER, token);
  
  if (result.success) {
    logResult('Customer creation', true);
    
    const { customer } = result.data.data;
    
    // Check customer ID generation
    if (customer.customerId) {
      logResult('Customer ID generated', true);
      log(`🆔 Customer ID: ${customer.customerId}`, 'cyan');
    } else {
      logResult('Customer ID generation', false);
    }
    
    // Check status
    if (customer.isActive === true) {
      logResult('Customer status: Active', true);
    } else {
      logResult('Customer status', false);
    }
    
    // Check all fields are saved
    const requiredFields = ['name', 'email', 'phone', 'address', 'type'];
    let allFieldsPresent = true;
    
    for (const field of requiredFields) {
      if (customer[field]) {
        logResult(`Field ${field} saved`, true);
      } else {
        logResult(`Field ${field} missing`, false);
        allFieldsPresent = false;
      }
    }
    
    // Check B2B specific fields
    if (customer.type === 'B2B' && customer.companyName) {
      logResult('Company name saved', true);
    }
    
    return customer;
  } else {
    logResult('Customer creation', false, result.error.message);
    return null;
  }
};

// Test 2: Customer appears in table
const testCustomerInTable = async (token, createdCustomer) => {
  logSection('TC-002: Customer Appears in Table');
  
  const result = await getCustomers(token);
  
  if (result.success) {
    const { customers } = result.data.data;
    
    // Find the created customer
    const foundCustomer = customers.find(c => c._id === createdCustomer._id);
    
    if (foundCustomer) {
      logResult('Customer appears in list', true);
      
      // Check if sorted by latest (should be first)
      if (customers[0]._id === createdCustomer._id) {
        logResult('Customer sorted as latest (row 1)', true);
      } else {
        logResult('Customer sorting', false);
      }
      
      // Verify all data matches
      if (foundCustomer.name === createdCustomer.name &&
          foundCustomer.email === createdCustomer.email &&
          foundCustomer.phone === createdCustomer.phone) {
        logResult('Customer data integrity', true);
      } else {
        logResult('Customer data integrity', false);
      }
      
    } else {
      logResult('Customer appears in list', false);
    }
  } else {
    logResult('Get customers list', false, result.error.message);
  }
};

// Test 3: Duplicate email validation
const testDuplicateEmail = async (token) => {
  logSection('TC-002a: Duplicate Email Validation');
  
  const result = await createCustomer(INVALID_CUSTOMERS.duplicateEmail, token);
  
  if (!result.success && result.status === 409) {
    logResult('Duplicate email rejected', true);
    
    if (result.error.message && result.error.message.includes('Email already exists')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Duplicate email validation', false);
  }
};

// Test 4: Duplicate phone validation
const testDuplicatePhone = async (token) => {
  logSection('TC-002b: Duplicate Phone Validation');
  
  const result = await createCustomer(INVALID_CUSTOMERS.duplicatePhone, token);
  
  if (!result.success && result.status === 409) {
    logResult('Duplicate phone rejected', true);
    
    if (result.error.message && result.error.message.includes('Phone number already exists')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('Duplicate phone validation', false);
  }
};

// Test 5: Phone validation
const testPhoneValidation = async (token) => {
  logSection('TC-002c: Phone Number Validation');
  
  const invalidPhones = [
    '123456789',     // 9 digits, doesn't start with 01
    '0234567890',    // starts with 02
    '12345',          // 5 digits
    'abcdefghij',     // letters
    '012345-6789',   // with dash
    '012345 6789'    // with space
  ];
  
  for (const phone of invalidPhones) {
    const testData = { ...VALID_CUSTOMER, phone, email: `test${phone}@test.com` };
    const result = await createCustomer(testData, token);
    
    if (!result.success && (result.status === 400 || result.status === 422)) {
      logResult(`Invalid phone rejected: ${phone}`, true);
    } else {
      logResult(`Invalid phone validation: ${phone}`, false);
    }
  }
};

// Test 6: Empty fields validation
const testEmptyFieldsValidation = async (token) => {
  logSection('TC-002d: Empty Fields Validation');
  
  const result = await createCustomer(INVALID_CUSTOMERS.emptyFields, token);
  
  if (!result.success && (result.status === 400 || result.status === 422)) {
    logResult('Empty fields rejected', true);
    
    // Check if multiple validation errors are returned
    if (result.error.message) {
      logResult('Validation errors returned', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    }
  } else {
    logResult('Empty fields validation', false);
  }
};

// Test 7: B2B without company validation
const testB2BWithoutCompany = async (token) => {
  logSection('TC-002e: B2B Without Company Validation');
  
  const result = await createCustomer(INVALID_CUSTOMERS.b2bWithoutCompany, token);
  
  if (!result.success && (result.status === 400 || result.status === 422)) {
    logResult('B2B without company rejected', true);
    
    if (result.error.message && result.error.message.includes('company')) {
      logResult('Proper error message', true);
      log(`📝 Error: ${result.error.message}`, 'cyan');
    } else {
      logResult('Error message', false);
    }
  } else {
    logResult('B2B without company validation', false);
  }
};

// Test 8: Database record verification
const testDatabaseRecord = async (token, createdCustomer) => {
  logSection('TC-002: Database Record Verification');
  
  const result = await getCustomers(token);
  
  if (result.success) {
    const { customers } = result.data.data;
    const dbCustomer = customers.find(c => c._id === createdCustomer._id);
    
    if (dbCustomer) {
      logResult('Customer found in database', true);
      
      // Verify all critical fields
      const criticalFields = ['customerId', 'name', 'email', 'phone', 'address', 'type', 'isActive'];
      let allFieldsVerified = true;
      
      for (const field of criticalFields) {
        if (dbCustomer[field] !== undefined && dbCustomer[field] !== null) {
          logResult(`Database field ${field} present`, true);
        } else {
          logResult(`Database field ${field} missing`, false);
          allFieldsVerified = false;
        }
      }
      
      if (allFieldsVerified) {
        logResult('Database integrity verified', true);
      }
      
      // Check timestamps
      if (dbCustomer.createdAt && dbCustomer.updatedAt) {
        logResult('Timestamps created', true);
      } else {
        logResult('Timestamps', false);
      }
      
    } else {
      logResult('Customer found in database', false);
    }
  } else {
    logResult('Database verification', false, result.error.message);
  }
};

// Main test runner
const runAllTests = async () => {
  log('🧪 BobbaExpress - TC-002 Customer Creation Test Suite', 'blue');
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
  
  let createdCustomer = null;
  
  // Run all test cases
  createdCustomer = await testSuccessfulCustomerCreation(token);
  
  if (createdCustomer) {
    await testCustomerInTable(token, createdCustomer);
    await testDatabaseRecord(token, createdCustomer);
  }
  
  await testDuplicateEmail(token);
  await testDuplicatePhone(token);
  await testPhoneValidation(token);
  await testEmptyFieldsValidation(token);
  await testB2BWithoutCompany(token);
  
  // Final summary
  logSection('Test Summary');
  log('🎉 TC-002 Customer Creation Testing Complete!', 'blue');
  log('📊 Review the results above for any failed tests.', 'yellow');
  log('🔐 All validation and security features should be working.', 'yellow');
  
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Open browser and navigate to:', CLIENT_URL);
  console.log('2. Login with admin@bobba.com / Admin@1234');
  console.log('3. Navigate to Customers page');
  console.log('4. Click [+ Add Customer]');
  console.log('5. Fill form with test data:');
  console.log('   - Full Name: Ahmad Zulkifli');
  console.log('   - Email: ahmad@test.com');
  console.log('   - Phone: 9876543210');
  console.log('   - Address: No 5, Jalan Ampang, KL');
  console.log('   - Company: AZ Trading Sdn Bhd');
  console.log('   - Customer Type: Business');
  console.log('6. Click [Save Customer]');
  console.log('7. Verify success toast and customer appears in table');
  console.log('8. Test negative cases manually in the UI');
};

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  createCustomer,
  getCustomers,
  getAuthToken
};
