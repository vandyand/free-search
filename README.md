# Web Search Service API

A high-performance web search service with support for multiple search engines built with Node.js and Express. Features Puppeteer-based search (most reliable) with parallel searching across Searx, Bing, and Ecosia by default, plus custom scraping and npm library-based search capabilities.

## Features

- 🤖 **Puppeteer-Based Search**: Most reliable search using browser automation
- ⚡ **Parallel Search**: Simultaneous searching across Searx, Bing, and Ecosia by default
- 🔍 **Multi-Engine Support**: 15+ search engines including Google, Bing, DuckDuckGo, Yahoo, Brave, and more
- 🔧 **Triple Search Services**: Puppeteer (default) + Custom scraping + npm library-based search
- 📊 **Search History**: Track and retrieve search history by IP
- ⚙️ **User Preferences**: Customizable search settings per user
- 🚀 **Result Caching**: Intelligent caching for improved performance
- 🛡️ **Rate Limiting**: Built-in protection against abuse
- 🔒 **Safe Search**: Configurable content filtering
- 📈 **Advanced Search**: Search across multiple engines simultaneously

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd web-search-service

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the service
npm start
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Search Configuration
# This service uses free web scraping - no API keys required!
# All search engines are accessed directly without external APIs

# Database Configuration
DB_PATH=./database/search_service.db

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Usage

### Default Search (Puppeteer - Recommended)

The service now uses Puppeteer by default with parallel searching across the three most reliable engines: **Searx**, **Bing**, and **Ecosia**.

```bash
# Default search (uses Puppeteer with Searx, Bing, Ecosia)
curl "http://localhost:3000/api/search?q=javascript"

# Explicitly use default engine
curl "http://localhost:3000/api/search?q=javascript&engine=default"

# Disable Puppeteer and use legacy scraping
curl "http://localhost:3000/api/search?q=javascript&usePuppeteer=false"
```

**Benefits of Default Search:**
- ⚡ **Parallel Processing**: All three engines searched simultaneously
- 🎯 **Best Results**: Combines results from the most reliable engines
- 🚀 **Fast Performance**: Optimized result deduplication and ranking
- 🔄 **Automatic Fallback**: Falls back to other engines if one fails

### Basic Search (Custom Scraping)

```bash
# Simple search with default engine (Puppeteer + Searx, Bing, Ecosia)
curl "http://localhost:3000/api/search?q=javascript"

# Search with specific engine
curl "http://localhost:3000/api/search?q=nodejs&engine=bing"

# Search with pagination
curl "http://localhost:3000/api/search?q=python&page=2"

# Search with safe search disabled
curl "http://localhost:3000/api/search?q=programming&safe=false"
```

### Search with Puppeteer (Most Reliable)

```bash
# Search using Puppeteer (most reliable)
curl "http://localhost:3000/api/puppeteer/search?q=javascript"

# Search specific engine with Puppeteer
curl "http://localhost:3000/api/puppeteer/search?q=nodejs&engine=bing"

# Search all engines simultaneously
curl "http://localhost:3000/api/puppeteer/search?q=python&engine=all"

# Get text format for terminal usage
curl "http://localhost:3000/api/puppeteer/search?q=programming&format=text"
```

### Advanced Search (Multiple Engines)

```bash
# Search across multiple engines
curl -X POST "http://localhost:3000/api/search/advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence",
    "engines": ["google", "bing", "duckduckgo", "brave"],
    "page": 1,
    "safe": true
  }'
```

### Search History

```bash
# Get search history (last 50 searches)
curl "http://localhost:3000/api/search/history"

# Get limited search history
curl "http://localhost:3000/api/search/history?limit=10"

# Get scraper service history
curl "http://localhost:3000/api/scraper/history"

# Get Puppeteer service history
curl "http://localhost:3000/api/puppeteer/history"
```

### User Preferences

```bash
# Get current preferences
curl "http://localhost:3000/api/search/preferences"

# Update preferences
curl -X PUT "http://localhost:3000/api/search/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "default_search_engine": "bing",
    "results_per_page": 20,
    "safe_search": false
  }'
```

### System Information

```bash
# Health check
curl "http://localhost:3000/health"

# System status
curl "http://localhost:3000/api/status"

# API documentation
curl "http://localhost:3000/api/docs"

# Available search engines
curl "http://localhost:3000/api/search/engines"

# Scraper service health
curl "http://localhost:3000/api/scraper/health"

# Available scraper engines
curl "http://localhost:3000/api/scraper/engines"

# Puppeteer service health
curl "http://localhost:3000/api/puppeteer/health"

# Available Puppeteer engines
curl "http://localhost:3000/api/puppeteer/engines"
```

### Cache Management

```bash
# Clear search cache
curl -X DELETE "http://localhost:3000/api/search/cache"

# Clear scraper cache
curl -X POST "http://localhost:3000/api/scraper/cache/clear"

# Clear Puppeteer cache
curl -X POST "http://localhost:3000/api/puppeteer/cache/clear"
```

## API Endpoints

### Search Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search` | Perform a web search (custom scraping) |
| POST | `/api/search/advanced` | Advanced multi-engine search |
| GET | `/api/search/history` | Get search history |
| GET | `/api/search/preferences` | Get user preferences |
| PUT | `/api/search/preferences` | Update user preferences |
| GET | `/api/search/engines` | Get available search engines |
| DELETE | `/api/search/cache` | Clear search cache |

### Scraper Endpoints (NPM Library)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scraper/search` | Perform a web search (npm library) |
| GET | `/api/scraper/history` | Get search history |
| GET | `/api/scraper/preferences` | Get user preferences |
| POST | `/api/scraper/preferences` | Update user preferences |
| GET | `/api/scraper/engines` | Get available search engines |
| POST | `/api/scraper/cache/clear` | Clear search cache |
| GET | `/api/scraper/health` | Scraper service health |

