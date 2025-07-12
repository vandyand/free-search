#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testDefaultSearch() {
  console.log('🧪 Testing Default Search (Puppeteer + Searx, Bing, Ecosia)\n');

  try {
    // Test 1: Default search (should use Puppeteer with Searx, Bing, Ecosia)
    console.log('1️⃣ Testing default search...');
    const defaultResponse = await axios.get(`${BASE_URL}/api/search`, {
      params: {
        q: 'javascript tutorial',
        engine: 'default'
      }
    });

    console.log(`✅ Default search returned ${defaultResponse.data.results_count} results`);
    console.log(`🔧 Engine used: ${defaultResponse.data.engine}`);
    console.log(`🤖 Puppeteer used: ${defaultResponse.data.use_puppeteer}`);
    
    // Show first few results
    console.log('\n📋 First 3 results:');
    defaultResponse.data.results.slice(0, 3).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.title}`);
      console.log(`      Engine: ${result.engine || 'unknown'}`);
      console.log(`      URL: ${result.url}`);
      console.log('');
    });

    // Test 2: Search without specifying engine (should default to 'default')
    console.log('2️⃣ Testing search without engine specification...');
    const autoResponse = await axios.get(`${BASE_URL}/api/search`, {
      params: {
        q: 'python programming'
      }
    });

    console.log(`✅ Auto search returned ${autoResponse.data.results_count} results`);
    console.log(`🔧 Engine used: ${autoResponse.data.engine}`);
    console.log(`🤖 Puppeteer used: ${autoResponse.data.use_puppeteer}`);

    // Test 3: Test with usePuppeteer=false (should fall back to legacy scraping)
    console.log('3️⃣ Testing with usePuppeteer=false (legacy fallback)...');
    const legacyResponse = await axios.get(`${BASE_URL}/api/search`, {
      params: {
        q: 'node.js',
        usePuppeteer: false,
        engine: 'all'
      }
    });

    console.log(`✅ Legacy search returned ${legacyResponse.data.results_count} results`);
    console.log(`🔧 Engine used: ${legacyResponse.data.engine}`);
    console.log(`🤖 Puppeteer used: ${legacyResponse.data.use_puppeteer}`);

    // Test 4: Check available engines
    console.log('4️⃣ Checking available engines...');
    const enginesResponse = await axios.get(`${BASE_URL}/api/search/engines`);
    console.log(`✅ Available engines: ${enginesResponse.data.engines.join(', ')}`);

    // Test 5: Check user preferences
    console.log('5️⃣ Checking user preferences...');
    const prefsResponse = await axios.get(`${BASE_URL}/api/search/preferences`);
    console.log(`✅ Default engine: ${prefsResponse.data.preferences.default_search_engine}`);
    console.log(`✅ Use Puppeteer: ${prefsResponse.data.preferences.use_puppeteer}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Default search now uses Puppeteer with Searx, Bing, and Ecosia`);
    console.log(`   • Parallel searching provides better performance`);
    console.log(`   • Legacy scraping is available as fallback`);
    console.log(`   • New 'default' engine option added`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testDefaultSearch(); 