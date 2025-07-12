const puppeteer = require('puppeteer');
const NodeCache = require('node-cache');
const { v4: uuidv4 } = require('uuid');
const database = require('../database/init');

// Cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

class PuppeteerSearchService {
  constructor() {
    this.browser = null;
    this.searchEngines = {
      google: {
        url: 'https://www.google.com/search',
        selectors: {
          results: 'div.g',
          title: 'h3',
          link: 'a[href^="http"]',
          snippet: '.VwiC3b'
        }
      },
      bing: {
        url: 'https://www.bing.com/search',
        selectors: {
          results: '.b_algo',
          title: 'h2 a',
          link: 'h2 a',
          snippet: '.b_caption p'
        }
      },
      duckduckgo: {
        url: 'https://duckduckgo.com/',
        selectors: {
          results: '.result',
          title: '.result__title a',
          link: '.result__title a',
          snippet: '.result__snippet'
        }
      },
      yahoo: {
        url: 'https://search.yahoo.com/search',
        selectors: {
          results: '.algo',
          title: 'h3 a',
          link: 'h3 a',
          snippet: '.compText'
        }
      },
      brave: {
        url: 'https://search.brave.com/search',
        selectors: {
          results: '.result',
          title: '.result-header h2 a',
          link: '.result-header h2 a',
          snippet: '.snippet-content'
        }
      },
      startpage: {
        url: 'https://www.startpage.com/sp/search',
        selectors: {
          results: '.result',
          title: '.result__title a',
          link: '.result__title a',
          snippet: '.result__snippet'
        }
      },
      searx: {
        url: 'https://searx.be/search',
        selectors: {
          results: '.result',
          title: 'h3 a',
          link: 'h3 a',
          snippet: '.content'
        }
      },
      qwant: {
        url: 'https://www.qwant.com/',
        selectors: {
          results: '.result',
          title: '.result__title a',
          link: '.result__title a',
          snippet: '.result__snippet'
        }
      },
      ecosia: {
        url: 'https://www.ecosia.org/search',
        selectors: {
          results: '.result',
          title: '.result__title a',
          link: '.result__title a',
          snippet: '.result__snippet'
        }
      },
      swisscows: {
        url: 'https://swisscows.com/web',
        selectors: {
          results: '.result',
          title: 'h3 a',
          link: 'h3 a',
          snippet: '.content'
        }
      },
      mojeek: {
        url: 'https://www.mojeek.com/search',
        selectors: {
          results: '.result',
          title: 'h3 a',
          link: 'h3 a',
          snippet: '.snippet'
        }
      },
      yandex: {
        url: 'https://yandex.com/search',
        selectors: {
          results: '.serp-item',
          title: '.organic__url',
          link: '.organic__url',
          snippet: '.organic__text'
        }
      },
      baidu: {
        url: 'https://www.baidu.com/s',
        selectors: {
          results: '.result',
          title: 'h3 a',
          link: 'h3 a',
          snippet: '.content'
        }
      },
      naver: {
        url: 'https://search.naver.com/search.naver',
        selectors: {
          results: '.sh_web_top',
          title: 'a.link_tit',
          link: 'a.link_tit',
          snippet: '.dsc_txt'
        }
      },
      seznam: {
        url: 'https://search.seznam.cz/',
        selectors: {
          results: '.result',
          title: 'h3 a',
          link: 'h3 a',
          snippet: '.content'
        }
      }
    };
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }
    return this.browser;
  }

  async search(query, options = {}) {
    const {
      engine = 'all',
      page = 1,
      safe = true,
      userIp = null,
      fallback = true
    } = options;

    const cacheKey = `puppeteer:${engine}:${query}:${page}:${safe}`;
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
    
    if (!this.searchEngines[engine]) {
      throw new Error(`Unsupported search engine: ${engine}`);
    }

    const browser = await this.initBrowser();
    const pageInstance = await browser.newPage();
    
    try {
      // Set user agent
      await pageInstance.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Set viewport
      await pageInstance.setViewport({ width: 1920, height: 1080 });
      
      // Set extra headers
      await pageInstance.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });
      
      const engineConfig = this.searchEngines[engine];
      let url;
      
      // Build URL based on engine
      if (engine === 'google') {
        url = `${engineConfig.url}?q=${encodeURIComponent(query)}&start=${(page - 1) * 10}`;
        if (!safe) url += '&safe=off';
      } else if (engine === 'bing') {
        url = `${engineConfig.url}?q=${encodeURIComponent(query)}&first=${(page - 1) * 10 + 1}`;
        if (!safe) url += '&adlt=off';
      } else if (engine === 'duckduckgo') {
        url = `${engineConfig.url}?q=${encodeURIComponent(query)}&t=h_`;
        if (!safe) url += '&safe=off';
      } else if (engine === 'yahoo') {
        url = `${engineConfig.url}?p=${encodeURIComponent(query)}&b=${(page - 1) * 10 + 1}`;
        if (!safe) url += '&vm=r';
      } else if (engine === 'brave') {
        url = `${engineConfig.url}?q=${encodeURIComponent(query)}&offset=${(page - 1) * 10}`;
        if (!safe) url += '&safesearch=off';
      } else if (engine === 'startpage') {
        url = `${engineConfig.url}?query=${encodeURIComponent(query)}&startat=${(page - 1) * 10}`;
        if (!safe) url += '&cat=web&language=english';
      } else if (engine === 'searx') {
        url = `${engineConfig.url}?q=${encodeURIComponent(query)}&pageno=${page}`;
        if (!safe) url += '&safesearch=0';
      } else if (engine === 'qwant') {
        url = `${engineConfig.url}?q=${encodeURIComponent(query)}&t=web&locale=en_US`;
        if (!safe) url += '&safesearch=off';
      } else if (engine === 'ecosia') {
        url = `${engineConfig.url}?q=${encodeURIComponent(query)}&p=${page}`;
        if (!safe) url += '&safesearch=off';
      } else if (engine === 'swisscows') {
        url = `${engineConfig.url}?query=${encodeURIComponent(query)}&page=${page}`;
        if (!safe) url += '&safesearch=off';
      } else if (engine === 'mojeek') {
        url = `${engineConfig.url}?q=${encodeURIComponent(query)}&start=${(page - 1) * 10}`;
        if (!safe) url += '&safesearch=off';
      } else if (engine === 'yandex') {
        url = `${engineConfig.url}?text=${encodeURIComponent(query)}&p=${page}`;
        if (!safe) url += '&lr=1033';
      } else if (engine === 'baidu') {
        url = `${engineConfig.url}?wd=${encodeURIComponent(query)}&pn=${(page - 1) * 10}`;
        if (!safe) url += '&rn=10';
      } else if (engine === 'naver') {
        url = `${engineConfig.url}?query=${encodeURIComponent(query)}&start=${(page - 1) * 10 + 1}`;
        if (!safe) url += '&where=web';
      } else if (engine === 'seznam') {
        url = `${engineConfig.url}?q=${encodeURIComponent(query)}&from=${(page - 1) * 10}`;
        if (!safe) url += '&safesearch=off';
      }
      
      console.log(`Navigating to: ${url}`);
      
      // Navigate to search page
      await pageInstance.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for results to load (try multiple selectors)
      let resultsFound = false;
      const selectorsToTry = [
        engineConfig.selectors.results,
        'div[class*="result"]',
        'div[class*="algo"]',
        'div[class*="serp"]',
        'article',
        '.result',
        '.algo',
        '.serp-item'
      ];
      
      for (const selector of selectorsToTry) {
        try {
          await pageInstance.waitForSelector(selector, { timeout: 5000 });
          resultsFound = true;
          console.log(`Found results with selector: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!resultsFound) {
        console.log(`No results found for ${engine} with any selector`);
        return [];
      }
      
      // Extract results
      const results = await pageInstance.evaluate((selectors) => {
        const resultElements = document.querySelectorAll(selectors.results);
        const extractedResults = [];
        
        resultElements.forEach((element, index) => {
          try {
            const titleElement = element.querySelector(selectors.title);
            const linkElement = element.querySelector(selectors.link);
            const snippetElement = element.querySelector(selectors.snippet);
            
            if (titleElement && linkElement) {
              const title = titleElement.textContent.trim();
              const url = linkElement.href;
              const snippet = snippetElement ? snippetElement.textContent.trim() : '';
              
              if (title && url && !url.includes('javascript:') && !url.startsWith('#')) {
                extractedResults.push({
                  title,
                  url,
                  snippet,
                  rank: index + 1
                });
              }
            }
          } catch (error) {
            console.error('Error extracting result:', error);
          }
        });
        
        return extractedResults;
      }, engineConfig.selectors);
      
      console.log(`${engine} returned ${results.length} results`);
      return results;
      
    } catch (error) {
      console.error(`${engine} search failed:`, error.message);
      return [];
    } finally {
      await pageInstance.close();
    }
  }

  async searchAllEngines(query, options = {}) {
    const { page = 1, safe = true, userIp = null } = options;
    
    console.log(`Searching all engines for: "${query}"`);
    
    const allResults = [];
    const workingEngines = [];
    
    // Search all engines simultaneously
    const searchPromises = Object.keys(this.searchEngines).map(async (engineName) => {
      try {
        console.log(`Searching ${engineName}...`);
        const results = await this.searchSingleEngine(query, engineName, { page, safe });
        
        if (results && results.length > 0) {
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
    
    // Take the best results (up to 20 total)
    const finalResults = deduplicatedResults.slice(0, 20);
    
    // Re-rank results
    finalResults.forEach((result, index) => {
      result.rank = index + 1;
    });
    
    console.log(`Combined results from ${workingEngines.length} engines: ${finalResults.length} unique results`);
    
    // Cache the combined results
    const cacheKey = `puppeteer:all:${query}:${page}:${safe}`;
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
      const enginePriority = { 
        'bing': 1, 
        'google': 2, 
        'duckduckgo': 3, 
        'yahoo': 4, 
        'brave': 5,
        'startpage': 6,
        'searx': 7,
        'qwant': 8,
        'ecosia': 9,
        'swisscows': 10,
        'mojeek': 11,
        'yandex': 12,
        'baidu': 13,
        'naver': 14,
        'seznam': 15
      };
      const aPriority = enginePriority[a.engine] || 16;
      const bPriority = enginePriority[b.engine] || 16;
      
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

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new PuppeteerSearchService(); 