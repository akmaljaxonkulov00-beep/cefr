/**
 * COMPLETE ADMIN PANEL TEST
 * Frontend va backend barcha admin funksiyalarini tekshirish
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

let token = '';
let testData = {
  cefrMockId: '',
  ieltsMockId: '',
  userId: '',
  centerId: '',
  speakingQuestionId: '',
  writingQuestionId: ''
};

let results = {
  passed: 0,
  failed: 0,
  tests: []
};

async function test(name, fn) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    log(`✅ ${name}`, 'green');
    return true;
  } catch (e) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: e.response?.status + ': ' + (e.response?.data?.message || e.message) });
    log(`❌ ${name} - ${e.response?.status}: ${e.response?.data?.message || e.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     ADMIN PANEL COMPLETE FUNCTIONALITY TEST               ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  // ==================== AUTHENTICATION ====================
  log('1️⃣  AUTHENTICATION', 'blue');
  log('─'.repeat(60), 'blue');
  
  await test('Login', async () => {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    token = res.data.access_token;
    if (!token) throw new Error('No token received');
  });

  // ==================== USERS ====================
  log('\n2️⃣  USER MANAGEMENT', 'blue');
  log('─'.repeat(60), 'blue');

  await test('Get all users', async () => {
    const res = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.length > 0) testData.userId = res.data[0].id;
  });

  if (testData.userId) {
    await test('Update user role', async () => {
      await axios.patch(`${API_URL}/users/${testData.userId}/role`, 
        { role: 'STUDENT' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    });
  }

  // ==================== CENTERS ====================
  log('\n3️⃣  CENTER MANAGEMENT', 'blue');
  log('─'.repeat(60), 'blue');

  await test('Get all centers', async () => {
    const res = await axios.get(`${API_URL}/centers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.length > 0) testData.centerId = res.data[0].id;
  });

  await test('Create center', async () => {
    const res = await axios.post(`${API_URL}/centers`, {
      name: 'Test Center ' + Date.now(),
      address: 'Test Address'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    testData.centerId = res.data.id;
  });

  if (testData.centerId) {
    await test('Get center by ID', async () => {
      await axios.get(`${API_URL}/centers/${testData.centerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });

    await test('Update center', async () => {
      await axios.patch(`${API_URL}/centers/${testData.centerId}`, {
        address: 'Updated Address'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });
  }

  // ==================== CEFR MOCKS ====================
  log('\n4️⃣  CEFR MOCK MANAGEMENT', 'blue');
  log('─'.repeat(60), 'blue');

  await test('Get all CEFR mocks', async () => {
    const res = await axios.get(`${API_URL}/cefr/mocks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.length > 0) testData.cefrMockId = res.data[0].id;
  });

  if (testData.cefrMockId) {
    await test('Get CEFR mock by ID', async () => {
      await axios.get(`${API_URL}/cefr/mocks/${testData.cefrMockId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });

    await test('Update CEFR mock', async () => {
      await axios.patch(`${API_URL}/cefr/mocks/${testData.cefrMockId}`, {
        description: 'Test update ' + Date.now()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });

    await test('Toggle CEFR mock status', async () => {
      await axios.patch(`${API_URL}/cefr/mocks/${testData.cefrMockId}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });

    await test('Get CEFR mock results', async () => {
      await axios.get(`${API_URL}/cefr/mocks/${testData.cefrMockId}/results`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });
  }

  // ==================== IELTS MOCKS ====================
  log('\n5️⃣  IELTS MOCK MANAGEMENT', 'blue');
  log('─'.repeat(60), 'blue');

  await test('Get all IELTS mocks', async () => {
    const res = await axios.get(`${API_URL}/ielts/mocks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.length > 0) testData.ieltsMockId = res.data[0].id;
  });

  if (testData.ieltsMockId) {
    await test('Get IELTS mock by ID', async () => {
      await axios.get(`${API_URL}/ielts/mocks/${testData.ieltsMockId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });

    await test('Update IELTS mock', async () => {
      await axios.patch(`${API_URL}/ielts/mocks/${testData.ieltsMockId}`, {
        description: 'Test update'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });
  }

  // ==================== AI QUESTIONS ====================
  log('\n6️⃣  AI QUESTIONS MANAGEMENT', 'blue');
  log('─'.repeat(60), 'blue');

  await test('Get speaking questions', async () => {
    const res = await axios.get(`${API_URL}/ai-questions/speaking`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.length > 0) testData.speakingQuestionId = res.data[0].id;
  });

  await test('Create speaking question', async () => {
    const res = await axios.post(`${API_URL}/ai-questions/speaking`, {
      part: 1,
      cefrLevel: 'B2',
      questionText: 'Test question ' + Date.now(),
      timeLimitSeconds: 60,
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    testData.speakingQuestionId = res.data.id;
  });

  if (testData.speakingQuestionId) {
    await test('Get speaking question by ID', async () => {
      await axios.get(`${API_URL}/ai-questions/speaking/${testData.speakingQuestionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });

    await test('Update speaking question', async () => {
      await axios.put(`${API_URL}/ai-questions/speaking/${testData.speakingQuestionId}`, {
        questionText: 'Updated question'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });

    await test('Toggle speaking question', async () => {
      await axios.put(`${API_URL}/ai-questions/speaking/${testData.speakingQuestionId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });

    await test('Delete speaking question', async () => {
      await axios.delete(`${API_URL}/ai-questions/speaking/${testData.speakingQuestionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });
  }

  await test('Get writing questions', async () => {
    const res = await axios.get(`${API_URL}/ai-questions/writing`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.length > 0) testData.writingQuestionId = res.data[0].id;
  });

  await test('Create writing question', async () => {
    const res = await axios.post(`${API_URL}/ai-questions/writing`, {
      task: 1,
      cefrLevel: 'B2',
      promptText: 'Test prompt ' + Date.now(),
      minWords: 150,
      maxWords: 300,
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    testData.writingQuestionId = res.data.id;
  });

  if (testData.writingQuestionId) {
    await test('Update writing question', async () => {
      await axios.put(`${API_URL}/ai-questions/writing/${testData.writingQuestionId}`, {
        promptText: 'Updated prompt'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });

    await test('Delete writing question', async () => {
      await axios.delete(`${API_URL}/ai-questions/writing/${testData.writingQuestionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });
  }

  // ==================== MANUAL PAYMENTS ====================
  log('\n7️⃣  MANUAL PAYMENT MANAGEMENT', 'blue');
  log('─'.repeat(60), 'blue');

  await test('Get pending payments', async () => {
    await axios.get(`${API_URL}/manual-payments/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  });

  await test('Get approved payments', async () => {
    await axios.get(`${API_URL}/manual-payments/approved`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  });

  await test('Get rejected payments', async () => {
    await axios.get(`${API_URL}/manual-payments/rejected`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  });

  await test('Get all payments', async () => {
    await axios.get(`${API_URL}/manual-payments/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  });

  // ==================== QUESTION BANK ====================
  log('\n8️⃣  QUESTION BANK', 'blue');
  log('─'.repeat(60), 'blue');

  await test('Get all questions', async () => {
    await axios.get(`${API_URL}/question-bank`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  });

  // ==================== ANALYTICS ====================
  log('\n9️⃣  ANALYTICS', 'blue');
  log('─'.repeat(60), 'blue');

  await test('Get AI usage analytics', async () => {
    await axios.get(`${API_URL}/analytics/admin/ai-usage`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  });

  // ==================== CLEANUP ====================
  log('\n🧹 CLEANUP', 'blue');
  log('─'.repeat(60), 'blue');

  if (testData.centerId) {
    await test('Delete test center', async () => {
      await axios.delete(`${API_URL}/centers/${testData.centerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    });
  }

  // ==================== SUMMARY ====================
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    TEST SUMMARY                            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  const total = results.passed + results.failed;
  const percentage = ((results.passed / total) * 100).toFixed(1);

  log(`Total Tests: ${total}`, 'yellow');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`📊 Success Rate: ${percentage}%\n`, percentage === '100.0' ? 'green' : 'yellow');

  if (results.failed > 0) {
    log('Failed Tests:', 'red');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      log(`   ❌ ${t.name}: ${t.error}`, 'red');
    });
  } else {
    log('🎉 BARCHA TESTLAR MUVAFFAQIYATLI! 🎉', 'green');
  }

  log('\n' + '═'.repeat(60) + '\n', 'cyan');
}

runAllTests().catch(err => {
  log(`\n💥 CRITICAL ERROR: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
