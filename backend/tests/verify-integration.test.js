const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock jwtKeys to support JWT authentication for verify endpoints without implementing/changing jwtKeys.js
jest.mock('../src/jwtKeys', () => ({
  getVerificationKeys: () => [{ kid: '1', secret: 'test-jwt-secret' }],
  getSigningKey: () => ({ kid: '1', secret: 'test-jwt-secret' }),
}));

// Mock Soroban RPC responses
jest.mock('../src/stellar/soroban', () => {
  const sdk = require('@stellar/stellar-sdk');
  return {
    simulateContract: jest.fn(),
    getRpcServer: jest.fn().mockReturnValue({ getHealth: jest.fn().mockResolvedValue({}) }),
  };
});

const app = require('../src/app');
const StellarSdk = require('@stellar/stellar-sdk');
const { simulateContract } = require('../src/stellar/soroban');
const verifyRouter = require('../src/routes/verify');

const VALID_WALLET = 'GA3AUY2XRF6S7R73ABSLJMKG4R2NQGRUFPEJUGCANMBAAXI4MTBS6AQU';
// Generate valid Stellar public keys to pass regex and SDK base32 verification checks
const UNVACCINATED_WALLET = StellarSdk.Keypair.random().publicKey();

describe('Integration Tests - Public Verify Endpoint (GET /v1/verify/:wallet)', () => {
  let validToken;

  beforeAll(() => {
    validToken = jwt.sign(
      {
        publicKey: VALID_WALLET,
        role: 'patient',
        sub: VALID_WALLET,
        wallet: VALID_WALLET,
      },
      'test-jwt-secret',
      { expiresIn: '1h', keyid: '1' }
    );
  });

  beforeEach(() => {
    // Reset mock implementations and queue state between tests to avoid carryover
    simulateContract.mockReset();
    // Clear in-memory cache between tests
    verifyRouter.verifyCache.clear();
  });

  it('Test: valid vaccinated wallet returns { verified: true, records: [...] }', async () => {
    // Mock simulation returning [true, [records]]
    const mockResult = StellarSdk.xdr.ScVal.scvVec([
      StellarSdk.xdr.ScVal.scvBool(true),
      StellarSdk.xdr.ScVal.scvVec([
        StellarSdk.xdr.ScVal.scvMap([
          new StellarSdk.xdr.ScMapEntry({
            key: StellarSdk.xdr.ScVal.scvSymbol('vaccine_name'),
            val: StellarSdk.xdr.ScVal.scvString('COVID-19')
          }),
          new StellarSdk.xdr.ScMapEntry({
            key: StellarSdk.xdr.ScVal.scvSymbol('date_administered'),
            val: StellarSdk.xdr.ScVal.scvString('2024-01-15')
          })
        ])
      ]),
    ]);

    simulateContract.mockResolvedValueOnce(mockResult);

    const res = await request(app)
      .get(`/v1/verify/${VALID_WALLET}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('verified', true);
    expect(res.body).toHaveProperty('vaccinated', true);
    expect(res.body).toHaveProperty('records');
    expect(res.body.records).toHaveLength(1);
    expect(res.body.records[0]).toHaveProperty('vaccine_name', 'COVID-19');
    expect(res.body.records[0]).toHaveProperty('date_administered', '2024-01-15');
  });

  it('Test: valid unvaccinated wallet returns { verified: false, records: [] }', async () => {
    // Mock simulation returning [false, []]
    const mockResult = StellarSdk.xdr.ScVal.scvVec([
      StellarSdk.xdr.ScVal.scvBool(false),
      StellarSdk.xdr.ScVal.scvVec([]),
    ]);

    simulateContract.mockResolvedValueOnce(mockResult);

    const res = await request(app)
      .get(`/v1/verify/${UNVACCINATED_WALLET}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('verified', false);
    expect(res.body).toHaveProperty('vaccinated', false);
    expect(res.body).toHaveProperty('records');
    expect(res.body.records).toHaveLength(0);
  });

  it('Test: invalid wallet format returns 400', async () => {
    const res = await request(app)
      .get('/v1/verify/invalid-address-123')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('must be a valid Stellar public key');
  });

  it('Test: RPC timeout returns 503', async () => {
    // Mock simulation throwing timeout error
    simulateContract.mockRejectedValueOnce(new Error('Simulation failed: timeout'));

    const res = await request(app)
      .get(`/v1/verify/${VALID_WALLET}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('error');
  });

  it('Test: response is served from cache on second request within TTL', async () => {
    const mockResult = StellarSdk.xdr.ScVal.scvVec([
      StellarSdk.xdr.ScVal.scvBool(true),
      StellarSdk.xdr.ScVal.scvVec([]),
    ]);

    simulateContract.mockResolvedValue(mockResult);

    const cacheTestWallet = StellarSdk.Keypair.random().publicKey();

    // First request
    const res1 = await request(app)
      .get(`/v1/verify/${cacheTestWallet}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res1.status).toBe(200);
    expect(simulateContract).toHaveBeenCalledTimes(1);

    // Second request within TTL
    const res2 = await request(app)
      .get(`/v1/verify/${cacheTestWallet}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res2.status).toBe(200);
    // simulateContract should NOT have been called again
    expect(simulateContract).toHaveBeenCalledTimes(1);
  });
});
