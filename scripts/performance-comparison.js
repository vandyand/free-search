#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function measurePerformance() {
  console.log('⚡ Performance Comparison: Parallel vs Sequential Search\n');

  const testQuery = 'machine learning tutorial';
  const iterations = 3;

  try {
    // Test 1: Default search (parallel - Searx, Bing, Ecosia)
    console.log('🔄 Testing Default Search (Parallel - Searx, Bing, Ecosia)...');
    const parallelTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/api/search`, {
        params: {
          q: testQuery,
          engine: 'default'
        }
      });
      const endTime = Date.now();
      const duration = endTime - startTime;
      parallelTimes.push(duration);
      
      console.log(`   Run ${i + 1}: ${duration}ms (${response.data.results_count} results)`);
    }

    const avgParallelTime = parallelTimes.reduce((a, b) => a + b, 0) / parallelTimes.length;
    console.log(`   Average parallel time: ${avgParallelTime.toFixed(0)}ms\n`);

    // Test 2: Individual engine searches (sequential)
    console.log('🔄 Testing Individual Engine Searches (Sequential)...');
    const engines = ['searx', 'bing', 'ecosia'];
    const sequentialTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      // Search each engine sequentially
      for (const engine of engines) {
        await axios.get(`${BASE_URL}/api/puppeteer/search`, {
          params: {
            q: testQuery,
            engine: engine
          }
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      sequentialTimes.push(duration);
      
      console.log(`   Run ${i + 1}: ${duration}ms`);
    }

    const avgSequentialTime = sequentialTimes.reduce((a, b) => a + b, 0) / sequentialTimes.length;
    console.log(`   Average sequential time: ${avgSequentialTime.toFixed(0)}ms\n`);

    // Calculate improvement
    const improvement = ((avgSequentialTime - avgParallelTime) / avgSequentialTime * 100).toFixed(1);
    
    console.log('📊 Performance Results:');
    console.log(`   Parallel Search (Default): ${avgParallelTime.toFixed(0)}ms`);
    console.log(`   Sequential Search: ${avgSequentialTime.toFixed(0)}ms`);
    console.log(`   Performance Improvement: ${improvement}% faster`);
    console.log(`   Time Saved: ${(avgSequentialTime - avgParallelTime).toFixed(0)}ms per search`);

    // Test 3: Legacy scraping comparison
    console.log('\n🔄 Testing Legacy Scraping (for comparison)...');
    const legacyStartTime = Date.now();
    const legacyResponse = await axios.get(`${BASE_URL}/api/search`, {
      params: {
        q: testQuery,
        usePuppeteer: false,
        engine: 'all'
      }
    });
    const legacyEndTime = Date.now();
    const legacyTime = legacyEndTime - legacyStartTime;
    
    console.log(`   Legacy scraping time: ${legacyTime}ms (${legacyResponse.data.results_count} results)`);

    console.log('\n🎯 Summary:');
    console.log(`   • Parallel search is ${improvement}% faster than sequential`);
    console.log(`   • Default search combines the best of all three engines`);
    console.log(`   • Results are automatically deduplicated and ranked`);
    console.log(`   • Legacy scraping is available as fallback`);

  } catch (error) {
    console.error('❌ Performance test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the performance test
measurePerformance(); 