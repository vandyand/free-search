const express = require('express');
const { body, query, validationResult } = require('express-validator');
const searchService = require('../services/searchService');
const router = express.Router();

// Get client IP address
const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
};

// Search endpoint
router.get('/', [
  query('q').notEmpty().withMessage('Query parameter is required'),
  query('engine').optional().isIn(['google', 'bing', 'duckduckgo', 'yahoo', 'brave', 'all', 'default']).withMessage('Invalid search engine'),
  query('page').optional().isInt({ min: 1, max: 10 }).withMessage('Page must be between 1 and 10'),
  query('safe').optional().isBoolean().withMessage('Safe search must be boolean'),
  query('usePuppeteer').optional().isBoolean().withMessage('Use Puppeteer must be boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { q, engine, page, safe, usePuppeteer } = req.query;
    const userIp = getClientIp(req);

    // Get user preferences
    const preferences = await searchService.getUserPreferences(userIp);
    
    const searchOptions = {
      engine: engine || preferences.default_search_engine || 'default',
      page: parseInt(page) || 1,
      safe: safe !== undefined ? safe === 'true' : preferences.safe_search,
      usePuppeteer: usePuppeteer !== undefined ? usePuppeteer === 'true' : true, // Default to Puppeteer
      userIp
    };

    const results = await searchService.search(q, searchOptions);

    res.json({
      query: q,
      engine: searchOptions.engine,
      page: searchOptions.page,
      safe: searchOptions.safe,
      use_puppeteer: searchOptions.usePuppeteer,
      results_count: results.length,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message 
    });
  }
});

// Search history endpoint
router.get('/history', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { limit } = req.query;
    const userIp = getClientIp(req);

    const history = await searchService.getSearchHistory(
      parseInt(limit) || 50, 
      userIp
    );

    res.json({
      history,
      count: history.length,
      user_ip: userIp
    });

  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ 
      error: 'Failed to get search history', 
      message: error.message 
    });
  }
});

// User preferences endpoint
router.get('/preferences', async (req, res) => {
  try {
    const userIp = getClientIp(req);
    const preferences = await searchService.getUserPreferences(userIp);

    res.json({
      preferences,
      user_ip: userIp
    });

  } catch (error) {
    console.error('Preferences error:', error);
    res.status(500).json({ 
      error: 'Failed to get preferences', 
      message: error.message 
    });
  }
});

// Update user preferences endpoint
router.put('/preferences', [
  body('default_search_engine').optional().isIn(['google', 'bing', 'duckduckgo', 'yahoo', 'brave', 'all', 'default']).withMessage('Invalid search engine'),
  body('results_per_page').optional().isInt({ min: 5, max: 50 }).withMessage('Results per page must be between 5 and 50'),
  body('safe_search').optional().isBoolean().withMessage('Safe search must be boolean'),
  body('use_puppeteer').optional().isBoolean().withMessage('Use Puppeteer must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const userIp = getClientIp(req);
    const preferences = req.body;

    await searchService.updateUserPreferences(userIp, preferences);

    res.json({
      message: 'Preferences updated successfully',
      user_ip: userIp,
      updated_preferences: preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ 
      error: 'Failed to update preferences', 
      message: error.message 
    });
  }
});

// Available search engines endpoint
router.get('/engines', (req, res) => {
  try {
    const engines = searchService.getAvailableEngines();
    
    res.json({
      engines,
      count: engines.length,
      description: 'Available search engines for the web search service'
    });

  } catch (error) {
    console.error('Engines error:', error);
    res.status(500).json({ 
      error: 'Failed to get available engines', 
      message: error.message 
    });
  }
});

// Clear cache endpoint
router.delete('/cache', (req, res) => {
  try {
    const result = searchService.clearCache();
    
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

// Advanced search endpoint with multiple engines
router.post('/advanced', [
  body('query').notEmpty().withMessage('Query is required'),
  body('engines').isArray({ min: 1, max: 4 }).withMessage('Must specify 1-4 search engines'),
  body('engines.*').isIn(['google', 'bing', 'duckduckgo', 'yahoo', 'brave', 'all']).withMessage('Invalid search engine'),
  body('page').optional().isInt({ min: 1, max: 5 }).withMessage('Page must be between 1 and 5'),
  body('safe').optional().isBoolean().withMessage('Safe search must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { query, engines, page, safe } = req.body;
    const userIp = getClientIp(req);

    const results = {};
    const promises = engines.map(async (engine) => {
      try {
        const engineResults = await searchService.search(query, {
          engine,
          page: page || 1,
          safe: safe !== undefined ? safe : true,
          userIp
        });
        results[engine] = engineResults;
      } catch (error) {
        results[engine] = { error: error.message };
      }
    });

    await Promise.all(promises);

    res.json({
      query,
      engines,
      page: page || 1,
      safe: safe !== undefined ? safe : true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ 
      error: 'Advanced search failed', 
      message: error.message 
    });
  }
});

module.exports = router; 