### Puppeteer Endpoints (Most Reliable)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/puppeteer/search` | Perform a web search (Puppeteer) |
| GET | `/api/puppeteer/history` | Get search history |
| GET | `/api/puppeteer/preferences` | Get user preferences |
| POST | `/api/puppeteer/preferences` | Update user preferences |
| GET | `/api/puppeteer/engines` | Get available search engines |
| POST | `/api/puppeteer/cache/clear` | Clear search cache |
| GET | `/api/puppeteer/health` | Puppeteer service health |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API root information |
| GET | `/health` | Health check |
| GET | `/api/status` | System status |
| GET | `/api/info` | System information |
| GET | `/api/docs` | API documentation |

## Search Parameters

### GET /api/search (Custom Scraping)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search query |
| `engine` | string | No | `google` | Search engine (`google`, `bing`, `duckduckgo`, `yahoo`, `brave`) |
| `page` | number | No | `1` | Page number (1-10) |
| `safe` | boolean | No | `true` | Safe search filter |

### GET /api/scraper/search (NPM Library)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search query |
| `engine` | string | No | `all` | Search engine (`google`, `bing`, `yahoo`, `duckduckgo`, `aol`, `ask`, `all`) |
| `page` | number | No | `1` | Page number (1-10) |
| `safe` | boolean | No | `true` | Safe search filter |
| `format` | string | No | `json` | Response format (`json`, `text`) |

### GET /api/puppeteer/search (Most Reliable)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search query |
| `engine` | string | No | `all` | Search engine (`bing`, `searx`, `ecosia`, `baidu`, `all`) |
| `page` | number | No | `1` | Page number (1-10) |
| `safe` | boolean | No | `true` | Safe search filter |
| `format` | string | No | `json` | Response format (`json`, `text`) |

**Working Engines:**
- **bing**: Fastest, most reliable (9 results avg)
- **searx**: Best overall performance (10 results avg)
- **ecosia**: Good alternative (10 results avg)
- **baidu**: Chinese search engine (8 results avg)

### POST /api/search/advanced

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search query |
| `engines` | array | Yes | - | Array of search engines |
| `page` | number | No | `1` | Page number (1-5) |
| `safe` | boolean | No | `true` | Safe search filter |

## Response Format

### Successful Search Response

```json
{
  "query": "javascript",
  "engine": "google",
  "page": 1,
  "safe": true,
  "results_count": 10,
  "results": [
    {
      "title": "JavaScript - MDN Web Docs",
      "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      "snippet": "JavaScript (JS) is a lightweight, interpreted, or just-in-time compiled programming language...",
      "rank": 1,
      "engine": "google"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response

```json
{
  "error": "Search failed",
  "message": "Invalid search engine specified"
}
```

## Service Comparison

### Three Search Services Available

| Feature | Custom Scraping (`/api/search`) | NPM Library (`/api/scraper`) | Puppeteer (`/api/puppeteer`) |
|---------|----------------------------------|-------------------------------|------------------------------|
| **Engines** | Google, Bing, DuckDuckGo, Yahoo, Brave | Google, Bing, Yahoo, DuckDuckGo, AOL, Ask | Bing, Searx, Ecosia, Baidu (4/15 working) |
| **Reliability** | Variable (depends on site changes) | Low (library issues) | High (modern browser automation) |
| **Performance** | Fast (direct HTTP requests) | Very fast (but no results) | Slower (browser automation) |
| **Dependencies** | Minimal (axios, cheerio) | Heavy (Nightmare.js, Electron) | Medium (Puppeteer) |
| **Maintenance** | Manual (requires updates) | Automatic (but broken) | Manual (requires updates) |
| **Fallback** | Built-in multi-engine fallback | Individual engine handling | Built-in multi-engine fallback |
| **Text Format** | No | Yes (`format=text`) | Yes (`format=text`) |
| **Success Rate** | ~80% | 0% (no results) | ~100% |

### When to Use Each Service

- **Use Custom Scraping** (`/api/search`): For fastest responses, lighter resource usage, or when you need Brave search
- **Use Puppeteer** (`/api/puppeteer`): For highest reliability and consistent results
- **Avoid NPM Library** (`/api/scraper`): Currently not working properly

## Development

### Running in Development Mode

```bash
npm run dev
```

### Running Tests

```bash
npm test

# Test and compare both search services
node scripts/test-scraper.js

# Comprehensive test of all three services
node scripts/test-all-services.js

# Test all Puppeteer engines
node scripts/test-puppeteer-engines.js
```

### Linting

```bash
npm run lint
```

## Database Schema

The service uses SQLite with the following tables:

- `search_history`: Stores search queries and metadata
- `search_results`: Stores individual search results
- `user_preferences`: Stores user-specific settings

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Scope**: All `/api/` endpoints
- **Headers**: Rate limit information included in response headers

## Caching

- **Duration**: 5 minutes for search results
- **Scope**: Per query, engine, page, and safe search setting
- **Management**: Automatic cache invalidation and manual clearing

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Request parameter validation
- **SQL Injection Protection**: Parameterized queries

## Troubleshooting

### Common Issues

1. **Search API failures**: The service includes fallback mechanisms for when external APIs fail
2. **Rate limiting**: Check the response headers for rate limit information
3. **Database errors**: Ensure the database directory is writable

### Logs

The service logs important events to the console:
- Search requests and results
- API errors and fallbacks
- Database operations
- Rate limit violations

## License

MIT License - see LICENSE file for details. 