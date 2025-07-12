const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const searchRoutes = require('./routes/search');
const searchScraperRoutes = require('./routes/searchScraper');
const puppeteerSearchRoutes = require('./routes/puppeteerSearch');
const apiRoutes = require('./routes/api');
const database = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/scraper', searchScraperRoutes);
app.use('/api/puppeteer', puppeteerSearchRoutes);
app.use('/api', apiRoutes);

// API root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Web Search Service API',
    version: '1.0.0',
    endpoints: {
      search: '/api/search',
      scraper: '/api/scraper',
      puppeteer: '/api/puppeteer',
      docs: '/api/docs',
      health: '/health',
      status: '/api/status'
    },
    usage: 'Use curl or any HTTP client to interact with the API'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    await database.init();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Web Search Service running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔍 API docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; 