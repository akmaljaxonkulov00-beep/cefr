/**
 * ADMIN PANEL FULL TEST
 * Admin panelning barcha funksiyalarini tekshirish
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
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

let token = '';
let testIds = {
  cefrMock: '',
  ieltsMock: '',
  speakingQuestion: '',
  writingQuestion: ''
};

async function runTests() {
  try {
    log('\n🔐 1. LOGIN TEST', 'blue');
    log('═'.repeat(60), 'blue');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    token = loginRes.data.access_token;
    log('✅ Login successful', 'green');

    // ==================== CEFR MOCKS ====================
    log('\n📚 2. CEFR MOCK TESTS', 'blue');
    log('═'.repeat(60), 'blue');

    // 2.1 Get all CEFR mocks
    log('\n2.1 GET /api/cefr/mocks', 'yellow');
    try {
      const res = await axios.get(`${API_URL}/cefr/mocks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log(`✅ Success - Found ${res.data.length} mocks`, 'green');
      if (res.data.length > 0) {
        testIds.cefrMock = res.data[0].id;
        log(`   Using mock ID: ${testIds.cefrMock}`, 'reset');
      }
    } catch (e) {
      log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
    }

    // 2.2 Get single CEFR mock
    if (testIds.cefrMock) {
      log('\n2.2 GET /api/cefr/mocks/:id', 'yellow');
      try {
        const res = await axios.get(`${API_URL}/cefr/mocks/${testIds.cefrMock}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        log(`✅ Success - Mock: ${res.data.title}`, 'green');
        log(`   Sections: L:${res.data.listening?'✓':'✗'} R:${res.data.reading?'✓':'✗'} W:${res.data.writing?'✓':'✗'} S:${res.data.speaking?'✓':'✗'}`, 'reset');
      } catch (e) {
        log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
      }

      // 2.3 Update CEFR mock
      log('\n2.3 PATCH /api/cefr/mocks/:id', 'yellow');
      try {
        const res = await axios.patch(`${API_URL}/cefr/mocks/${testIds.cefrMock}`, {
          description: 'Test update - ' + Date.now()
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        log(`✅ Success - Mock updated`, 'green');
      } catch (e) {
        log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
      }

      // 2.4 Toggle status
      log('\n2.4 PATCH /api/cefr/mocks/:id/status', 'yellow');
      try {
        const res = await axios.patch(`${API_URL}/cefr/mocks/${testIds.cefrMock}/status`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        log(`✅ Success - Status: ${res.data.status}`, 'green');
      } catch (e) {
        log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
      }

      // 2.5 Get mock results
      log('\n2.5 GET /api/cefr/mocks/:id/results', 'yellow');
      try {
        const res = await axios.get(`${API_URL}/cefr/mocks/${testIds.cefrMock}/results`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        log(`✅ Success - Found ${res.data.length} attempts`, 'green');
      } catch (e) {
        log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
      }
    }

    // ==================== IELTS MOCKS ====================
    log('\n📘 3. IELTS MOCK TESTS', 'blue');
    log('═'.repeat(60), 'blue');

    // 3.1 Get all IELTS mocks
    log('\n3.1 GET /api/ielts/mocks', 'yellow');
    try {
      const res = await axios.get(`${API_URL}/ielts/mocks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log(`✅ Success - Found ${res.data.length} mocks`, 'green');
      if (res.data.length > 0) {
        testIds.ieltsMock = res.data[0].id;
      }
    } catch (e) {
      log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
    }

    // 3.2 Get single IELTS mock
    if (testIds.ieltsMock) {
      log('\n3.2 GET /api/ielts/mocks/:id', 'yellow');
      try {
        const res = await axios.get(`${API_URL}/ielts/mocks/${testIds.ieltsMock}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        log(`✅ Success - Mock: ${res.data.title}`, 'green');
      } catch (e) {
        log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
      }
    }

    // ==================== AI QUESTIONS ====================
    log('\n🤖 4. AI QUESTIONS TESTS', 'blue');
    log('═'.repeat(60), 'blue');

    // 4.1 Get speaking questions
    log('\n4.1 GET /api/ai-questions/speaking', 'yellow');
    try {
      const res = await axios.get(`${API_URL}/ai-questions/speaking`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log(`✅ Success - Found ${res.data.length} questions`, 'green');
      if (res.data.length > 0) {
        testIds.speakingQuestion = res.data[0].id;
      }
    } catch (e) {
      log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
    }

    // 4.2 Create speaking question
    log('\n4.2 POST /api/ai-questions/speaking', 'yellow');
    try {
      const res = await axios.post(`${API_URL}/ai-questions/speaking`, {
        part: 1,
        cefrLevel: 'B2',
        questionText: 'What is your favorite hobby?',
        timeLimitSeconds: 60,
        isActive: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log(`✅ Success - Question created: ${res.data.id}`, 'green');
      testIds.speakingQuestion = res.data.id;
    } catch (e) {
      log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
    }

    // 4.3 Update speaking question
    if (testIds.speakingQuestion) {
      log('\n4.3 PUT /api/ai-questions/speaking/:id', 'yellow');
      try {
        const res = await axios.put(`${API_URL}/ai-questions/speaking/${testIds.speakingQuestion}`, {
          questionText: 'What is your favorite hobby? (Updated)'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        log(`✅ Success - Question updated`, 'green');
      } catch (e) {
        log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
      }

      // 4.4 Toggle speaking question
      log('\n4.4 PUT /api/ai-questions/speaking/:id/toggle', 'yellow');
      try {
        const res = await axios.put(`${API_URL}/ai-questions/speaking/${testIds.speakingQuestion}/toggle`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        log(`✅ Success - Question toggled`, 'green');
      } catch (e) {
        log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
      }
    }

    // 4.5 Get writing questions
    log('\n4.5 GET /api/ai-questions/writing', 'yellow');
    try {
      const res = await axios.get(`${API_URL}/ai-questions/writing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log(`✅ Success - Found ${res.data.length} questions`, 'green');
      if (res.data.length > 0) {
        testIds.writingQuestion = res.data[0].id;
      }
    } catch (e) {
      log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
    }

    // 4.6 Create writing question
    log('\n4.6 POST /api/ai-questions/writing', 'yellow');
    try {
      const res = await axios.post(`${API_URL}/ai-questions/writing`, {
        task: 1,
        cefrLevel: 'B2',
        promptText: 'Write about the importance of education',
        minWords: 150,
        maxWords: 300,
        isActive: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log(`✅ Success - Question created: ${res.data.id}`, 'green');
    } catch (e) {
      log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
    }

    // ==================== QUESTION BANK ====================
    log('\n📖 5. QUESTION BANK TESTS', 'blue');
    log('═'.repeat(60), 'blue');

    // 5.1 Get all questions
    log('\n5.1 GET /api/question-bank', 'yellow');
    try {
      const res = await axios.get(`${API_URL}/question-bank`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log(`✅ Success - Found ${res.data.length} questions`, 'green');
    } catch (e) {
      log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
    }

    // ==================== USERS ====================
    log('\n👥 6. USER MANAGEMENT TESTS', 'blue');
    log('═'.repeat(60), 'blue');

    // 6.1 Get all users
    log('\n6.1 GET /api/users', 'yellow');
    try {
      const res = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log(`✅ Success - Found ${res.data.length} users`, 'green');
    } catch (e) {
      log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
    }

    // ==================== ANALYTICS ====================
    log('\n📊 7. ANALYTICS TESTS', 'blue');
    log('═'.repeat(60), 'blue');

    // 7.1 Get analytics
    log('\n7.1 GET /api/analytics/admin', 'yellow');
    try {
      const res = await axios.get(`${API_URL}/analytics/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log(`✅ Success - Analytics retrieved`, 'green');
    } catch (e) {
      log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
    }

    // ==================== MANUAL PAYMENTS ====================
    log('\n💰 8. MANUAL PAYMENT TESTS', 'blue');
    log('═'.repeat(60), 'blue');

    // 8.1 Get pending payments
    log('\n8.1 GET /api/manual-payments/pending', 'yellow');
    try {
      const res = await axios.get(`${API_URL}/manual-payments/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log(`✅ Success - Found ${res.data.length} pending payments`, 'green');
    } catch (e) {
      log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
    }

    // 8.2 Get approved payments
    log('\n8.2 GET /api/manual-payments/approved', 'yellow');
    try {
      const res = await axios.get(`${API_URL}/manual-payments/approved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log(`✅ Success - Found ${res.data.length} approved payments`, 'green');
    } catch (e) {
      log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
    }

    // 8.3 Get rejected payments
    log('\n8.3 GET /api/manual-payments/rejected', 'yellow');
    try {
      const res = await axios.get(`${API_URL}/manual-payments/rejected`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      log(`✅ Success - Found ${res.data.length} rejected payments`, 'green');
    } catch (e) {
      log(`❌ Failed: ${e.response?.status} - ${e.response?.data?.message || e.message}`, 'red');
    }

    // ==================== SUMMARY ====================
    log('\n\n' + '═'.repeat(60), 'magenta');
    log('📊 TEST SUMMARY', 'magenta');
    log('═'.repeat(60), 'magenta');
    log('\n✅ All admin panel functions tested!', 'green');
    log('   Check results above for any failures', 'yellow');

  } catch (error) {
    log(`\n❌ CRITICAL ERROR: ${error.message}`, 'red');
    console.error(error);
  }
}

runTests();
