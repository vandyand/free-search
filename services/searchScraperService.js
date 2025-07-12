const SearchScraper = require('search-scraper');
const NodeCache = require('node-cache');
const { v4: uuidv4 } = require('uuid');
const database = require('../database/init');

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

class SearchScraperService {
  constructor() {
    this.searchEngines = {
      google: 'google',
      bing: 'bing',
      yahoo: 'yahoo',
      duckduckgo: 'duckduckgo',
      aol: 'aol',
      ask: 'ask'
    };
  }

  async search(query, options = {}) {
    const {
      engine = 'all',
      page = 1,
      safe = true,
      userIp = null,
      fallback = true
    } = options;

    const cacheKey = `scraper:${engine}:${query}:${page}:${safe}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      await this.saveSearchHistory(query, cached.length, engine, userIp);
      return cached;
    }

    // If engine is 'all' or not specified, search all engines simultaneously
    if (engine === 'all' || !engine) {
      return await this.searchAllEngines(query, { page, safe, userIp });
    }

    try {
      const results = await this.searchSingleEngine(query, engine, { page, safe });
      
      // Cache results
      cache.set(cacheKey, results);
      
      // Save to database
      await this.saveSearchHistory(query, results.length, engine, userIp);
      
      return results;
    } catch (error) {
      console.error(`Search error for engine ${engine}:`, error);
      
      // If fallback is enabled, try all engines
      if (fallback) {
        console.log(`Primary engine failed, trying all engines...`);
        return await this.searchAllEngines(query, { page, safe, userIp });
      }
      
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async searchSingleEngine(query, engine, options = {}) {
    const { page = 1, safe = true } = options;
    
    console.log(`Searching ${engine} for: "${query}"`);
    
    try {
      const results = await SearchScraper.search({
        query: query,
        engine: engine,
        page: page,
        safe: safe
      });

      // Transform results to match our format
      const transformedResults = results.map((result, index) => ({
        title: result.title || result.name || 'No title',
        url: result.url || result.link || '',
        snippet: result.description || result.snippet || 'No description available',
        rank: index + 1,
        engine: engine
      }));

      console.log(`${engine} returned ${transformedResults.length} results`);
      return transformedResults;
    } catch (error) {
      console.error(`${engine} search failed:`, error.message);
      return [];
    }
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
        const results = await this.searchSingleEngine(query, engineName, { page, safe });
        
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
    const cacheKey = `scraper:all:${query}:${page}:${safe}`;
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
      const enginePriority = { 'bing': 1, 'google': 2, 'duckduckgo': 3, 'yahoo': 4, 'aol': 5, 'ask': 6 };
      const aPriority = enginePriority[a.engine] || 7;
      const bPriority = enginePriority[b.engine] || 7;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Finally, by original rank
      return a.original_rank - b.original_rank;
    });
    
    return deduplicated;
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
                default_search_engine: 'all',
                results_per_page: 10,
                safe_search: true
              });
            }
          }
        );
      });
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {
        default_search_engine: 'all',
        results_per_page: 10,
        safe_search: true
      };
    }
  }

  async updateUserPreferences(userIp, preferences) {
    try {
      const db = database.getDb();
      return new Promise((resolve, reject) => {
        db.run(
          `INSERT OR REPLACE INTO user_preferences 
           (user_ip, default_search_engine, results_per_page, safe_search, updated_at) 
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            userIp,
            preferences.default_search_engine || 'all',
            preferences.results_per_page || 10,
            preferences.safe_search !== undefined ? preferences.safe_search : true
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
    return [...Object.keys(this.searchEngines), 'all'];
  }

  clearCache() {
    cache.flushAll();
    return { message: 'Cache cleared successfully' };
  }
}

module.exports = new SearchScraperService(); 