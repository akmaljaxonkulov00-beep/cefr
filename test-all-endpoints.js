/**
 * FULL ENDPOINT TEST
 * Barcha xatolarni topish va tekshirish
 */

const axios = require('axios');

const API_URL = 'https://cefr-production-e7c9.up.railway.app/api';
const ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';
const ADMIN_PASSWORD = 'akmal1221';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let token = '';
let cefrMockId = '';

async function log(msg, status = '') {
  const color = status === 'OK' ? '\x1b[32m' : status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
  console.log(`${color}${msg}\x1b[0m`);
}

async function test() {
  try {
    // Login
    await log('🔐 Login...', '');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    token = loginRes.data.access_token;
    await log('✅ Login successful', 'OK');

    // Get CEFR mocks
    await log('\n📋 Getting CEFR mocks...', '');
    const mocksRes = await axios.get(`${API_URL}/cefr/mocks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const mocks = mocksRes.data;
    await log(`✅ Found ${mocks.length} mocks`, 'OK');
    
    if (mocks.length > 0) {
      cefrMockId = mocks[0].id;
      await log(`   Using mock ID: ${cefrMockId}`, '');
      await log(`   Mock: ${mocks[0].title}`, '');
      await log(`   Sections: ${JSON.stringify(mocks[0].sections ? Object.keys(mocks[0].sections) : 'undefined')}`, '');
    }

    // Test CEFR student endpoints
    await log('\n🎯 Testing CEFR Student Endpoints...', '');
    
    // 1. Get mock for exam
    try {
      const mockRes = await axios.get(`${API_URL}/cefr/student/mocks/${cefrMockId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await log('✅ GET /cefr/student/mocks/:id', 'OK');
    } catch (e) {
      await log(`❌ GET /cefr/student/mocks/:id - ${e.response?.status}`, 'FAIL');
    }

    // 2. Start mock
    try {
      const startRes = await axios.post(`${API_URL}/cefr/student/mocks/${cefrMockId}/start`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await log('✅ POST /cefr/student/mocks/:id/start', 'OK');
    } catch (e) {
      await log(`❌ POST /cefr/student/mocks/:id/start - ${e.response?.status}: ${e.response?.data?.message || e.message}`, 'FAIL');
    }

    // Test admin endpoints
    await log('\n👤 Testing Admin CEFR Endpoints...', '');
    
    try {
      const adminMockRes = await axios.get(`${API_URL}/cefr/mocks/${cefrMockId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await log('✅ GET /cefr/mocks/:id (admin)', 'OK');
    } catch (e) {
      await log(`❌ GET /cefr/mocks/:id - ${e.response?.status}`, 'FAIL');
    }

    // Test AI endpoints
    await log('\n🤖 Testing AI Endpoints...', '');
    
    try {
      const aiSpeakingRes = await axios.post(`${API_URL}/ai-questions/speaking`, {
        question: 'Test',
        part: 1,
        cefrLevel: 'B2',
        isActive: true
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await log('✅ POST /ai-questions/speaking', 'OK');
    } catch (e) {
      await log(`❌ POST /ai-questions/speaking - ${e.response?.status}: ${e.response?.data?.message || e.message}`, 'FAIL');
    }

    await log('\n✅ Test complete!', 'OK');

  } catch (error) {
    await log(`\n❌ Test failed: ${error.message}`, 'FAIL');
  }
}

test();
