'use strict';

const request = require('supertest');
const StellarSdk = require('@stellar/stellar-sdk');

// ── Keypairs ──────────────────────────────────────────────────────────────────
const clientKeypair = StellarSdk.Keypair.random();
const serverKeypair = StellarSdk.Keypair.random();
const VALID_PUBLIC_KEY = clientKeypair.publicKey();
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

// ── Mocks (declared before any require of app/routes) ────────────────────────

jest.mock('../src/stellar/sep10', () => ({
  buildChallenge: jest.fn(),
  verifyChallenge: jest.fn(),
  NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
}));

jest.mock('../src/jwtKeys', () => ({
  getSigningKey: () => ({ secret: 'test-jwt-secret', kid: 'test-kid' }),
}));

// ── Imports (after mocks are registered) ─────────────────────────────────────
const app = require('../src/app');
const sep10 = require('../src/stellar/sep10');

// ── Helpers ───────────────────────────────────────────────────────────────────
const MOCK_NONCE = 'dGVzdG5vbmNlMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=';

function buildSignedChallenge() {
  const account = new StellarSdk.Account(serverKeypair.publicKey(), '-1');
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.manageData({
        name: 'localhost auth',
        value: MOCK_NONCE,
        source: VALID_PUBLIC_KEY,
      })
    )
    .setTimeout(300)
    .build();
  tx.sign(serverKeypair);
  tx.sign(clientKeypair);
  return tx.toXDR();
}

const SIGNED_TX = buildSignedChallenge();

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /v1/auth/sep10', () => {
  it('returns a challenge transaction for a valid public key', async () => {
    sep10.buildChallenge.mockResolvedValue({
      transaction: SIGNED_TX,
      nonce: MOCK_NONCE,
      network_passphrase: NETWORK_PASSPHRASE,
    });

    const res = await request(app)
      .post('/v1/auth/sep10')
      .send({ public_key: VALID_PUBLIC_KEY });

    expect(res.status).toBe(200);
    expect(typeof res.body.transaction).toBe('string');
    expect(res.body.nonce).toBe(MOCK_NONCE);
    expect(sep10.buildChallenge).toHaveBeenCalledWith(VALID_PUBLIC_KEY);
  });

  it('returns 400 when public_key is missing', async () => {
    const res = await request(app).post('/v1/auth/sep10').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when public_key is not a valid Stellar key', async () => {
    const res = await request(app)
      .post('/v1/auth/sep10')
      .send({ public_key: 'not-a-stellar-key' });
    expect(res.status).toBe(400);
  });
});

describe('POST /v1/auth/verify', () => {
  it('returns a JWT for a valid signed transaction', async () => {
    sep10.verifyChallenge.mockReturnValue(VALID_PUBLIC_KEY);

    const res = await request(app)
      .post('/v1/auth/verify')
      .send({ transaction: SIGNED_TX, nonce: MOCK_NONCE });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.wallet).toBe(VALID_PUBLIC_KEY);
  });

  it('returns 401 when the signature is invalid', async () => {
    sep10.verifyChallenge.mockImplementation(() => {
      throw new Error('Client signature missing or invalid');
    });

    const res = await request(app)
      .post('/v1/auth/verify')
      .send({ transaction: SIGNED_TX, nonce: MOCK_NONCE });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/signature/i);
  });

  it('returns 401 when the challenge has expired', async () => {
    sep10.verifyChallenge.mockImplementation(() => {
      throw new Error('Challenge transaction has expired');
    });

    const res = await request(app)
      .post('/v1/auth/verify')
      .send({ transaction: SIGNED_TX, nonce: MOCK_NONCE });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });
});
