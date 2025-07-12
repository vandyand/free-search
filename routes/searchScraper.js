const express = require('express');
const router = express.Router();
const searchScraperService = require('../services/searchScraperService');
const rateLimit = require('express-rate-limit');

// Rate limiting: 10 requests per minute per IP
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many search requests, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to search endpoints
router.use('/search', searchLimiter);

// Main search endpoint
router.get('/search', async (req, res) => {
  try {
    const {
      q: query,
      engine = 'all',
      page = 1,
      safe = 'true',
      format = 'json'
    } = req.query;

    const userIp = req.ip || req.connection.remoteAddress;

    if (!query) {
      return res.status(400).json({
        error: 'Query parameter "q" is required',
        example: '/api/scraper/search?q=javascript tutorial&engine=google'
      });
    }

    // Validate parameters
    const availableEngines = searchScraperService.getAvailableEngines();
    if (engine !== 'all' && !availableEngines.includes(engine)) {
      return res.status(400).json({
        error: `Invalid search engine. Available engines: ${availableEngines.join(', ')}`,
        available_engines: availableEngines
      });
    }

    const pageNum = parseInt(page) || 1;
    const safeSearch = safe === 'true';
    
    console.log(`Search request: "${query}" on ${engine}, page ${pageNum}, safe: ${safeSearch}`);

    const results = await searchScraperService.search(query, {
      engine: engine,
      page: pageNum,
      safe: safeSearch,
      userIp: userIp
    });

    const response = {
      query: query,
      engine: engine,
      page: pageNum,
      safe_search: safeSearch,
      total_results: results.length,
      results: results,
      timestamp: new Date().toISOString()
    };

    if (format === 'text') {
      // Text format for terminal usage
      let textOutput = `Search Results for: "${query}"\n`;
      textOutput += `Engine: ${engine}, Page: ${pageNum}, Results: ${results.length}\n`;
      textOutput += `Timestamp: ${response.timestamp}\n\n`;
      
      results.forEach((result, index) => {
        textOutput += `${index + 1}. ${result.title}\n`;
        textOutput += `   URL: ${result.url}\n`;
        textOutput += `   Engine: ${result.engine}\n`;
        if (result.snippet) {
          textOutput += `   ${result.snippet}\n`;
        }
        textOutput += '\n';
      });
      
      res.set('Content-Type', 'text/plain');
      return res.send(textOutput);
    }

    res.json(response);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get search history
router.get('/history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const userIp = req.ip || req.connection.remoteAddress;
    
    const history = await searchScraperService.getSearchHistory(parseInt(limit), userIp);
    
    res.json({
      history: history,
      total: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      error: 'Failed to retrieve search history',
      message: error.message
    });
  }
});

// Get user preferences
router.get('/preferences', async (req, res) => {
  try {
    const userIp = req.ip || req.connection.remoteAddress;
    const preferences = await searchScraperService.getUserPreferences(userIp);
    
    res.json({
      preferences: preferences,
      available_engines: searchScraperService.getAvailableEngines(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Preferences error:', error);
    res.status(500).json({
      error: 'Failed to retrieve preferences',
      message: error.message
    });
  }
});

// Update user preferences
router.post('/preferences', async (req, res) => {
  try {
    const userIp = req.ip || req.connection.remoteAddress;
    const preferences = req.body;
    
    // Validate preferences
    const availableEngines = searchScraperService.getAvailableEngines();
    if (preferences.default_search_engine && !availableEngines.includes(preferences.default_search_engine)) {
      return res.status(400).json({
        error: `Invalid search engine. Available engines: ${availableEngines.join(', ')}`
      });
    }
    
    await searchScraperService.updateUserPreferences(userIp, preferences);
    
    res.json({
      message: 'Preferences updated successfully',
      preferences: await searchScraperService.getUserPreferences(userIp),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: error.message
    });
  }
});

// Get available engines
router.get('/engines', (req, res) => {
  const engines = searchScraperService.getAvailableEngines();
  res.json({
    engines: engines,
    count: engines.length,
    timestamp: new Date().toISOString()
  });
});

// Clear cache
router.post('/cache/clear', (req, res) => {
  try {
    const result = searchScraperService.clearCache();
    res.json({
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'search-scraper',
    timestamp: new Date().toISOString(),
    engines: searchScraperService.getAvailableEngines()
  });
});

module.exports = router; 