/**
 * CEFR MOCK UPLOAD SCRIPT
 * PDF va MP3 fayllarni CEFR mock sifatida saytga yuklaydi
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://cefr-production-e7c9.up.railway.app/api';
const ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';
const ADMIN_PASSWORD = 'akmal1221';

let authToken = '';

// Disable SSL verification
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

    const response = await axios.post(`${API_URL}/cefr/upload/pdf`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
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

    const response = await axios.post(`${API_URL}/cefr/upload/audio`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
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

// Create CEFR mock in database
async function createMock(mockData) {
  try {
    const response = await axios.post(`${API_URL}/cefr/mocks`, mockData, {
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

    // Create CEFR mock in database (umumiy, darajasiz)
    const mockData = {
      title: `CEFR Mock Test ${mockNumber}`,
      description: `Multilevelzone CEFR Mock - Full Practice Test with Listening, Reading, Writing, and Speaking sections`,
      level: 'B2', // Default level - backend talab qiladi
      duration: 180, // 3 hours
      isPaid: false,
      sections: {
        listening: {
          title: 'Listening Section',
          audioKey: audioData.key,
          audioUrl: audioData.url,
          duration: 40
        },
        reading: {
          title: 'Reading Section',
          pdfKey: pdfData.key,
          pdfUrl: pdfData.url,
          duration: 60
        },
        writing: {
          title: 'Writing Section',
          duration: 40,
          tasks: [
            {
              taskNumber: 1,
              instructions: 'Complete the writing task based on the provided materials.',
              timeLimit: 40
            }
          ]
        },
        speaking: {
          title: 'Speaking Section',
          duration: 40,
          parts: [
            {
              partNumber: 1,
              instructions: 'Answer the speaking questions.',
              timeLimit: 40
            }
          ]
        }
      }
    };

    log(`  💾 Creating CEFR mock in database...`);
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
  log('🚀 Starting CEFR Mock Upload Process...', 'blue');
  log('=' .repeat(60), 'blue');

  // Login
  if (!await login()) {
    log('\n❌ Cannot proceed without authentication!', 'red');
    return;
  }

  const mocksDir = path.join(__dirname, 'mocklar');
  const results = [];

  // Process each mock folder (mock 1 to mock 5)
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
  log('\n📝 Note: Mock\'lar B2 darajasi bilan yuklandi (backend talab qiladi)', 'yellow');
  log('   Lekin bu mock\'lar barcha darajalar uchun umumiy mock\'lar hisoblanadi.', 'yellow');
}

// Run
uploadAllMocks().catch(error => {
  log(`\n💥 Upload script crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
