#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_QUERY = 'javascript tutorial';

async function testEngine(engine) {
  const startTime = Date.now();
  
  try {
    console.log(`Testing ${engine}...`);
    const response = await axios.get(`${BASE_URL}/api/puppeteer/search`, {
      params: { q: TEST_QUERY, engine },
      timeout: 60000 // 60 seconds
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const results = response.data.results?.length || 0;
    
    return {
      engine,
      success: true,
      duration,
      results,
      status: '✅ Working'
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      engine,
      success: false,
      duration,
      results: 0,
      error: error.response?.data?.error || error.message,
      status: '❌ Failed'
    };
  }
}

async function testAllEngines() {
  console.log('🔍 Testing All Puppeteer Search Engines\n');
  console.log('=' .repeat(80));
  
  // Get available engines
  try {
    const enginesResponse = await axios.get(`${BASE_URL}/api/puppeteer/engines`);
    const engines = enginesResponse.data.engines.filter(engine => engine !== 'all');
    
    console.log(`Found ${engines.length} engines to test\n`);
    
    const results = [];
    
    for (const engine of engines) {
      const result = await testEngine(engine);
      results.push(result);
      
      console.log(`${result.status} ${engine}: ${result.results} results in ${result.duration}ms`);
      
      // Wait between engines to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    
    const workingEngines = results.filter(r => r.success && r.results > 0);
    const failedEngines = results.filter(r => !r.success || r.results === 0);
    
    console.log(`\n✅ Working Engines (${workingEngines.length}/${engines.length}):`);
    workingEngines.forEach(result => {
      console.log(`  ${result.engine}: ${result.results} results (${result.duration}ms)`);
    });
    
    console.log(`\n❌ Failed/No Results (${failedEngines.length}/${engines.length}):`);
    failedEngines.forEach(result => {
      const reason = result.error ? ` - ${result.error}` : ' - No results';
      console.log(`  ${result.engine}${reason}`);
    });
    
    // Performance ranking
    console.log('\n🏆 PERFORMANCE RANKING (Working Engines)');
    console.log('-'.repeat(50));
    
    const rankedEngines = workingEngines
      .sort((a, b) => {
        // Sort by results first, then by speed
        if (b.results !== a.results) return b.results - a.results;
        return a.duration - b.duration;
      });
    
    rankedEngines.forEach((result, index) => {
      console.log(`${index + 1}. ${result.engine}: ${result.results} results (${result.duration}ms)`);
    });
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(40));
    
    if (rankedEngines.length > 0) {
      const bestEngine = rankedEngines[0];
      console.log(`🏆 Best Engine: ${bestEngine.engine} (${bestEngine.results} results)`);
      
      const fastestEngine = workingEngines.reduce((fastest, current) => 
        current.duration < fastest.duration ? current : fastest
      );
      console.log(`⚡ Fastest: ${fastestEngine.engine} (${fastestEngine.duration}ms)`);
      
      console.log('\n📝 Top 3 Recommended Engines:');
      rankedEngines.slice(0, 3).forEach((engine, index) => {
        console.log(`  ${index + 1}. ${engine.engine} - ${engine.results} results, ${engine.duration}ms`);
      });
    } else {
      console.log('❌ No engines are working properly');
    }
    
    // Test "all" engines option
    console.log('\n🔧 Testing "all" engines option...');
    try {
      const startTime = Date.now();
      const allResponse = await axios.get(`${BASE_URL}/api/puppeteer/search`, {
        params: { q: TEST_QUERY, engine: 'all' },
        timeout: 120000 // 2 minutes for all engines
      });
      const duration = Date.now() - startTime;
      const allResults = allResponse.data.results?.length || 0;
      
      console.log(`✅ "all" engines: ${allResults} combined results in ${duration}ms`);
      
      // Show engine breakdown
      const engineBreakdown = {};
      allResponse.data.results?.forEach(result => {
        engineBreakdown[result.engine] = (engineBreakdown[result.engine] || 0) + 1;
      });
      
      console.log('\n📊 Engine breakdown in "all" results:');
      Object.entries(engineBreakdown)
        .sort(([,a], [,b]) => b - a)
        .forEach(([engine, count]) => {
          console.log(`  ${engine}: ${count} results`);
        });
        
    } catch (error) {
      console.log(`❌ "all" engines failed: ${error.response?.data?.error || error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error getting engines:', error.message);
  }
}

async function main() {
  try {
    // Check if server is running
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running\n');
    
    await testAllEngines();
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server is not running. Please start the server first:');
      console.error('   npm start');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testAllEngines }; 