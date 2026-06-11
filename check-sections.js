/**
 * Check if CEFR mock sections are properly saved
 */

const axios = require('axios');

const API_URL = 'https://cefr-production-e7c9.up.railway.app/api';
const ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';
const ADMIN_PASSWORD = 'akmal1221';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkSections() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const token = loginRes.data.access_token;
    console.log('✅ Login successful\n');

    // Get all mocks
    console.log('📋 Getting CEFR mocks...');
    const mocksRes = await axios.get(`${API_URL}/cefr/mocks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const mocks = mocksRes.data;
    console.log(`✅ Found ${mocks.length} mocks\n`);

    // Check each mock
    for (const mock of mocks) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📝 Mock: ${mock.title}`);
      console.log(`   ID: ${mock.id}`);
      console.log(`   Level: ${mock.level}`);
      
      // Check sections
      const hasListening = mock.listening ? '✓' : '✗';
      const hasReading = mock.reading ? '✓' : '✗';
      const hasWriting = mock.writing ? '✓' : '✗';
      const hasSpeaking = mock.speaking ? '✓' : '✗';
      
      console.log(`\n   Sections:`);
      console.log(`   ${hasListening} Listening${mock.listening ? ` - Duration: ${mock.listening.duration}m` : ''}`);
      console.log(`   ${hasReading} Reading${mock.reading ? ` - Duration: ${mock.reading.duration}m` : ''}`);
      console.log(`   ${hasWriting} Writing${mock.writing ? ` - Duration: ${mock.writing.duration}m` : ''}`);
      console.log(`   ${hasSpeaking} Speaking${mock.speaking ? ` - Duration: ${mock.speaking.duration}m` : ''}`);
      
      // Check section data details
      if (mock.listening) {
        const sections = mock.listening.sections;
        console.log(`\n   📻 Listening Details:`);
        console.log(`      Audio URL: ${sections?.audioUrl ? '✓' : '✗'}`);
        console.log(`      Audio Key: ${sections?.audioKey ? sections.audioKey : 'N/A'}`);
        console.log(`      Parts: ${sections?.parts?.length || 0}`);
      }
      
      if (mock.reading) {
        const passages = mock.reading.passages;
        console.log(`\n   📖 Reading Details:`);
        console.log(`      PDF URL: ${passages?.pdfUrl ? '✓' : '✗'}`);
        console.log(`      PDF Key: ${passages?.pdfKey ? passages.pdfKey : 'N/A'}`);
        console.log(`      Passages: ${passages?.passages?.length || 0}`);
      }
      
      if (mock.writing) {
        console.log(`\n   ✍️  Writing Details:`);
        console.log(`      Task 1.1: ${mock.writing.task11 ? '✓' : '✗'}`);
        console.log(`      Task 1.2: ${mock.writing.task12 ? '✓' : '✗'}`);
        console.log(`      Task 2: ${mock.writing.task2 ? '✓' : '✗'}`);
      }
      
      if (mock.speaking) {
        console.log(`\n   🎤 Speaking Details:`);
        console.log(`      Task 1: ${mock.speaking.task1 ? '✓' : '✗'}`);
        console.log(`      Task 2: ${mock.speaking.task2 ? '✓' : '✗'}`);
        console.log(`      Task 3: ${mock.speaking.task3 ? '✓' : '✗'}`);
      }
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    // Summary
    const allSectionsCount = mocks.filter(m => 
      m.listening && m.reading && m.writing && m.speaking
    ).length;
    
    console.log(`\n✅ Summary:`);
    console.log(`   Total Mocks: ${mocks.length}`);
    console.log(`   Complete Mocks (all 4 sections): ${allSectionsCount}`);
    console.log(`   Incomplete Mocks: ${mocks.length - allSectionsCount}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

checkSections();
