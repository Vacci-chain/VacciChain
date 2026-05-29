const request = require('supertest');
const express = require('express');
const errorHandler = require('../src/middleware/errorHandler');
const requestId = require('../src/middleware/requestId');

function makeApp(routeHandler) {
  const app = express();
  app.use(requestId);
  app.get('/test', routeHandler);
  app.use(errorHandler);
  return app;
}

describe('errorHandler middleware', () => {
  it('returns 500 with generic message for unexpected errors', async () => {
    const app = makeApp((_req, _res, next) => {
      next(new Error('db exploded'));
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal Server Error');
    expect(res.body.requestId).toBeDefined();
    // internal detail must not leak
    expect(JSON.stringify(res.body)).not.toMatch(/db exploded/);
  });

  it('returns 4xx with the original message for operational errors', async () => {
    const app = makeApp((_req, _res, next) => {
      const err = new Error('resource not found');
      err.statusCode = 404;
      next(err);
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('resource not found');
    expect(res.body.requestId).toBeDefined();
  });

  it('includes requestId in the response body', async () => {
    const app = makeApp((_req, _res, next) => next(new Error('boom')));
    const res = await request(app).get('/test');
    expect(typeof res.body.requestId).toBe('string');
    expect(res.body.requestId.length).toBeGreaterThan(0);
  });

  it('uses the requestId from X-Request-ID header when provided', async () => {
    const app = makeApp((_req, _res, next) => next(new Error('boom')));
    const res = await request(app).get('/test').set('X-Request-ID', 'my-trace-id');
    expect(res.body.requestId).toBe('my-trace-id');
  });

  it('defaults to 500 when statusCode is not set', async () => {
    const app = makeApp((_req, _res, next) => {
      const err = new Error('unexpected');
      next(err);
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
  });

  it('defaults to 500 for invalid statusCode values', async () => {
    const app = makeApp((_req, _res, next) => {
      const err = new Error('bad code');
      err.statusCode = 'oops';
      next(err);
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
  });

  it('handles 5xx statusCode as unexpected (generic message)', async () => {
    const app = makeApp((_req, _res, next) => {
      const err = new Error('downstream failure');
      err.statusCode = 503;
      next(err);
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Internal Server Error');
  });
});
