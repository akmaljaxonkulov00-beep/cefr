/**
 * DELETE ALL CEFR MOCKS
 * Barcha CEFR mock'larni o'chirish
 */

const axios = require('axios');

const API_URL = 'https://cefr-production-e7c9.up.railway.app/api';
const ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';
const ADMIN_PASSWORD = 'akmal1221';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function deleteAllMocks() {
  try {
    // Login
    log('🔐 Logging in...', 'blue');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const token = loginRes.data.access_token;
    log('✅ Login successful!', 'green');

    // Get all CEFR mocks
    log('\n📋 Fetching all CEFR mocks...', 'blue');
    const mocksRes = await axios.get(`${API_URL}/cefr/mocks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const mocks = mocksRes.data;
    log(`Found ${mocks.length} mocks`, 'yellow');

    if (mocks.length === 0) {
      log('No mocks to delete!', 'yellow');
      return;
    }

    // Delete each mock
    log('\n🗑️  Deleting mocks...', 'blue');
    for (const mock of mocks) {
      try {
        await axios.delete(`${API_URL}/cefr/mocks/${mock.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        log(`  ✅ Deleted: ${mock.title}`, 'green');
      } catch (error) {
        log(`  ❌ Failed to delete ${mock.title}: ${error.message}`, 'red');
      }
    }

    log('\n✅ All mocks deleted!', 'green');
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
}

deleteAllMocks();
