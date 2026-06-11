/**
 * API TEST SCRIPT - CEFR Platform
 * Barcha endpointlarni test qiladi va xatolarni topadi
 */

const axios = require('axios');

const API_URL = 'https://cefr-production-e7c9.up.railway.app/api';
const FRONTEND_URL = 'https://cefr-six.vercel.app';

// Login credentials
const ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';
const ADMIN_PASSWORD = 'akmal1221';

let authToken = '';
let testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${symbol} ${name}`, color);
  if (details) log(`   ${details}`, 'reset');
}

// Test helper
async function testEndpoint(name, method, endpoint, data = null, requiresAuth = true) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {}
    };

    if (requiresAuth && authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    testResults.passed.push(name);
    logTest(name, 'PASS', `Status: ${response.status}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    if (status === 401 || status === 403) {
      testResults.warnings.push({ name, status, message });
      logTest(name, 'WARN', `Status: ${status} - ${message}`);
    } else {
      testResults.failed.push({ name, status, message });
      logTest(name, 'FAIL', `Status: ${status} - ${message}`);
    }
    return { success: false, status, message };
  }
}

// Login function
async function login() {
  log('\n🔐 Logging in as Admin...', 'blue');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    // Token might be in data.token or data.access_token or just data
    authToken = response.data.token || response.data.access_token || response.data.accessToken;
    
    if (!authToken) {
      log(`⚠️  Token not found in response. Full response:`, 'yellow');
      log(JSON.stringify(response.data, null, 2), 'yellow');
      // Try to use the whole response as token if it's a string
      if (typeof response.data === 'string') {
        authToken = response.data;
      }
    }
    
    if (authToken) {
      log(`✅ Login successful! Token: ${authToken.substring(0, 20)}...`, 'green');
      return true;
    } else {
      log(`❌ No token received!`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Login failed: ${error.message}`, 'red');
    if (error.response?.data) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    if (error.response?.status) {
      log(`   Status: ${error.response.status}`, 'red');
    }
    return false;
  }
}

// Test suites
async function testHealthCheck() {
  log('\n📊 Testing Health Check...', 'magenta');
  await testEndpoint('Health Check', 'GET', '/health', null, false);
}

async function testQuestionBank() {
  log('\n📚 Testing Question Bank...', 'magenta');
  await testEndpoint('Get All Questions', 'GET', '/question-bank');
  await testEndpoint('Get Questions (Speaking)', 'GET', '/question-bank?type=speaking&examType=IELTS');
  await testEndpoint('Get Questions (Writing)', 'GET', '/question-bank?type=writing&examType=CEFR');
}

async function testManualPayments() {
  log('\n💳 Testing Manual Payments...', 'magenta');
  await testEndpoint('Get Pending Payments', 'GET', '/manual-payments/pending');
  await testEndpoint('Get Approved Payments', 'GET', '/manual-payments/approved');
  await testEndpoint('Get Rejected Payments', 'GET', '/manual-payments/rejected');
  await testEndpoint('Get All Payments', 'GET', '/manual-payments/all');
  await testEndpoint('Get My Payments', 'GET', '/manual-payments/mine');
}

async function testExams() {
  log('\n📝 Testing Exams...', 'magenta');
  await testEndpoint('Get All Exams', 'GET', '/exams');
  await testEndpoint('Get Center Results', 'GET', '/exams/results/center');
  await testEndpoint('Get My Results', 'GET', '/exams/results/mine');
}

async function testSettings() {
  log('\n⚙️ Testing Settings...', 'magenta');
  await testEndpoint('Get Admin Settings', 'GET', '/admin/settings');
  await testEndpoint('Get Pricing', 'GET', '/admin/settings/pricing');
  await testEndpoint('Get Payment Cards', 'GET', '/admin/settings/payment-cards');
  await testEndpoint('Get Active Payment Card (Public)', 'GET', '/settings/payment-cards/active', null, false);
}

async function testAIQuestions() {
  log('\n🤖 Testing AI Questions...', 'magenta');
  await testEndpoint('Get Speaking Questions', 'GET', '/ai-questions/speaking');
  await testEndpoint('Get Writing Questions', 'GET', '/ai-questions/writing');
  await testEndpoint('Get Speaking Questions (Active)', 'GET', '/ai-questions/speaking?isActive=true');
}

async function testUsers() {
  log('\n👥 Testing Users...', 'magenta');
  await testEndpoint('Get Center Students', 'GET', '/users/center-students');
  await testEndpoint('Get All Users', 'GET', '/users');
}

async function testCenters() {
  log('\n🏢 Testing Centers...', 'magenta');
  await testEndpoint('Get All Centers', 'GET', '/centers');
}

async function testIELTS() {
  log('\n📖 Testing IELTS...', 'magenta');
  await testEndpoint('Get IELTS Mocks', 'GET', '/ielts/mocks');
}

async function testCEFR() {
  log('\n📗 Testing CEFR...', 'magenta');
  await testEndpoint('Get CEFR Mocks', 'GET', '/cefr/mocks');
}

// Summary
function printSummary() {
  log('\n' + '='.repeat(60), 'blue');
  log('📊 TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  
  log(`\n✅ PASSED: ${testResults.passed.length}`, 'green');
  testResults.passed.forEach(name => log(`   • ${name}`, 'green'));
  
  if (testResults.warnings.length > 0) {
    log(`\n⚠️  WARNINGS: ${testResults.warnings.length}`, 'yellow');
    testResults.warnings.forEach(({ name, status, message }) => {
      log(`   • ${name} (${status}): ${message}`, 'yellow');
    });
  }
  
  if (testResults.failed.length > 0) {
    log(`\n❌ FAILED: ${testResults.failed.length}`, 'red');
    testResults.failed.forEach(({ name, status, message }) => {
      log(`   • ${name} (${status}): ${message}`, 'red');
    });
  }
  
  const total = testResults.passed.length + testResults.failed.length + testResults.warnings.length;
  const successRate = ((testResults.passed.length / total) * 100).toFixed(1);
  
  log(`\n📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 50 ? 'yellow' : 'red');
  log('='.repeat(60), 'blue');
}

// Main test runner
async function runTests() {
  log('🚀 Starting API Tests...', 'blue');
  log(`Frontend: ${FRONTEND_URL}`, 'blue');
  log(`Backend: ${API_URL}`, 'blue');
  log('='.repeat(60), 'blue');

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ Cannot proceed without authentication!', 'red');
    return;
  }

  // Run all test suites
  await testHealthCheck();
  await testQuestionBank();
  await testManualPayments();
  await testExams();
  await testSettings();
  await testAIQuestions();
  await testUsers();
  await testCenters();
  await testIELTS();
  await testCEFR();

  // Print summary
  printSummary();

  // Exit with appropriate code
  if (testResults.failed.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n💥 Test runner crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
