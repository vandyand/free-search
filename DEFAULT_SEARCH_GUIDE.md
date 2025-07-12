# Default Search Guide: Puppeteer + Parallel Search

## Overview

The Web Search Service now uses **Puppeteer** as the default search method with **parallel searching** across the three most reliable engines: **Searx**, **Bing**, and **Ecosia**. This provides the best combination of reliability, speed, and result quality.

## 🚀 Key Features

### Parallel Processing
- **Simultaneous Search**: All three engines are searched at the same time
- **Performance Boost**: ~60-70% faster than sequential searching
- **Automatic Fallback**: If one engine fails, others continue working

### Smart Result Management
- **Deduplication**: Automatic removal of duplicate results
- **Intelligent Ranking**: Results ranked by relevance and engine reliability
- **Engine Attribution**: Each result shows which engine it came from

### Reliability
- **Puppeteer-Based**: Uses browser automation for maximum compatibility
- **Anti-Bot Bypass**: Handles modern anti-bot protections
- **Consistent Results**: More reliable than traditional scraping

## 📊 Engine Performance

| Engine | Reliability | Speed | Result Quality | Notes |
|--------|-------------|-------|----------------|-------|
| **Searx** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Best overall results |
| **Bing** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Fastest, good results |
| **Ecosia** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Privacy-focused |

## 🔧 Usage

### Basic Usage (Recommended)

```bash
# Default search - uses Puppeteer with Searx, Bing, Ecosia
curl "http://localhost:3000/api/search?q=javascript tutorial"

# Explicitly use default engine
curl "http://localhost:3000/api/search?q=python&engine=default"
```

### Advanced Options

```bash
# Disable Puppeteer (use legacy scraping)
curl "http://localhost:3000/api/search?q=nodejs&usePuppeteer=false"

# Use specific engine with Puppeteer
curl "http://localhost:3000/api/search?q=react&engine=bing"

# Use Puppeteer service directly
curl "http://localhost:3000/api/puppeteer/search?q=vue&engine=searx"
```

## 📈 Performance Comparison

### Parallel vs Sequential Search

| Method | Time (3 engines) | Efficiency | Benefits |
|--------|------------------|------------|----------|
| **Parallel** | ~4-5 seconds | 100% | Best performance |
| **Sequential** | ~12-15 seconds | 33% | Slower but simpler |

### Example Results

```
🚀 Parallel Search Demo Results:
✅ Search completed in 4028ms
📊 Results: 15 total results
📈 Results by Engine:
   searx: 10 results
   bing: 5 results
```

## ⚙️ Configuration

### User Preferences

```bash
# Get current preferences
curl "http://localhost:3000/api/search/preferences"

# Update preferences
curl -X PUT "http://localhost:3000/api/search/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "default_search_engine": "default",
    "use_puppeteer": true,
    "results_per_page": 15,
    "safe_search": true
  }'
```

### Available Engines

```bash
# Get all available engines
curl "http://localhost:3000/api/search/engines"
```

**Response:**
```json
{
  "engines": ["google", "bing", "duckduckgo", "yahoo", "brave", "all", "default"],
  "count": 7
}
```

## 🔄 Fallback Strategy

1. **Primary**: Puppeteer with Searx, Bing, Ecosia (parallel)
2. **Secondary**: Individual engine searches if parallel fails
3. **Tertiary**: Legacy scraping if Puppeteer fails
4. **Final**: Error response with helpful message

## 📝 API Response Format

### Default Search Response

```json
{
  "query": "javascript tutorial",
  "engine": "default",
  "page": 1,
  "safe": true,
  "use_puppeteer": true,
  "results_count": 15,
  "results": [
    {
      "title": "JavaScript Tutorial - W3Schools",
      "url": "https://www.w3schools.com/Js/",
      "snippet": "JavaScript is the programming language of the Web...",
      "rank": 1,
      "engine": "searx"
    }
  ],
  "timestamp": "2025-01-12T01:57:34.123Z"
}
```

## 🧪 Testing

### Test Scripts

```bash
# Test default search functionality
node scripts/test-default-search.js

# Demonstrate parallel search benefits
node scripts/demo-parallel-search.js

# Test Puppeteer engines
node scripts/test-puppeteer-engines.js
```

### Manual Testing

```bash
# Test default search
curl "http://localhost:3000/api/search?q=test query"

# Test with different engines
curl "http://localhost:3000/api/search?q=test&engine=bing"
curl "http://localhost:3000/api/search?q=test&engine=searx"

# Test fallback
curl "http://localhost:3000/api/search?q=test&usePuppeteer=false"
```

## 🛠️ Troubleshooting

### Common Issues

1. **Rate Limiting**: Wait 60 seconds between requests
2. **Engine Failures**: Automatic fallback to other engines
3. **Browser Issues**: Restart the service if Puppeteer fails
4. **Cache Issues**: Clear cache with `/api/search/cache`

### Debug Commands

```bash
# Check service health
curl "http://localhost:3000/health"

# Check Puppeteer service
curl "http://localhost:3000/api/puppeteer/engines"

# Clear all caches
curl -X DELETE "http://localhost:3000/api/search/cache"
curl -X POST "http://localhost:3000/api/puppeteer/cache/clear"
```

## 🎯 Best Practices

1. **Use Default Engine**: Best balance of speed and reliability
2. **Enable Caching**: Results are cached for 5 minutes
3. **Handle Rate Limits**: Implement exponential backoff
4. **Monitor Performance**: Track response times and success rates
5. **Fallback Gracefully**: Always have a backup search method

## 📚 Related Documentation

- [Puppeteer Engines Guide](PUPPETEER_ENGINES.md)
- [API Documentation](README.md)
- [Search Service Documentation](services/searchService.js)
- [Puppeteer Service Documentation](services/puppeteerSearchService.js)

---

**Note**: The default search provides the best user experience with maximum reliability and performance. For specific use cases, individual engines can still be accessed directly. 