/**
 * Test AI Questions Endpoint
 */

const axios = require('axios');

const API_URL = 'https://cefr-production-e7c9.up.railway.app/api';
const ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';
const ADMIN_PASSWORD = 'akmal1221';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testAiQuestions() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const token = loginRes.data.access_token;
    console.log('✅ Login successful!\n');

    // Test: Create speaking question
    console.log('📝 Testing POST /ai-questions/speaking...');
    try {
      const speakingRes = await axios.post(`${API_URL}/ai-questions/speaking`, {
        part: 1,
        cefrLevel: 'B2',
        questionText: 'Tell me about your hometown',
        timeLimitSeconds: 60,
        isActive: true
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ POST /ai-questions/speaking - Success!');
      console.log('   Created question:', speakingRes.data.id);
    } catch (error) {
      console.log(`❌ POST /ai-questions/speaking - ${error.response?.status}: ${error.response?.data?.message || error.message}`);
    }

    // Test: Get speaking questions
    console.log('\n📋 Testing GET /ai-questions/speaking...');
    try {
      const getSpeakingRes = await axios.get(`${API_URL}/ai-questions/speaking`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ GET /ai-questions/speaking - Success!');
      console.log(`   Found ${getSpeakingRes.data.length} questions`);
    } catch (error) {
      console.log(`❌ GET /ai-questions/speaking - ${error.response?.status}: ${error.response?.data?.message || error.message}`);
    }

    // Test: Create writing question
    console.log('\n📝 Testing POST /ai-questions/writing...');
    try {
      const writingRes = await axios.post(`${API_URL}/ai-questions/writing`, {
        task: 1,
        cefrLevel: 'B2',
        promptText: 'Write an essay about the advantages and disadvantages of technology',
        minWords: 150,
        maxWords: 300,
        isActive: true
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ POST /ai-questions/writing - Success!');
      console.log('   Created question:', writingRes.data.id);
    } catch (error) {
      console.log(`❌ POST /ai-questions/writing - ${error.response?.status}: ${error.response?.data?.message || error.message}`);
    }

    // Test: Get writing questions
    console.log('\n📋 Testing GET /ai-questions/writing...');
    try {
      const getWritingRes = await axios.get(`${API_URL}/ai-questions/writing`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ GET /ai-questions/writing - Success!');
      console.log(`   Found ${getWritingRes.data.length} questions`);
    } catch (error) {
      console.log(`❌ GET /ai-questions/writing - ${error.response?.status}: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n✅ AI Questions test complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAiQuestions();
