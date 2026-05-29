'use strict';

const request = require('supertest');
const StellarSdk = require('@stellar/stellar-sdk');

// Must be mocked before app is loaded
jest.mock('../src/jwtKeys', () => ({
  getVerificationKeys: () => [{ kid: '1', secret: 'test-jwt-secret' }],
  getSigningKey: () => ({ kid: '1', secret: 'test-jwt-secret' }),
  rotateKey: jest.fn(),
  reloadFromEnv: jest.fn(),
}));

const app = require('../src/app');
const jwtFactory = require('./factories/jwt');
const { PATIENT_WALLET, ISSUER_WALLET } = require('./fixtures/wallets');

// Mock Soroban RPC — controlled per-test via mockResolvedValue / mockRejectedValue
jest.mock('../src/stellar/soroban', () => {
  const sdk = require('@stellar/stellar-sdk');
  const emptyRecords = sdk.xdr.ScVal.scvVec([
    sdk.xdr.ScVal.scvBool(true),
    sdk.xdr.ScVal.scvVec([]),
  ]);
  return {
    mintVaccination: jest.fn().mockResolvedValue({ tokenId: 'tok_1', hash: 'abc123', ledger: 1000 }),
    simulateContract: jest.fn().mockResolvedValue(emptyRecords),
    sendRpcTimeout: jest.fn(),
    SorobanTimeoutError: class SorobanTimeoutError extends Error {},
  };
});

// Mock issuer on-chain check
jest.mock('../src/stellar/issuerCache', () => ({
  isAuthorizedIssuer: jest.fn().mockResolvedValue(true),
}));

// Mock patient consent
jest.mock('../src/indexer/db', () => ({
  hasConsented: jest.fn().mockReturnValue(true),
  initDb: jest.fn().mockResolvedValue(undefined),
  getDb: jest.fn(),
}));

const { mintVaccination, simulateContract } = require('../src/stellar/soroban');

const VALID_BODY = {
  patient_address: PATIENT_WALLET,
  vaccine_name: 'COVID-19',
  date_administered: '2024-01-15',
};

let issuerToken;
let patientToken;

beforeAll(() => {
  issuerToken = jwtFactory({ publicKey: ISSUER_WALLET, role: 'issuer' });
  patientToken = jwtFactory({ publicKey: PATIENT_WALLET, role: 'patient' });
});

beforeEach(() => {
  jest.clearAllMocks();
  mintVaccination.mockResolvedValue({ tokenId: 'tok_1', hash: 'abc123', ledger: 1000 });
  const sdk = require('@stellar/stellar-sdk');
  simulateContract.mockResolvedValue(
    sdk.xdr.ScVal.scvVec([sdk.xdr.ScVal.scvBool(true), sdk.xdr.ScVal.scvVec([])])
  );
});

describe('POST /v1/vaccination/issue', () => {
  it('returns 200 with issuer JWT and valid body', async () => {
    const res = await request(app)
      .post('/v1/vaccination/issue')
      .set('Authorization', `Bearer ${issuerToken}`)
      .send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, tokenId: 'tok_1', transactionHash: 'abc123' });
  });

  it('returns 403 with patient JWT', async () => {
    const res = await request(app)
      .post('/v1/vaccination/issue')
      .set('Authorization', `Bearer ${patientToken}`)
      .send(VALID_BODY);

    expect(res.status).toBe(403);
  });

  it('returns 409 when contract returns DuplicateRecord error', async () => {
    mintVaccination.mockRejectedValue(new Error('Error(Contract, #6)'));

    const res = await request(app)
      .post('/v1/vaccination/issue')
      .set('Authorization', `Bearer ${issuerToken}`)
      .send(VALID_BODY);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/identical|duplicate/i);
  });
});

describe('GET /v1/vaccination/:wallet', () => {
  it('returns records array with valid JWT', async () => {
    const res = await request(app)
      .get(`/v1/vaccination/${PATIENT_WALLET}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns 400 for invalid wallet format', async () => {
    const res = await request(app)
      .get('/v1/vaccination/not-a-valid-wallet')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(400);
  });
});
