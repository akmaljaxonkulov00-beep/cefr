/**
 * DELETE SINGLE MOCK BY ID
 */

const axios = require('axios');

const API_URL = 'https://cefr-production-e7c9.up.railway.app/api';
const ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';
const ADMIN_PASSWORD = 'akmal1221';
const MOCK_ID = 'cmq95pyq30004lfzhbp9c4ko1'; // The incomplete mock

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function deleteMock() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const token = loginRes.data.access_token;
    console.log('✅ Login successful!\n');

    // Try to delete
    console.log(`🗑️  Attempting to delete mock: ${MOCK_ID}`);
    try {
      await axios.delete(`${API_URL}/cefr/mocks/${MOCK_ID}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Mock deleted successfully!');
    } catch (error) {
      console.log(`❌ Delete failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      console.log('\nFull error:', error.response?.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deleteMock();
