const request = require('supertest');
const app = require('../src/app');

describe('Unversioned Path Redirects', () => {
  describe('POST /auth/sep10', () => {
    it('should redirect to /v1/auth/sep10 with 308 status', async () => {
      const res = await request(app)
        .post('/auth/sep10')
        .send({ public_key: 'GBADTESTKEY' })
        .expect(308);

      expect(res.headers.location).toBe('/v1/auth/sep10');
      expect(res.headers.deprecation).toBe('true');
    });
  });

  describe('POST /auth/verify', () => {
    it('should redirect to /v1/auth/verify with 308 status', async () => {
      const res = await request(app)
        .post('/auth/verify')
        .send({ transaction: 'test', nonce: 'test' })
        .expect(308);

      expect(res.headers.location).toBe('/v1/auth/verify');
      expect(res.headers.deprecation).toBe('true');
    });
  });

  describe('POST /vaccination/issue', () => {
    it('should redirect to /v1/vaccination/issue with 308 status', async () => {
      const res = await request(app)
        .post('/vaccination/issue')
        .send({ patient_address: 'GBADTEST', vaccine_name: 'COVID-19', date_administered: '2024-01-01' })
        .expect(308);

      expect(res.headers.location).toBe('/v1/vaccination/issue');
      expect(res.headers.deprecation).toBe('true');
    });
  });

  describe('GET /verify/public/:wallet', () => {
    it('should redirect to /v1/verify/public/:wallet with 308 status', async () => {
      const res = await request(app)
        .get('/verify/public/GBADTESTKEY')
        .expect(308);

      expect(res.headers.location).toBe('/v1/verify/public/GBADTESTKEY');
      expect(res.headers.deprecation).toBe('true');
    });
  });

  describe('GET /verify/:wallet', () => {
    it('should redirect to /v1/verify/:wallet with 308 status', async () => {
      const res = await request(app)
        .get('/verify/GBADTESTKEY')
        .expect(308);

      expect(res.headers.location).toBe('/v1/verify/GBADTESTKEY');
      expect(res.headers.deprecation).toBe('true');
    });
  });

  describe('GET /vaccination/:wallet', () => {
    it('should redirect to /v1/vaccination/:wallet with 308 status', async () => {
      const res = await request(app)
        .get('/vaccination/GBADTESTKEY')
        .expect(308);

      expect(res.headers.location).toBe('/v1/vaccination/GBADTESTKEY');
      expect(res.headers.deprecation).toBe('true');
    });
  });

  describe('POST /vaccination/revoke', () => {
    it('should redirect to /v1/vaccination/revoke with 308 status', async () => {
      const res = await request(app)
        .post('/vaccination/revoke')
        .send({ token_id: '123' })
        .expect(308);

      expect(res.headers.location).toBe('/v1/vaccination/revoke');
      expect(res.headers.deprecation).toBe('true');
    });
  });

  describe('Redirect preserves request method', () => {
    it('should use 308 (not 301) to preserve POST method', async () => {
      const res = await request(app)
        .post('/auth/sep10')
        .send({ public_key: 'GBADTESTKEY' })
        .expect(308);

      // 308 ensures the client will retry with POST, not GET
      expect(res.status).toBe(308);
    });
  });

  describe('Other unversioned paths', () => {
    it('should redirect /admin paths', async () => {
      const res = await request(app)
        .get('/admin/issuers')
        .expect(308);

      expect(res.headers.location).toBe('/v1/admin/issuers');
      expect(res.headers.deprecation).toBe('true');
    });

    it('should redirect /patient paths', async () => {
      const res = await request(app)
        .post('/patient/register')
        .send({})
        .expect(308);

      expect(res.headers.location).toBe('/v1/patient/register');
      expect(res.headers.deprecation).toBe('true');
    });

    it('should redirect /events paths', async () => {
      const res = await request(app)
        .get('/events')
        .expect(308);

      expect(res.headers.location).toBe('/v1/events');
      expect(res.headers.deprecation).toBe('true');
    });
  });
});
