const express = require('express');
const router = express.Router();

// API documentation endpoint
router.get('/docs', (req, res) => {
  const docs = {
    name: 'Web Search Service API',
    version: '1.0.0',
    description: 'A comprehensive web search service with multiple search engines',
    base_url: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      search: {
        'GET /search': {
          description: 'Perform a web search',
          parameters: {
            q: { type: 'string', required: true, description: 'Search query' },
            engine: { type: 'string', required: false, description: 'Search engine (google, bing, duckduckgo, yahoo, brave, all)', default: 'all' },
            page: { type: 'number', required: false, description: 'Page number (1-10)', default: 1 },
            safe: { type: 'boolean', required: false, description: 'Safe search filter', default: true }
          },
          example: 'GET /api/search?q=javascript&engine=google&page=1&safe=true'
        },
        'GET /search/history': {
          description: 'Get search history for the current user',
          parameters: {
            limit: { type: 'number', required: false, description: 'Number of results (1-100)', default: 50 }
          },
          example: 'GET /api/search/history?limit=20'
        },
        'GET /search/preferences': {
          description: 'Get user preferences',
          example: 'GET /api/search/preferences'
        },
        'PUT /search/preferences': {
          description: 'Update user preferences',
          body: {
            default_search_engine: { type: 'string', required: false, description: 'Default search engine' },
            results_per_page: { type: 'number', required: false, description: 'Results per page (5-50)' },
            safe_search: { type: 'boolean', required: false, description: 'Safe search setting' }
          },
          example: 'PUT /api/search/preferences'
        },
        'GET /search/engines': {
          description: 'Get available search engines',
          example: 'GET /api/search/engines'
        },
        'DELETE /search/cache': {
          description: 'Clear search cache',
          example: 'DELETE /api/search/cache'
        },
        'POST /search/advanced': {
          description: 'Advanced search with multiple engines',
          body: {
            query: { type: 'string', required: true, description: 'Search query' },
            engines: { type: 'array', required: true, description: 'Array of search engines' },
            page: { type: 'number', required: false, description: 'Page number (1-5)', default: 1 },
            safe: { type: 'boolean', required: false, description: 'Safe search filter', default: true }
          },
          example: 'POST /api/search/advanced'
        }
      },
      system: {
        'GET /health': {
          description: 'Health check endpoint',
          example: 'GET /health'
        },
        'GET /docs': {
          description: 'API documentation (this endpoint)',
          example: 'GET /api/docs'
        }
      }
    },
    search_engines: ['google', 'bing', 'duckduckgo', 'yahoo', 'brave', 'all'],
    features: [
      'Multi-engine search',
      'Search history tracking',
      'User preferences',
      'Result caching',
      'Safe search filtering',
      'Advanced multi-engine search',
      'Rate limiting',
      'Input validation'
    ],
    rate_limits: {
      'api_endpoints': '100 requests per 15 minutes per IP'
    }
  };

  res.json(docs);
});

// System information endpoint
router.get('/info', (req, res) => {
  const info = {
    service: 'Web Search Service',
    version: '1.0.0',
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };

  res.json(info);
});

// Status endpoint
router.get('/status', (req, res) => {
  const status = {
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    cpu: process.cpuUsage()
  };

  res.json(status);
});

module.exports = router; 