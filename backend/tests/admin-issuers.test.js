const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const VALID_ISSUER_ADDRESS = 'GA3AUY2XRF6S7R73ABSLJMKG4R2NQGRUFPEJUGCANMBAAXI4MTBS6AQU';

jest.mock('../src/stellar/soroban', () => {
  const sdk = require('@stellar/stellar-sdk');
  return {
    invokeContract: jest.fn().mockResolvedValue({ hash: 'mockhash123', ledger: 1000 }),
    simulateContract: jest.fn().mockResolvedValue(sdk.xdr.ScVal.scvVec([])),
    getRpcServer: jest.fn().mockReturnValue({ getHealth: jest.fn().mockResolvedValue({}) }),
    addIssuer: jest.fn().mockResolvedValue({ hash: 'mockhash123', ledger: 1000 }),
    revokeIssuer: jest.fn().mockResolvedValue({ hash: 'mockhash456', ledger: 1001 }),
  };
});

jest.mock('../src/stellar/issuerCache', () => ({
  isAuthorizedIssuer: jest.fn().mockResolvedValue(true),
  invalidateCache: jest.fn(),
}));

function makeToken(role) {
  return jwt.sign(
    { sub: 'GADMIN', wallet: 'GADMIN', role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Admin Issuer Endpoints', () => {
  let adminToken;
  let issuerToken;
  let patientToken;

  beforeAll(() => {
    adminToken  = makeToken('admin');
    issuerToken = makeToken('issuer');
    patientToken = makeToken('patient');
  });

  // ── POST /admin/issuers ───────────────────────────────────────────────────

  describe('POST /v1/admin/issuers', () => {
    it('adds an issuer with admin JWT', async () => {
      const res = await request(app)
        .post('/v1/admin/issuers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ address: VALID_ISSUER_ADDRESS });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ address: VALID_ISSUER_ADDRESS, authorized: true });
      expect(res.body).toHaveProperty('hash');
    });

    it('rejects missing address', async () => {
      const res = await request(app)
        .post('/v1/admin/issuers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('rejects invalid Stellar address', async () => {
      const res = await request(app)
        .post('/v1/admin/issuers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ address: 'not-a-stellar-address' });

      expect(res.status).toBe(400);
    });

    it('rejects issuer role (admin only)', async () => {
      const res = await request(app)
        .post('/v1/admin/issuers')
        .set('Authorization', `Bearer ${issuerToken}`)
        .send({ address: VALID_ISSUER_ADDRESS });

      expect(res.status).toBe(403);
    });

    it('rejects patient role', async () => {
      const res = await request(app)
        .post('/v1/admin/issuers')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ address: VALID_ISSUER_ADDRESS });

      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app)
        .post('/v1/admin/issuers')
        .send({ address: VALID_ISSUER_ADDRESS });

      expect(res.status).toBe(401);
    });
  });

  // ── DELETE /admin/issuers/:wallet ─────────────────────────────────────────

  describe('DELETE /v1/admin/issuers/:wallet', () => {
    it('revokes an issuer with admin JWT', async () => {
      const res = await request(app)
        .delete(`/v1/admin/issuers/${VALID_ISSUER_ADDRESS}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ wallet: VALID_ISSUER_ADDRESS, authorized: false });
      expect(res.body).toHaveProperty('hash');
    });

    it('returns 404 for non-existent issuer', async () => {
      const { isAuthorizedIssuer } = require('../src/stellar/issuerCache');
      isAuthorizedIssuer.mockResolvedValueOnce(false);

      const res = await request(app)
        .delete(`/v1/admin/issuers/${VALID_ISSUER_ADDRESS}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('rejects invalid Stellar address', async () => {
      const res = await request(app)
        .delete('/v1/admin/issuers/bad-address')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('rejects non-admin role', async () => {
      const res = await request(app)
        .delete(`/v1/admin/issuers/${VALID_ISSUER_ADDRESS}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app)
        .delete(`/v1/admin/issuers/${VALID_ISSUER_ADDRESS}`);

      expect(res.status).toBe(401);
    });
  });

  // ── GET /admin/issuers ────────────────────────────────────────────────────

  describe('GET /v1/admin/issuers', () => {
    it('returns issuer list with admin JWT', async () => {
      const res = await request(app)
        .get('/v1/admin/issuers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('issuers');
      expect(Array.isArray(res.body.issuers)).toBe(true);
    });

    it('rejects non-admin role', async () => {
      const res = await request(app)
        .get('/v1/admin/issuers')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/v1/admin/issuers');
      expect(res.status).toBe(401);
    });
  });
});
