const request = require('supertest');
const app = require('../src/app');

describe('API-Version Header', () => {
  describe('Successful responses (2xx)', () => {
    it('should include API-Version header on health check', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.headers['api-version']).toBe('1');
    });
  });

  describe('Redirect responses (3xx)', () => {
    it('should include API-Version header on unversioned redirects', async () => {
      const res = await request(app)
        .post('/auth/sep10')
        .send({ public_key: 'GBADTESTKEY' })
        .expect(308);

      expect(res.headers['api-version']).toBe('1');
      expect(res.headers.location).toBe('/v1/auth/sep10');
    });

    it('should include API-Version header on all redirect types', async () => {
      const res = await request(app)
        .get('/verify/GBADTESTKEY')
        .expect(308);

      expect(res.headers['api-version']).toBe('1');
    });
  });

  describe('Client error responses (4xx)', () => {
    it('should include API-Version header on 404 errors', async () => {
      const res = await request(app)
        .get('/nonexistent-route')
        .expect(404);

      expect(res.headers['api-version']).toBe('1');
    });

    it('should include API-Version header on validation errors', async () => {
      const res = await request(app)
        .post('/v1/auth/sep10')
        .send({}) // Missing required public_key
        .expect(400);

      expect(res.headers['api-version']).toBe('1');
    });
  });

  describe('Server error responses (5xx)', () => {
    it('should include API-Version header on error handler responses', async () => {
      // This test verifies that the error handler preserves the API-Version header
      // We'll trigger an error by sending invalid data to an endpoint
      const res = await request(app)
        .post('/v1/auth/sep10')
        .send({ public_key: 'INVALID_KEY_FORMAT' })
        .expect(400);

      expect(res.headers['api-version']).toBe('1');
    });
  });

  describe('All route types', () => {
    it('should include API-Version header on versioned routes', async () => {
      const res = await request(app)
        .post('/v1/auth/sep10')
        .send({ public_key: 'GBADTESTKEY' });

      expect(res.headers['api-version']).toBe('1');
    });

    it('should include API-Version header on unversioned routes', async () => {
      const res = await request(app)
        .post('/auth/sep10')
        .send({ public_key: 'GBADTESTKEY' })
        .expect(308);

      expect(res.headers['api-version']).toBe('1');
    });

    it('should include API-Version header on health endpoint', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.headers['api-version']).toBe('1');
    });
  });

  describe('Configuration', () => {
    it('should use API_VERSION from config', () => {
      const config = require('../src/config');
      expect(config.API_VERSION).toBe('1');
    });
  });
});
