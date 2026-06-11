/**
 * MOCK UPLOAD SCRIPT
 * PDF va MP3 fayllarni saytga yuklaydi
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://cefr-production-e7c9.up.railway.app/api';
const ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';
const ADMIN_PASSWORD = 'akmal1221';

let authToken = '';

// Disable SSL verification for Railway
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

// Login
async function login() {
  log('🔐 Logging in...', 'blue');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    authToken = response.data.access_token || response.data.token || response.data.accessToken;
    log('✅ Login successful!', 'green');
    return true;
  } catch (error) {
    log(`❌ Login failed: ${error.message}`, 'red');
    return false;
  }
}

// Upload PDF file
async function uploadPDF(filePath) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post(`${API_URL}/ielts/upload/pdf`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    log(`  ✅ PDF uploaded: ${response.data.key}`, 'green');
    return response.data;
  } catch (error) {
    log(`  ❌ PDF upload failed: ${error.message}`, 'red');
    throw error;
  }
}

// Upload MP3 file
async function uploadAudio(filePath) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post(`${API_URL}/ielts/upload/audio`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    log(`  ✅ Audio uploaded: ${response.data.key}`, 'green');
    return response.data;
  } catch (error) {
    log(`  ❌ Audio upload failed: ${error.message}`, 'red');
    throw error;
  }
}

// Create IELTS mock in database
async function createMock(mockData) {
  try {
    const response = await axios.post(`${API_URL}/ielts/mocks`, mockData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    log(`  ✅ Mock created in database: ${mockData.title}`, 'green');
    return response.data;
  } catch (error) {
    log(`  ❌ Mock creation failed: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

// Process single mock folder
async function processMock(mockFolder, mockNumber) {
  log(`\n📦 Processing Mock ${mockNumber}...`, 'magenta');
  
  const files = fs.readdirSync(mockFolder);
  const pdfFile = files.find(f => f.endsWith('.pdf'));
  const mp3File = files.find(f => f.endsWith('.mp3'));

  if (!pdfFile || !mp3File) {
    log(`  ⚠️  Skipping - missing files (PDF: ${!!pdfFile}, MP3: ${!!mp3File})`, 'yellow');
    return null;
  }

  const pdfPath = path.join(mockFolder, pdfFile);
  const mp3Path = path.join(mockFolder, mp3File);

  try {
    // Upload files
    log(`  📄 Uploading PDF: ${pdfFile}...`);
    const pdfData = await uploadPDF(pdfPath);

    log(`  🎵 Uploading Audio: ${mp3File}...`);
    const audioData = await uploadAudio(mp3Path);

    // Create mock in database
    const mockData = {
      title: `IELTS Mock Test ${mockNumber}`,
      description: `Multilevelzone Mock Day - Full IELTS Practice Test`,
      type: 'Academic', // Must be 'Academic' or 'General'
      level: 'B2', // Must be B1, B2, C1, or C2
      duration: 150, // 2.5 hours
      isPaid: false,
      sections: {
        listening: {
          title: 'Listening Section',
          audioKey: audioData.key,
          audioUrl: audioData.url,
          duration: 30,
          parts: []
        },
        reading: {
          title: 'Reading Section',
          pdfKey: pdfData.key,
          pdfUrl: pdfData.url,
          duration: 60,
          passages: []
        },
        writing: {
          title: 'Writing Section',
          duration: 60,
          tasks: [
            {
              taskNumber: 1,
              type: 'TASK_1',
              instructions: 'Write at least 150 words describing the given chart/graph/diagram.',
              minimumWords: 150,
              timeLimit: 20
            },
            {
              taskNumber: 2,
              type: 'TASK_2',
              instructions: 'Write at least 250 words presenting your opinion on the given topic.',
              minimumWords: 250,
              timeLimit: 40
            }
          ]
        }
      }
    };

    log(`  💾 Creating mock in database...`);
    await createMock(mockData);

    return {
      mockNumber,
      pdfKey: pdfData.key,
      audioKey: audioData.key,
      success: true
    };
  } catch (error) {
    log(`  ❌ Failed to process Mock ${mockNumber}`, 'red');
    return {
      mockNumber,
      success: false,
      error: error.message
    };
  }
}

// Main function
async function uploadAllMocks() {
  log('🚀 Starting Mock Upload Process...', 'blue');
  log('=' .repeat(60), 'blue');

  // Login
  if (!await login()) {
    log('\n❌ Cannot proceed without authentication!', 'red');
    return;
  }

  const mocksDir = path.join(__dirname, 'mocklar');
  const results = [];

  // Process each mock folder
  for (let i = 1; i <= 5; i++) {
    const mockFolder = path.join(mocksDir, `mock ${i}`);
    
    if (fs.existsSync(mockFolder)) {
      const result = await processMock(mockFolder, i);
      if (result) results.push(result);
    } else {
      log(`\n⚠️  Mock ${i} folder not found`, 'yellow');
    }
  }

  // Print summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 UPLOAD SUMMARY', 'blue');
  log('='.repeat(60), 'blue');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  log(`\n✅ Successful: ${successful}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'reset');

  results.forEach(r => {
    if (r.success) {
      log(`  • Mock ${r.mockNumber} ✅`, 'green');
    } else {
      log(`  • Mock ${r.mockNumber} ❌ - ${r.error}`, 'red');
    }
  });

  log('\n🎉 Upload process complete!', 'blue');
}

// Run
uploadAllMocks().catch(error => {
  log(`\n💥 Upload script crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
