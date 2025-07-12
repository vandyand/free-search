const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');
const { v4: uuidv4 } = require('uuid');
const database = require('../database/init');
const puppeteerSearchService = require('./puppeteerSearchService');

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

class SearchService {
  constructor() {
    this.searchEngines = {
      google: this.searchGoogle.bind(this),
      bing: this.searchBing.bind(this),
      duckduckgo: this.searchDuckDuckGo.bind(this),
      yahoo: this.searchYahoo.bind(this),
      brave: this.searchBrave.bind(this)
    };
    
    // Default engines for Puppeteer (most reliable)
    this.defaultPuppeteerEngines = ['searx', 'bing', 'ecosia'];
  }

  async search(query, options = {}) {
    const {
      engine = 'default',
      page = 1,
      safe = true,
      userIp = null,
      fallback = true,
      usePuppeteer = true // Default to Puppeteer
    } = options;

    const cacheKey = `${engine}:${query}:${page}:${safe}:${usePuppeteer}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      await this.saveSearchHistory(query, cached.length, engine, userIp);
      return cached;
    }

    // Use Puppeteer by default for better reliability
    if (usePuppeteer) {
      return await this.searchWithPuppeteer(query, { engine, page, safe, userIp });
    }

    // Legacy scraping method (fallback)
    if (engine === 'all' || !engine) {
      return await this.searchAllEngines(query, { page, safe, userIp });
    }

    try {
      const searchFunction = this.searchEngines[engine];
      if (!searchFunction) {
        throw new Error(`Unsupported search engine: ${engine}`);
      }

      const results = await searchFunction(query, { page, safe });
      
      // Cache results
      cache.set(cacheKey, results);
      
      // Save to database
      await this.saveSearchHistory(query, results.length, engine, userIp);
      
      return results;
    } catch (error) {
      console.error(`Search error for engine ${engine}:`, error);
      
      // If fallback is enabled, try Puppeteer
      if (fallback) {
        console.log(`Primary engine failed, trying Puppeteer...`);
        return await this.searchWithPuppeteer(query, { engine: 'default', page, safe, userIp });
      }
      
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async searchWithPuppeteer(query, options = {}) {
    const {
      engine = 'default',
      page = 1,
      safe = true,
      userIp = null
    } = options;

    try {
      // If engine is 'default', use the three most reliable engines
      if (engine === 'default') {
        return await this.searchDefaultEngines(query, { page, safe, userIp });
      }

      // Use Puppeteer service for specific engine
      const results = await puppeteerSearchService.search(query, {
        engine,
        page,
        safe,
        userIp
      });

      return results;
    } catch (error) {
      console.error('Puppeteer search error:', error);
      throw new Error(`Puppeteer search failed: ${error.message}`);
    }
  }

  async searchDefaultEngines(query, options = {}) {
    const { page = 1, safe = true, userIp = null } = options;
    
    console.log(`Searching default engines (Searx, Bing, Ecosia) for: "${query}"`);
    
    // Search all three engines simultaneously for better performance
    const searchPromises = this.defaultPuppeteerEngines.map(async (engineName) => {
      try {
        console.log(`Searching ${engineName}...`);
        const results = await puppeteerSearchService.search(query, {
          engine: engineName,
          page,
          safe,
          userIp
        });
        
        // Add engine info to each result
        const enhancedResults = results.map(result => ({
          ...result,
          engine: engineName,
          original_rank: result.rank
        }));
        
        console.log(`${engineName} returned ${results.length} results`);
        return enhancedResults;
      } catch (error) {
        console.error(`${engineName} search failed:`, error.message);
        return [];
      }
    });
    
    // Wait for all searches to complete
    const allResults = await Promise.allSettled(searchPromises);
    
    // Combine results from successful searches
    const combinedResults = [];
    const workingEngines = [];
    
    allResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        combinedResults.push(...result.value);
        workingEngines.push(this.defaultPuppeteerEngines[index]);
      }
    });
    
    // Sort and deduplicate results
    const deduplicatedResults = this.deduplicateResults(combinedResults);
    
    // Take the best results (up to 15 total)
    const finalResults = deduplicatedResults.slice(0, 15);
    
    // Re-rank results
    finalResults.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    console.log(`Combined results from ${workingEngines.length} engines: ${finalResults.length} unique results`);
    
    // Cache the combined results
    const cacheKey = `default:${query}:${page}:${safe}:true`;
    cache.set(cacheKey, finalResults);
    
    // Save to database with the most successful engine
    const bestEngine = workingEngines[0] || 'default';
    await this.saveSearchHistory(query, finalResults.length, bestEngine, userIp);
    
    return finalResults;
  }

  async searchAllEngines(query, options = {}) {
    const { page = 1, safe = true, userIp = null } = options;
    
    console.log(`Searching all engines for: "${query}"`);
    
    const allResults = [];
    const engineResults = {};
    const workingEngines = [];
    
    // Search all engines simultaneously
    const searchPromises = Object.keys(this.searchEngines).map(async (engineName) => {
      try {
        console.log(`Searching ${engineName}...`);
        const results = await this.searchEngines[engineName](query, { page, safe });
        
        if (results && results.length > 0) {
          engineResults[engineName] = results;
          workingEngines.push(engineName);
          
          // Add engine info to each result
          const enhancedResults = results.map(result => ({
            ...result,
            engine: engineName,
            original_rank: result.rank
          }));
          
          allResults.push(...enhancedResults);
          console.log(`${engineName} returned ${results.length} results`);
        } else {
          console.log(`${engineName} returned no results`);
        }
      } catch (error) {
        console.error(`${engineName} search failed:`, error.message);
      }
    });
    
    // Wait for all searches to complete
    await Promise.allSettled(searchPromises);
    
    // Sort and deduplicate results
    const deduplicatedResults = this.deduplicateResults(allResults);
    
    // Take the best results (up to 15 total)
    const finalResults = deduplicatedResults.slice(0, 15);
    
    // Re-rank results
    finalResults.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    console.log(`Combined results from ${workingEngines.length} engines: ${finalResults.length} unique results`);
    
    // Cache the combined results
    const cacheKey = `all:${query}:${page}:${safe}`;
    cache.set(cacheKey, finalResults);
    
    // Save to database with the most successful engine
    const bestEngine = workingEngines[0] || 'unknown';
    await this.saveSearchHistory(query, finalResults.length, bestEngine, userIp);
    
    return finalResults;
  }

  deduplicateResults(results) {
    const seen = new Set();
    const deduplicated = [];
    
    for (const result of results) {
      // Create a key based on URL and title
      const key = `${result.url}-${result.title}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(result);
      }
    }
    
    // Sort by relevance (prioritize results with snippets, then by engine reliability)
    deduplicated.sort((a, b) => {
      // First, prioritize results with good snippets
      const aHasSnippet = a.snippet && a.snippet.length > 20;
      const bHasSnippet = b.snippet && b.snippet.length > 20;
      
      if (aHasSnippet && !bHasSnippet) return -1;
      if (!aHasSnippet && bHasSnippet) return 1;
      
      // Then prioritize by engine reliability (Bing > Google > DuckDuckGo > others)
      const enginePriority = { 'bing': 1, 'google': 2, 'duckduckgo': 3, 'brave': 4, 'yahoo': 5 };
      const aPriority = enginePriority[a.engine] || 6;
      const bPriority = enginePriority[b.engine] || 6;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Finally, by original rank
      return a.original_rank - b.original_rank;
    });
    
    return deduplicated;
  }

  async searchGoogle(query, options = {}) {
    const { page = 1, safe = true } = options;
    const start = (page - 1) * 10;
    
    // Use web scraping directly (no external API needed)
    return await this.scrapeGoogle(query, start);
  }

  async scrapeGoogle(query, start = 0) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${start}&hl=en&gl=us`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const results = [];

      // Debug: Log the HTML structure
      console.log('Google response status:', response.status);
      console.log('Google response length:', response.data.length);

      // Try multiple selectors for Google results (updated for 2024)
      const selectors = [
        'div[data-sokoban-container] a[href^="http"]', // Modern Google results
        '.g a[href^="http"]', // General Google results
        '.rc a[href^="http"]', // Alternative
        'h3 a[href^="http"]', // Simple h3 links
        '.yuRUbf a[href^="http"]', // Another modern selector
        '.r a[href^="http"]' // Legacy selector
      ];

      for (const selector of selectors) {
        console.log(`Trying selector: ${selector}`);
        $(selector).each((index, element) => {
          if (results.length >= 10) return;
          
          const title = $(element).text().trim();
          const url = $(element).attr('href');
          
          // Skip Google's own search pages and empty titles
          if (!title || !url || url.includes('google.com/search') || url.includes('google.com/url')) {
            return;
          }

          // Find snippet - try multiple approaches
          let snippet = '';
          const parent = $(element).closest('.g, .rc, div[data-sokoban-container]');
          if (parent.length) {
            snippet = parent.find('.VwiC3b, .st, .s3v9rd, .aCOpRe, .LC20lb').text().trim();
          }
          
          // If no snippet found, try broader search
          if (!snippet) {
            snippet = $(element).closest('div').find('div').not($(element)).text().trim().substring(0, 200);
          }

          results.push({
            title,
            url,
            snippet: snippet || 'No description available',
            rank: start + results.length + 1,
            engine: 'google'
          });
        });
        
        console.log(`Selector ${selector} found ${results.length} results`);
        if (results.length > 0) break;
      }

      // If still no results, try a different approach
      if (results.length === 0) {
        console.log('No results with standard selectors, trying alternative approach...');
        
        // Look for any links that might be search results
        $('a[href^="http"]').each((index, element) => {
          if (results.length >= 10) return;
          
          const title = $(element).text().trim();
          const url = $(element).attr('href');
          
          if (title && url && title.length > 10 && !url.includes('google.com')) {
            results.push({
              title,
              url,
              snippet: 'Result from alternative parsing',
              rank: start + results.length + 1,
              engine: 'google'
            });
          }
        });
      }

      console.log(`Google scraping completed with ${results.length} results`);
      return results.slice(0, 10);
    } catch (error) {
      console.error('Google scraping failed:', error.message);
      return [];
    }
  }

  async searchBing(query, options = {}) {
    const { page = 1, safe = true } = options;
    const start = (page - 1) * 10;
    
    try {
      const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&first=${start + 1}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('.b_algo').each((index, element) => {
        const title = $(element).find('h2 a').text().trim();
        const url = $(element).find('h2 a').attr('href');
        const snippet = $(element).find('.b_caption p').text().trim();

        if (title && url && url.startsWith('http')) {
          results.push({
            title,
            url,
            snippet,
            rank: start + index + 1,
            engine: 'bing'
          });
        }
      });

      return results.slice(0, 10);
    } catch (error) {
      console.error('Bing scraping failed:', error);
      return [];
    }
  }

  async searchDuckDuckGo(query, options = {}) {
    const { page = 1 } = options;
    
    try {
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_html: '1',
          skip_disambig: '1'
        },
        timeout: 10000
      });

      const results = [];
      if (response.data && response.data.RelatedTopics) {
        response.data.RelatedTopics.forEach((topic, index) => {
          if (topic.FirstURL && topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0],
              url: topic.FirstURL,
              snippet: topic.Text,
              rank: index + 1,
              engine: 'duckduckgo'
            });
          }
        });
      }

      return results.slice(0, 10);
    } catch (error) {
      console.error('DuckDuckGo search failed:', error);
      return [];
    }
  }

  async searchYahoo(query, options = {}) {
    const { page = 1, safe = true } = options;
    const start = (page - 1) * 10;
    
    try {
      const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}&b=${start + 1}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('.algo').each((index, element) => {
        const title = $(element).find('h3 a').text().trim();
        const url = $(element).find('h3 a').attr('href');
        const snippet = $(element).find('.compText').text().trim();

        if (title && url && url.startsWith('http')) {
          results.push({
            title,
            url,
            snippet,
            rank: start + index + 1,
            engine: 'yahoo'
          });
        }
      });

      return results.slice(0, 10);
    } catch (error) {
      console.error('Yahoo scraping failed:', error);
      return [];
    }
  }

  async searchBrave(query, options = {}) {
    const { page = 1, safe = true } = options;
    const start = (page - 1) * 10;
    
    try {
      const searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}&start=${start}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('.result').each((index, element) => {
        const title = $(element).find('.result-header a').text().trim();
        const url = $(element).find('.result-header a').attr('href');
        const snippet = $(element).find('.snippet-content').text().trim();

        if (title && url && url.startsWith('http')) {
          results.push({
            title,
            url,
            snippet,
            rank: start + index + 1,
            engine: 'brave'
          });
        }
      });

      return results.slice(0, 10);
    } catch (error) {
      console.error('Brave scraping failed:', error);
      return [];
    }
  }

  async saveSearchHistory(query, resultsCount, engine, userIp) {
    try {
      const db = database.getDb();
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO search_history (query, results_count, search_engine, user_ip) VALUES (?, ?, ?, ?)',
          [query, resultsCount, engine, userIp],
          function(err) {
            if (err) {
              console.error('Error saving search history:', err);
              reject(err);
            } else {
              resolve(this.lastID);
            }
          }
        );
      });
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  async getSearchHistory(limit = 50, userIp = null) {
    try {
      const db = database.getDb();
      return new Promise((resolve, reject) => {
        const query = userIp 
          ? 'SELECT * FROM search_history WHERE user_ip = ? ORDER BY created_at DESC LIMIT ?'
          : 'SELECT * FROM search_history ORDER BY created_at DESC LIMIT ?';
        
        const params = userIp ? [userIp, limit] : [limit];
        
        db.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  async getUserPreferences(userIp) {
    try {
      const db = database.getDb();
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM user_preferences WHERE user_ip = ?',
          [userIp],
          (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row || {
                default_search_engine: 'default', // Default to Puppeteer with Searx, Bing, Ecosia
                results_per_page: 10,
                safe_search: true,
                use_puppeteer: true
              });
            }
          }
        );
      });
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {
        default_search_engine: 'default', // Default to Puppeteer with Searx, Bing, Ecosia
        results_per_page: 10,
        safe_search: true,
        use_puppeteer: true
      };
    }
  }

  async updateUserPreferences(userIp, preferences) {
    try {
      const db = database.getDb();
      return new Promise((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO user_preferences 
           (user_ip, default_search_engine, results_per_page, safe_search, use_puppeteer, updated_at) 
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            userIp,
            preferences.default_search_engine || 'default',
            preferences.results_per_page || 10,
            preferences.safe_search !== undefined ? preferences.safe_search : true,
            preferences.use_puppeteer !== undefined ? preferences.use_puppeteer : true
          ],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.lastID);
            }
          }
        );
      });
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  getAvailableEngines() {
    return [...Object.keys(this.searchEngines), 'all', 'default'];
  }

  clearCache() {
    cache.flushAll();
    return { message: 'Cache cleared successfully' };
  }
}

module.exports = new SearchService(); 