#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function demonstrateParallelSearch() {
  console.log('🚀 Demonstrating Parallel Search (Searx + Bing + Ecosia)\n');

  try {
    // Test the default search (parallel)
    console.log('1️⃣ Testing Default Search (Parallel)...');
    const startTime = Date.now();
    
    const response = await axios.get(`${BASE_URL}/api/search`, {
      params: {
        q: 'artificial intelligence',
        engine: 'default'
      }
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Search completed in ${duration}ms`);
    console.log(`📊 Results: ${response.data.results_count} total results`);
    console.log(`🔧 Engine: ${response.data.engine}`);
    console.log(`🤖 Puppeteer: ${response.data.use_puppeteer}`);

    // Analyze results by engine
    const engineCounts = {};
    response.data.results.forEach(result => {
      const engine = result.engine || 'unknown';
      engineCounts[engine] = (engineCounts[engine] || 0) + 1;
    });

    console.log('\n📈 Results by Engine:');
    Object.entries(engineCounts).forEach(([engine, count]) => {
      console.log(`   ${engine}: ${count} results`);
    });

    // Show sample results
    console.log('\n📋 Sample Results:');
    response.data.results.slice(0, 5).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.title}`);
      console.log(`      Engine: ${result.engine || 'unknown'}`);
      console.log(`      URL: ${result.url.substring(0, 60)}...`);
      console.log('');
    });

    // Test individual engine to compare
    console.log('2️⃣ Testing Individual Engine (for comparison)...');
    const individualStartTime = Date.now();
    
    const individualResponse = await axios.get(`${BASE_URL}/api/puppeteer/search`, {
      params: {
        q: 'artificial intelligence',
        engine: 'searx'
      }
    });
    
    const individualEndTime = Date.now();
    const individualDuration = individualEndTime - individualStartTime;
    
    console.log(`✅ Individual search completed in ${individualDuration}ms`);
    console.log(`📊 Results: ${individualResponse.data.total_results} results`);

    // Calculate efficiency
    const efficiency = ((individualDuration * 3 - duration) / (individualDuration * 3) * 100).toFixed(1);
    
    console.log('\n🎯 Parallel Search Benefits:');
    console.log(`   • Searched 3 engines in ${duration}ms`);
    console.log(`   • Individual search took ${individualDuration}ms`);
    console.log(`   • Sequential would take ~${individualDuration * 3}ms`);
    console.log(`   • Time saved: ~${individualDuration * 3 - duration}ms`);
    console.log(`   • Efficiency gain: ${efficiency}%`);

    console.log('\n✨ Key Features:');
    console.log('   • Automatic result deduplication');
    console.log('   • Smart ranking and relevance scoring');
    console.log('   • Fallback if any engine fails');
    console.log('   • Cached results for faster subsequent searches');

  } catch (error) {
    console.error('❌ Demo failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the demonstration
demonstrateParallelSearch(); 