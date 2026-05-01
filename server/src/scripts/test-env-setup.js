/**
 * Test Environment Setup Script for BobbaExpress
 * 
 * This script verifies and sets up the complete test environment:
 * - Checks if dev server is running
 * - Verifies database connection
 * - Confirms test user accounts
 * - Checks API server status
 * - Validates email/SMS mock configuration
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Configuration
const SERVER_URL = process.env.API_URL || 'http://localhost:5000';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:8080';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bobbaexpress';

// Test accounts
const testAccounts = [
  { email: 'admin@bobba.com', password: 'Admin@1234', role: 'Admin' },
  { email: 'agent@bobba.com', password: 'Agent@1234', role: 'Agent' },
  { email: 'driver@bobba.com', password: 'Driver@1234', role: 'Driver' },
  { email: 'staff@bobba.com', password: 'Staff@1234', role: 'Staff' }
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const checkServer = async (url, name) => {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    log(`✅ ${name} is running (${url})`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${name} is not running (${url})`, 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
};

const checkDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    log('✅ Database connection successful', 'green');
    
    // Check if collections exist
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    log(`✅ Found ${collections.length} collections`, 'green');
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    return false;
  }
};

const checkTestUsers = async () => {
  try {
    const User = require('../../models/User');
    await mongoose.connect(MONGODB_URI);
    
    let allUsersExist = true;
    for (const account of testAccounts) {
      const user = await User.findOne({ email: account.email });
      if (user) {
        log(`✅ ${account.role} account exists: ${account.email}`, 'green');
      } else {
        log(`❌ ${account.role} account missing: ${account.email}`, 'red');
        allUsersExist = false;
      }
    }
    
    await mongoose.disconnect();
    return allUsersExist;
  } catch (error) {
    log(`❌ Error checking test users: ${error.message}`, 'red');
    return false;
  }
};

const checkEnvironmentVariables = () => {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NODE_ENV'
  ];
  
  const optionalVars = [
    'FAST2SMS_API_KEY',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASS'
  ];
  
  log('\n🔧 Environment Variables Check:', 'blue');
  
  let allRequiredPresent = true;
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log(`✅ ${varName} is set`, 'green');
    } else {
      log(`❌ ${varName} is missing`, 'red');
      allRequiredPresent = false;
    }
  }
  
  log('\n🔧 Optional Variables:', 'blue');
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      log(`✅ ${varName} is set`, 'green');
    } else {
      log(`⚠️  ${varName} is not set (using mock mode)`, 'yellow');
    }
  }
  
  return allRequiredPresent;
};

const checkEmailSMSConfiguration = () => {
  log('\n📧 Email/SMS Configuration:', 'blue');
  
  // Check SMS configuration
  if (process.env.FAST2SMS_API_KEY) {
    log('✅ Fast2SMS API key is configured', 'green');
  } else {
    log('⚠️  Fast2SMS API key not found - using mock mode', 'yellow');
    log('   SMS messages will be logged to console', 'yellow');
  }
  
  // Check email configuration
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    log('✅ Email configuration is complete', 'green');
  } else {
    log('⚠️  Email configuration incomplete - using mock mode', 'yellow');
    log('   Emails will be logged to console', 'yellow');
  }
};

const displayTestAccounts = () => {
  log('\n👥 Test Accounts:', 'blue');
  log('┌─────────────────────────────────────────────────┐', 'blue');
  log('│ Email              │ Role   │ Password         │', 'blue');
  log('├─────────────────────────────────────────────────┤', 'blue');
  
  for (const account of testAccounts) {
    log(`│ ${account.email.padEnd(18)} │ ${account.role.padEnd(6)} │ ${account.password.padEnd(16)} │`, 'blue');
  }
  
  log('└─────────────────────────────────────────────────┘', 'blue');
};

const displayNextSteps = () => {
  log('\n🚀 Next Steps:', 'blue');
  log('1. Start the development server:', 'yellow');
  log('   npm run dev', 'white');
  log('');
  log('2. Access the application:', 'yellow');
  log(`   Client: ${CLIENT_URL}`, 'white');
  log(`   API: ${SERVER_URL}`, 'white');
  log('');
  log('3. Run tests:', 'yellow');
  log('   npm run test:setup', 'white');
  log('');
  log('4. Test TC-009:', 'yellow');
  log('   node test_tc009.js', 'white');
};

const main = async () => {
  log('🧪 BobbaExpress Test Environment Setup', 'blue');
  log('='.repeat(50), 'blue');
  
  let allChecksPass = true;
  
  // Check servers
  log('\n🖥️  Server Status Check:', 'blue');
  const serverRunning = await checkServer(SERVER_URL, 'API Server');
  const clientRunning = await checkServer(CLIENT_URL, 'Client Server');
  
  if (!serverRunning) {
    log('\n💡 To start the API server:', 'yellow');
    log('   cd server && npm run dev', 'white');
    allChecksPass = false;
  }
  
  if (!clientRunning) {
    log('\n💡 To start the client server:', 'yellow');
    log('   cd client && npm run dev', 'white');
    allChecksPass = false;
  }
  
  // Check database
  log('\n🗄️  Database Check:', 'blue');
  const dbConnected = await checkDatabase();
  if (!dbConnected) {
    log('\n💡 Make sure MongoDB is running:', 'yellow');
    log('   mongod', 'white');
    allChecksPass = false;
  }
  
  // Check test users
  log('\n👤 Test Users Check:', 'blue');
  const usersExist = await checkTestUsers();
  if (!usersExist) {
    log('\n💡 To create test users:', 'yellow');
    log('   npm run db:seed', 'white');
    allChecksPass = false;
  }
  
  // Check environment variables
  const envVarsOk = checkEnvironmentVariables();
  if (!envVarsOk) {
    allChecksPass = false;
  }
  
  // Check email/SMS configuration
  checkEmailSMSConfiguration();
  
  // Display test accounts
  displayTestAccounts();
  
  // Summary
  log('\n📊 Setup Summary:', 'blue');
  if (allChecksPass && serverRunning && clientRunning && dbConnected && usersExist) {
    log('🎉 Test environment is fully configured!', 'green');
    log('✅ All checks passed - ready for testing!', 'green');
  } else {
    log('⚠️  Some checks failed - please address the issues above', 'yellow');
    log('🔧 Run the suggested commands to fix the issues', 'yellow');
  }
  
  // Display next steps
  displayNextSteps();
  
  process.exit(allChecksPass ? 0 : 1);
};

// Run the setup check
if (require.main === module) {
  main();
}

module.exports = main;
