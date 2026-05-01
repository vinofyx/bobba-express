/**
 * Test Case TC-001: Login Functionality
 * 
 * This script tests the complete login workflow including:
 * - Successful login with correct credentials
 * - Negative test cases (wrong password, empty fields, etc.)
 * - Security features (brute force protection, SQL injection)
 * - Authentication redirects and JWT cookie handling
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:8080';

// Test credentials
const VALID_CREDENTIALS = {
  email: 'admin@bobba.com',
  password: 'Admin@1234'
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

// Helper function to make login request
const loginRequest = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    }, {
      withCredentials: true, // Important for cookies
      timeout: 5000
    });
    return { success: true, data: response.data, cookies: response.headers['set-cookie'] };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || { message: error.message },
      status: error.response?.status 
    };
  }
};

// Helper function to check protected route
const checkProtectedRoute = async (cookies) => {
  try {
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        Cookie: cookies?.join('; ') || ''
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

// Test 1: Successful Login
const testSuccessfulLogin = async () => {
  logSection('TC-001: Successful Login Test');
  
  const { email, password } = VALID_CREDENTIALS;
  
  log(`📧 Testing login with: ${email}`);
  log(`🔑 Password: ${password}`);
  
  const result = await loginRequest(email, password);
  
  if (result.success) {
    logResult('Successful login', true);
    
    const { data } = result.data;
    if (data.user && data.accessToken) {
      logResult('User data returned', true);
      logResult('Access token generated', true);
      logResult(`User role: ${data.user.role}`, true);
    } else {
      logResult('Missing user data or token', false);
    }
    
    // Check if JWT cookie is set
    if (result.cookies && result.cookies.length > 0) {
      logResult('JWT refresh cookie set', true);
      const refreshCookie = result.cookies.find(cookie => cookie.includes('refreshToken'));
      if (refreshCookie) {
        logResult('RefreshToken cookie found', true);
        log(`🍪 Cookie: ${refreshCookie.split(';')[0]}`, 'cyan');
      } else {
        logResult('RefreshToken cookie missing', false);
      }
    } else {
      logResult('No cookies set', false);
    }
    
    // Test protected route access
    const protectedResult = await checkProtectedRoute(result.cookies);
    if (protectedResult.success) {
      logResult('Protected route accessible', true);
      logResult('Authentication working', true);
    } else {
      logResult('Protected route access failed', false);
    }
    
  } else {
    logResult('Successful login', false, result.error.message);
  }
};

// Test 2: Wrong Password
const testWrongPassword = async () => {
  logSection('TC-001a: Wrong Password Test');
  
  const result = await loginRequest(VALID_CREDENTIALS.email, 'WrongPassword123');
  
  if (!result.success && result.status === 401) {
    logResult('Wrong password rejected', true);
    
    if (result.error.message && result.error.message.toLowerCase().includes('invalid')) {
      logResult('Generic error message returned', true);
      log('🔒 Security: Generic message prevents email enumeration', 'yellow');
    } else {
      logResult('Error message check', false);
    }
  } else {
    logResult('Wrong password test', false, 'Should return 401');
  }
};

// Test 3: Empty Email
const testEmptyEmail = async () => {
  logSection('TC-001b: Empty Email Test');
  
  const result = await loginRequest('', VALID_CREDENTIALS.password);
  
  if (!result.success && result.status === 400) {
    logResult('Empty email rejected', true);
    
    if (result.error.message && result.error.message.includes('required')) {
      logResult('Proper validation message', true);
    } else {
      logResult('Validation message check', false);
    }
  } else {
    logResult('Empty email test', false, 'Should return 400');
  }
};

// Test 4: Invalid Email Format
const testInvalidEmailFormat = async () => {
  logSection('TC-001c: Invalid Email Format Test');
  
  const invalidEmails = [
    'invalid-email',
    'user@',
    '@domain.com',
    'user.domain.com',
    'user@domain',
    ''
  ];
  
  for (const email of invalidEmails) {
    const result = await loginRequest(email, VALID_CREDENTIALS.password);
    
    if (!result.success && (result.status === 400 || result.status === 422)) {
      logResult(`Invalid email rejected: ${email}`, true);
    } else {
      logResult(`Invalid email test: ${email}`, false);
    }
  }
};

// Test 5: SQL Injection Protection
const testSQLInjectionProtection = async () => {
  logSection('TC-001d: SQL Injection Protection Test');
  
  const sqlInjectionAttempts = [
    "admin@bobba.com'; DROP TABLE users; --",
    "admin@bobba.com' OR '1'='1",
    "admin@bobba.com' UNION SELECT * FROM users --",
    "'; DELETE FROM users WHERE '1'='1' --",
    "admin@bobba.com'; INSERT INTO users VALUES ('hacker@evil.com', 'password'); --"
  ];
  
  for (const payload of sqlInjectionAttempts) {
    const result = await loginRequest(payload, VALID_CREDENTIALS.password);
    
    if (!result.success) {
      logResult(`SQL injection blocked: ${payload.substring(0, 30)}...`, true);
    } else {
      logResult(`SQL injection vulnerability: ${payload.substring(0, 30)}...`, false);
    }
  }
};

// Test 6: Brute Force Protection
const testBruteForceProtection = async () => {
  logSection('TC-001e: Brute Force Protection Test');
  
  log('🔨 Testing 5 consecutive failed login attempts...');
  
  let failedAttempts = 0;
  const maxAttempts = 5;
  
  for (let i = 1; i <= maxAttempts; i++) {
    const result = await loginRequest(VALID_CREDENTIALS.email, `WrongPassword${i}`);
    
    if (!result.success) {
      failedAttempts++;
      log(`Attempt ${i}: Failed (${result.status})`, 'yellow');
    } else {
      log(`Attempt ${i}: Unexpected success`, 'red');
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (failedAttempts === maxAttempts) {
    logResult('All failed attempts properly rejected', true);
    
    // Try one more time with correct password to check for lockout
    const lockoutTest = await loginRequest(VALID_CREDENTIALS.email, VALID_CREDENTIALS.password);
    
    if (!lockoutTest.success) {
      logResult('Account locked after brute force', true);
      log('🔒 Security: Brute force protection active', 'yellow');
    } else {
      logResult('Brute force protection not working', false);
    }
  } else {
    logResult('Brute force test setup', false);
  }
};

// Test 7: Direct Dashboard Access
const testDirectDashboardAccess = async () => {
  logSection('TC-001f: Direct Dashboard Access Test');
  
  // Try to access protected route without authentication
  const result = await checkProtectedRoute();
  
  if (!result.success && result.status === 401) {
    logResult('Direct dashboard access blocked', true);
    logResult('Authentication required', true);
    log('🔒 Security: Protected routes properly secured', 'yellow');
  } else {
    logResult('Direct dashboard access', false, 'Should return 401');
  }
};

// Test 8: Additional Security Tests
const testAdditionalSecurity = async () => {
  logSection('Additional Security Tests');
  
  // Test with null/undefined values
  const nullTests = [
    { email: null, password: VALID_CREDENTIALS.password },
    { email: VALID_CREDENTIALS.email, password: null },
    { email: undefined, password: VALID_CREDENTIALS.password },
    { email: VALID_CREDENTIALS.email, password: undefined }
  ];
  
  for (const test of nullTests) {
    const result = await loginRequest(test.email, test.password);
    if (!result.success) {
      logResult('Null/undefined input rejected', true);
    } else {
      logResult('Null/undefined input vulnerability', false);
    }
  }
  
  // Test with very long inputs
  const longEmail = 'a'.repeat(300) + '@bobba.com';
  const longPassword = 'a'.repeat(1000);
  
  const longResult = await loginRequest(longEmail, longPassword);
  if (!longResult.success) {
    logResult('Long input rejected', true);
  } else {
    logResult('Long input vulnerability', false);
  }
};

// Main test runner
const runAllTests = async () => {
  log('🧪 BobbaExpress - TC-001 Login Functionality Test Suite', 'blue');
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
  
  // Run all test cases
  await testSuccessfulLogin();
  await testWrongPassword();
  await testEmptyEmail();
  await testInvalidEmailFormat();
  await testSQLInjectionProtection();
  await testBruteForceProtection();
  await testDirectDashboardAccess();
  await testAdditionalSecurity();
  
  // Final summary
  logSection('Test Summary');
  log('🎉 TC-001 Login Testing Complete!', 'blue');
  log('📊 Review the results above for any failed tests.', 'yellow');
  log('🔐 All security features should be properly implemented.', 'yellow');
  
  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Open browser and navigate to:', CLIENT_URL);
  console.log('2. Try to access /dashboard directly - should redirect to /login');
  console.log('3. Login with admin@bobba.com / Admin@1234');
  console.log('4. Verify redirect to /dashboard');
  console.log('5. Check browser cookies for refreshToken');
  console.log('6. Verify sidebar is visible');
  console.log('7. Test negative cases manually in the UI');
};

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  loginRequest,
  checkProtectedRoute
};
