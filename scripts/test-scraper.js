#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_QUERIES = [
  'javascript tutorial',
  'python programming',
  'machine learning basics',
  'web development',
  'docker containers'
];

async function testSearchService(service, query) {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${BASE_URL}/api/${service}/search`, {
      params: { q: query, engine: 'all' },
      timeout: 30000
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

async function runComparison() {
  console.log('🔍 Comparing Search Services\n');
  console.log('=' .repeat(60));
  
  const results = {
    original: [],
    scraper: []
  };
  
  for (const query of TEST_QUERIES) {
    console.log(`\n📝 Testing query: "${query}"`);
    console.log('-'.repeat(40));
    
    // Test original service
    console.log('Testing original service...');
    const originalResult = await testSearchService('search', query);
    results.original.push({ query, ...originalResult });
    
    if (originalResult.success) {
      console.log(`✅ Success: ${originalResult.results} results in ${originalResult.duration}ms`);
    } else {
      console.log(`❌ Failed: ${originalResult.error} (${originalResult.status})`);
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test scraper service
    console.log('Testing scraper service...');
    const scraperResult = await testSearchService('scraper', query);
    results.scraper.push({ query, ...scraperResult });
    
    if (scraperResult.success) {
      console.log(`✅ Success: ${scraperResult.results} results in ${scraperResult.duration}ms`);
    } else {
      console.log(`❌ Failed: ${scraperResult.error} (${scraperResult.status})`);
    }
    
    // Wait between queries
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const originalSuccess = results.original.filter(r => r.success).length;
  const scraperSuccess = results.scraper.filter(r => r.success).length;
  
  const originalAvgTime = results.original
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.duration, 0) / originalSuccess || 0;
    
  const scraperAvgTime = results.scraper
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.duration, 0) / scraperSuccess || 0;
  
  const originalAvgResults = results.original
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.results, 0) / originalSuccess || 0;
    
  const scraperAvgResults = results.scraper
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.results, 0) / scraperSuccess || 0;
  
  console.log(`\nOriginal Service:`);
  console.log(`  Success Rate: ${originalSuccess}/${TEST_QUERIES.length} (${(originalSuccess/TEST_QUERIES.length*100).toFixed(1)}%)`);
  console.log(`  Average Time: ${originalAvgTime.toFixed(0)}ms`);
  console.log(`  Average Results: ${originalAvgResults.toFixed(1)}`);
  
  console.log(`\nScraper Service:`);
  console.log(`  Success Rate: ${scraperSuccess}/${TEST_QUERIES.length} (${(scraperSuccess/TEST_QUERIES.length*100).toFixed(1)}%)`);
  console.log(`  Average Time: ${scraperAvgTime.toFixed(0)}ms`);
  console.log(`  Average Results: ${scraperAvgResults.toFixed(1)}`);
  
  console.log(`\nPerformance Comparison:`);
  if (scraperAvgTime > 0 && originalAvgTime > 0) {
    const timeDiff = ((scraperAvgTime - originalAvgTime) / originalAvgTime * 100).toFixed(1);
    console.log(`  Time: ${timeDiff}% ${scraperAvgTime > originalAvgTime ? 'slower' : 'faster'}`);
  }
  
  if (scraperAvgResults > 0 && originalAvgResults > 0) {
    const resultsDiff = ((scraperAvgResults - originalAvgResults) / originalAvgResults * 100).toFixed(1);
    console.log(`  Results: ${resultsDiff}% ${scraperAvgResults > originalAvgResults ? 'more' : 'fewer'}`);
  }
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS');
  console.log('='.repeat(60));
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i];
    const original = results.original[i];
    const scraper = results.scraper[i];
    
    console.log(`\nQuery: "${query}"`);
    console.log(`  Original: ${original.success ? `✅ ${original.results} results (${original.duration}ms)` : `❌ ${original.error}`}`);
    console.log(`  Scraper:  ${scraper.success ? `✅ ${scraper.results} results (${scraper.duration}ms)` : `❌ ${scraper.error}`}`);
  }
}

// Test individual engines
async function testIndividualEngines() {
  console.log('\n🔧 Testing Individual Engines');
  console.log('='.repeat(60));
  
  const engines = ['google', 'bing', 'yahoo', 'duckduckgo'];
  const testQuery = 'javascript tutorial';
  
  for (const engine of engines) {
    console.log(`\nTesting ${engine}...`);
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/api/scraper/search`, {
        params: { q: testQuery, engine },
        timeout: 30000
      });
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${engine}: ${response.data.results?.length || 0} results in ${duration}ms`);
    } catch (error) {
      console.log(`❌ ${engine}: ${error.response?.data?.error || error.message}`);
    }
    
    // Wait between engines
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function main() {
  try {
    // Check if server is running
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running\n');
    
    // Run comparison
    await runComparison();
    
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

module.exports = { runComparison, testIndividualEngines }; 