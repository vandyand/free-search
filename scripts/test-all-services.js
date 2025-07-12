#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_QUERIES = [
  'javascript tutorial',
  'python programming',
  'docker containers'
];

async function testSearchService(service, query, engine = 'all') {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${BASE_URL}/api/${service}/search`, {
      params: { q: query, engine },
      timeout: 60000 // 60 seconds for Puppeteer
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: true,
      duration,
      results: response.data.results?.length || 0,
      total_results: response.data.total_results || 0,
      engine: response.data.engine
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: false,
      duration,
      error: error.response?.data?.error || error.message,
      status: error.response?.status
    };
  }
}

async function runComprehensiveTest() {
  console.log('🔍 Comprehensive Search Service Comparison\n');
  console.log('=' .repeat(80));
  
  const services = [
    { name: 'search', description: 'Custom Scraping (Original)' },
    { name: 'scraper', description: 'NPM Library (search-scraper)' },
    { name: 'puppeteer', description: 'Puppeteer-based (New)' }
  ];
  
  const results = {
    search: [],
    scraper: [],
    puppeteer: []
  };
  
  for (const query of TEST_QUERIES) {
    console.log(`\n📝 Testing query: "${query}"`);
    console.log('-'.repeat(60));
    
    for (const service of services) {
      console.log(`\nTesting ${service.description}...`);
      const result = await testSearchService(service.name, query);
      results[service.name].push({ query, ...result });
      
      if (result.success) {
        console.log(`✅ Success: ${result.results} results in ${result.duration}ms`);
      } else {
        console.log(`❌ Failed: ${result.error} (${result.status})`);
      }
      
      // Wait between services
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Wait between queries
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE SUMMARY');
  console.log('='.repeat(80));
  
  for (const service of services) {
    const serviceResults = results[service.name];
    const successCount = serviceResults.filter(r => r.success).length;
    const avgTime = serviceResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.duration, 0) / successCount || 0;
    const avgResults = serviceResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.results, 0) / successCount || 0;
    
    console.log(`\n${service.description}:`);
    console.log(`  Success Rate: ${successCount}/${TEST_QUERIES.length} (${(successCount/TEST_QUERIES.length*100).toFixed(1)}%)`);
    console.log(`  Average Time: ${avgTime.toFixed(0)}ms`);
    console.log(`  Average Results: ${avgResults.toFixed(1)}`);
  }
  
  // Performance comparison
  console.log('\n🏆 PERFORMANCE RANKING');
  console.log('-'.repeat(40));
  
  const serviceStats = services.map(service => {
    const serviceResults = results[service.name];
    const successCount = serviceResults.filter(r => r.success).length;
    const avgTime = serviceResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.duration, 0) / successCount || 0;
    const avgResults = serviceResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.results, 0) / successCount || 0;
    
    return {
      name: service.description,
      successRate: successCount / TEST_QUERIES.length,
      avgTime,
      avgResults,
      score: (successCount / TEST_QUERIES.length) * (avgResults / 10) * (1000 / (avgTime + 1))
    };
  });
  
  // Sort by score (higher is better)
  serviceStats.sort((a, b) => b.score - a.score);
  
  serviceStats.forEach((stat, index) => {
    console.log(`${index + 1}. ${stat.name}`);
    console.log(`   Success Rate: ${(stat.successRate * 100).toFixed(1)}%`);
    console.log(`   Avg Time: ${stat.avgTime.toFixed(0)}ms`);
    console.log(`   Avg Results: ${stat.avgResults.toFixed(1)}`);
    console.log(`   Score: ${stat.score.toFixed(2)}`);
  });
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS');
  console.log('='.repeat(80));
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i];
    console.log(`\nQuery: "${query}"`);
    
    for (const service of services) {
      const result = results[service.name][i];
      const status = result.success ? 
        `✅ ${result.results} results (${result.duration}ms)` : 
        `❌ ${result.error}`;
      console.log(`  ${service.description}: ${status}`);
    }
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('-'.repeat(40));
  
  const bestService = serviceStats[0];
  console.log(`🏆 Best Overall: ${bestService.name}`);
  console.log(`   - Highest success rate and good performance`);
  
  const fastestService = serviceStats.reduce((fastest, current) => 
    current.avgTime < fastest.avgTime ? current : fastest
  );
  console.log(`⚡ Fastest: ${fastestService.name} (${fastestService.avgTime.toFixed(0)}ms avg)`);
  
  const mostReliableService = serviceStats.reduce((mostReliable, current) => 
    current.successRate > mostReliable.successRate ? current : mostReliable
  );
  console.log(`🛡️ Most Reliable: ${mostReliableService.name} (${(mostReliableService.successRate * 100).toFixed(1)}% success rate)`);
  
  console.log('\n📝 USAGE RECOMMENDATIONS:');
  console.log('• For speed: Use Custom Scraping (/api/search)');
  console.log('• For reliability: Use Puppeteer (/api/puppeteer)');
  console.log('• For development: Use Custom Scraping (lighter resources)');
  console.log('• For production: Use Puppeteer (more reliable)');
}

// Test individual engines
async function testIndividualEngines() {
  console.log('\n🔧 Testing Individual Engines');
  console.log('='.repeat(60));
  
  const engines = ['google', 'bing', 'duckduckgo'];
  const testQuery = 'javascript tutorial';
  
  for (const engine of engines) {
    console.log(`\nTesting ${engine} with Puppeteer...`);
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/api/puppeteer/search`, {
        params: { q: testQuery, engine },
        timeout: 30000
      });
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${engine}: ${response.data.results?.length || 0} results in ${duration}ms`);
    } catch (error) {
      console.log(`❌ ${engine}: ${error.response?.data?.error || error.message}`);
    }
    
    // Wait between engines
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function main() {
  try {
    // Check if server is running
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running\n');
    
    // Run comprehensive test
    await runComprehensiveTest();
    
    // Test individual engines
    await testIndividualEngines();
    
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

module.exports = { runComprehensiveTest, testIndividualEngines }; 