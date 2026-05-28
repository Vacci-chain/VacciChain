/**
 * CORS security configuration tests
 */
const request = require('supertest');

describe('CORS', () => {
  const ALLOWED = 'http://localhost:3000';
  const BLOCKED = 'https://evil.example.com';

  let app;

  beforeEach(() => {
    jest.resetModules();
    process.env.ALLOWED_ORIGINS = ALLOWED;
    app = require('../src/app');
  });

  it('allows requests from an allowed origin', async () => {
    const res = await request(app).get('/health').set('Origin', ALLOWED);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
  });

  it('blocks requests from a disallowed origin', async () => {
    const res = await request(app).get('/health').set('Origin', BLOCKED);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('handles preflight for allowed origin with 204', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', ALLOWED)
      .set('Access-Control-Request-Method', 'POST');
    
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
  });

  it('allows explicit methods in preflight response', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', ALLOWED)
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-methods']).toContain('GET');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
    expect(res.headers['access-control-allow-methods']).toContain('OPTIONS');
  });

  it('allows explicit headers in preflight response', async () => {
    const res = await request(app)
      .options('/health')
      .set('Origin', ALLOWED)
      .set('Access-Control-Request-Headers', 'Authorization,Content-Type');

    expect(res.headers['access-control-allow-headers']).toContain('Authorization');
    expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
  });

  it('sets credentials header for allowed origin', async () => {
    const res = await request(app).get('/health').set('Origin', ALLOWED);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('supports multiple allowed origins', async () => {
    jest.resetModules();
    process.env.ALLOWED_ORIGINS = `${ALLOWED},https://admin.example.com`;
    const multiApp = require('../src/app');

    const res = await request(multiApp)
      .get('/health')
      .set('Origin', 'https://admin.example.com');
    expect(res.headers['access-control-allow-origin']).toBe('https://admin.example.com');
  });

  it('does not use wildcard origin in any response', async () => {
    const origins = [ALLOWED, BLOCKED, 'http://random.org'];
    
    for (const origin of origins) {
      const res = await request(app).get('/health').set('Origin', origin);
      const allowedOriginHeader = res.headers['access-control-allow-origin'];
      
      if (allowedOriginHeader) {
        expect(allowedOriginHeader).not.toBe('*');
        expect(allowedOriginHeader).not.toContain('*');
      }
    }
  });

  it('allows GET requests with explicit method', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', ALLOWED);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
  });

  it('allows POST requests with explicit method', async () => {
    const res = await request(app)
      .post('/auth/sep10')
      .set('Origin', ALLOWED)
      .send({ public_key: 'invalid' });

    // POST is allowed; response may be 400 for validation but CORS should pass
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
  });
});
