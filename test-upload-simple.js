/**
 * Simple upload test - check if PDF upload works
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

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
    const token = loginRes.data.access_token || loginRes.data.token;
    console.log('✅ Login successful!');
    console.log('Token:', token.substring(0, 50) + '...');

    // Try to upload a small PDF
    console.log('\n📄 Testing PDF upload...');
    const pdfPath = 'mocklar/mock 1/Multilevelzonemock Day 109.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ PDF file not found:', pdfPath);
      return;
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));

    try {
      const response = await axios.post(`${API_URL}/ielts/upload/pdf`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      console.log('✅ PDF upload successful!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (uploadError) {
      console.log('❌ PDF upload failed!');
      console.log('Status:', uploadError.response?.status);
      console.log('Error:', uploadError.response?.data);
      console.log('Full error:', uploadError.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response:', error.response.data);
    }
  }
}

test();
