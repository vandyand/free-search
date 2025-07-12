# Web Search Service - Usage Guide

## Quick Start

```bash
# Start the service
./scripts/quick-start.sh

# Or manually
npm install
npm start
```

## Basic Usage Examples

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Search for "javascript"
```bash
curl "http://localhost:3000/api/search?q=javascript"
```

### 3. Search with specific engine
```bash
curl "http://localhost:3000/api/search?q=nodejs&engine=bing"
```

### 4. Search with pagination
```bash
curl "http://localhost:3000/api/search?q=python&page=2"
```

### 5. Advanced search across multiple engines
```bash
curl -X POST "http://localhost:3000/api/search/advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence",
    "engines": ["google", "bing", "duckduckgo"],
    "page": 1,
    "safe": true
  }'
```

### 6. Get search history
```bash
curl "http://localhost:3000/api/search/history?limit=10"
```

### 7. Update user preferences
```bash
curl -X PUT "http://localhost:3000/api/search/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "default_search_engine": "bing",
    "results_per_page": 20,
    "safe_search": false
  }'
```

### 8. Get available search engines
```bash
curl "http://localhost:3000/api/search/engines"
```

### 9. Clear cache
```bash
curl -X DELETE "http://localhost:3000/api/search/cache"
```

### 10. Get API documentation
```bash
curl "http://localhost:3000/api/docs"
```

## Testing the API

Run the comprehensive test script:
```bash
./scripts/test-api.sh
```

## Environment Variables

Create a `.env` file:
```bash
cp env.example .env
```

Key variables:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

**Note**: This service is completely free and uses web scraping - no API keys required!

## Docker Usage

### Using Docker Compose
```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Using Docker directly
```bash
# Build the image
docker build -t web-search-service .

# Run the container
docker run -p 3000:3000 web-search-service

# Run with environment variables
docker run -p 3000:3000 -e SERPAPI_KEY=your_key web-search-service
```

## API Response Format

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
      "snippet": "JavaScript (JS) is a lightweight, interpreted...",
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

## Search Engines

Available engines:
- `google` - Google Search
- `bing` - Bing Search
- `duckduckgo` - DuckDuckGo
- `yahoo` - Yahoo Search
- `brave` - Brave Search

## Rate Limiting

- 100 requests per 15 minutes per IP
- Check response headers for rate limit info
- Rate limits apply to all `/api/` endpoints

## Troubleshooting

### Service won't start
```bash
# Check Node.js version
node --version

# Check if port is in use
lsof -i :3000

# Check logs
npm start
```

### Search not working
```bash
# Check health
curl http://localhost:3000/health

# Check available engines
curl http://localhost:3000/api/search/engines

# Test with simple query
curl "http://localhost:3000/api/search?q=test"
```

### Database issues
```bash
# Remove database and restart
rm -f database/*.db
npm start
```

## Integration Examples

### Python
```python
import requests

# Basic search
response = requests.get('http://localhost:3000/api/search', params={'q': 'python'})
results = response.json()

# Advanced search
data = {
    'query': 'machine learning',
    'engines': ['google', 'bing'],
    'page': 1,
    'safe': True
}
response = requests.post('http://localhost:3000/api/search/advanced', json=data)
results = response.json()
```

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Basic search
const response = await axios.get('http://localhost:3000/api/search', {
  params: { q: 'javascript' }
});

// Advanced search
const response = await axios.post('http://localhost:3000/api/search/advanced', {
  query: 'artificial intelligence',
  engines: ['google', 'bing'],
  page: 1,
  safe: true
});
```

### Shell Script
```bash
#!/bin/bash

# Search function
search() {
    local query="$1"
    local engine="${2:-google}"
    
    curl -s "http://localhost:3000/api/search?q=$query&engine=$engine" | jq '.results[] | {title, url, snippet}'
}

# Usage
search "javascript" "bing"
```

## Performance Tips

1. **Use caching**: Results are cached for 5 minutes
2. **Batch requests**: Use advanced search for multiple engines
3. **Monitor rate limits**: Stay within 100 requests per 15 minutes
4. **Use specific engines**: Avoid unnecessary multi-engine searches

## Security Notes

- Service includes rate limiting and input validation
- SQL injection protection via parameterized queries
- CORS enabled for cross-origin requests
- Security headers via Helmet.js 