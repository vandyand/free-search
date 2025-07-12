const request = require('supertest');
const app = require('../server');

describe('Web Search Service API', () => {
  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('GET /api/search/engines', () => {
    it('should return available search engines', async () => {
      const response = await request(app).get('/api/search/engines');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('engines');
      expect(Array.isArray(response.body.engines)).toBe(true);
      expect(response.body.engines).toContain('google');
      expect(response.body.engines).toContain('bing');
    });
  });

  describe('GET /api/search', () => {
    it('should require query parameter', async () => {
      const response = await request(app).get('/api/search');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate search engine parameter', async () => {
      const response = await request(app).get('/api/search?q=test&engine=invalid');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate page parameter', async () => {
      const response = await request(app).get('/api/search?q=test&page=0');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/search/history', () => {
    it('should return search history', async () => {
      const response = await request(app).get('/api/search/history');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('history');
      expect(response.body).toHaveProperty('count');
    });

    it('should validate limit parameter', async () => {
      const response = await request(app).get('/api/search/history?limit=101');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/search/preferences', () => {
    it('should return user preferences', async () => {
      const response = await request(app).get('/api/search/preferences');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('preferences');
      expect(response.body).toHaveProperty('user_ip');
    });
  });

  describe('PUT /api/search/preferences', () => {
    it('should validate search engine preference', async () => {
      const response = await request(app)
        .put('/api/search/preferences')
        .send({ default_search_engine: 'invalid' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate results per page', async () => {
      const response = await request(app)
        .put('/api/search/preferences')
        .send({ results_per_page: 100 });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/search/advanced', () => {
    it('should require query parameter', async () => {
      const response = await request(app)
        .post('/api/search/advanced')
        .send({ engines: ['google'] });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should require engines array', async () => {
      const response = await request(app)
        .post('/api/search/advanced')
        .send({ query: 'test' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate engines array', async () => {
      const response = await request(app)
        .post('/api/search/advanced')
        .send({ 
          query: 'test', 
          engines: ['invalid'] 
        });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/search/cache', () => {
    it('should clear cache', async () => {
      const response = await request(app).delete('/api/search/cache');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });
}); 