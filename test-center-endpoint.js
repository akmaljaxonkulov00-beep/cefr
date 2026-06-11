const axios = require('axios');

const API_URL = 'https://cefr-production-e7c9.up.railway.app/api';
const ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';
const ADMIN_PASSWORD = 'akmal1221';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function test() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const token = loginRes.data.access_token;
    console.log('✅ Login successful\n');

    // Get all centers
    console.log('📋 Getting all centers...');
    const centersRes = await axios.get(`${API_URL}/centers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found ${centersRes.data.length} centers\n`);

    if (centersRes.data.length > 0) {
      const centerId = centersRes.data[0].id;
      console.log(`Testing GET /api/centers/${centerId}...`);
      
      try {
        const res = await axios.get(`${API_URL}/centers/${centerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Success!');
        console.log('Center data:', JSON.stringify(res.data, null, 2));
      } catch (e) {
        console.log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`);
        console.log('Response:', e.response?.data);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
