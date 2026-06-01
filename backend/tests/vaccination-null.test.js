/**
 * Edge case / null value tests for the vaccination issue endpoint.
 * Closes #345
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

jest.mock('../src/stellar/soroban', () => ({
  invokeContract: jest.fn(),
  simulateContract: jest.fn(),
  getContractState: jest.fn(),
  getRpcServer: jest.fn().mockReturnValue({ getHealth: jest.fn() }),
}));

jest.mock('../src/indexer/db', () => ({
  hasConsented: jest.fn().mockReturnValue(true),
  initDb: jest.fn(),
}));

jest.mock('../src/stellar/issuerCache', () => ({
  isAuthorizedIssuer: jest.fn().mockResolvedValue(true),
}));

const VALID_WALLET = 'GA3AUY2XRF6S7R73ABSLJMKG4R2NQGRUFPEJUGCANMBAAXI4MTBS6AQU';
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

function issuerToken() {
  return jwt.sign(
    { sub: VALID_WALLET, role: 'issuer', wallet: VALID_WALLET, publicKey: VALID_WALLET },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('POST /vaccination/issue — null / missing field validation (#345)', () => {
  const base = {
    patient_address: VALID_WALLET,
    vaccine_name: 'COVID-19',
    date_administered: '2024-01-15',
  };

  it('returns 400 when vaccine_name is null', async () => {
    const res = await request(app)
      .post('/v1/vaccination/issue')
      .set('Authorization', `Bearer ${issuerToken()}`)
      .send({ ...base, vaccine_name: null });

    expect(res.status).toBe(400);
  });

  it('returns 400 when vaccine_name is empty string', async () => {
    const res = await request(app)
      .post('/v1/vaccination/issue')
      .set('Authorization', `Bearer ${issuerToken()}`)
      .send({ ...base, vaccine_name: '' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when date_administered is null', async () => {
    const res = await request(app)
      .post('/v1/vaccination/issue')
      .set('Authorization', `Bearer ${issuerToken()}`)
      .send({ ...base, date_administered: null });

    expect(res.status).toBe(400);
  });

  it('returns 400 when date_administered is missing', async () => {
    const { date_administered: _, ...body } = base;
    const res = await request(app)
      .post('/v1/vaccination/issue')
      .set('Authorization', `Bearer ${issuerToken()}`)
      .send(body);

    expect(res.status).toBe(400);
  });

  it('returns 400 when vaccine_name is missing', async () => {
    const { vaccine_name: _, ...body } = base;
    const res = await request(app)
      .post('/v1/vaccination/issue')
      .set('Authorization', `Bearer ${issuerToken()}`)
      .send(body);

    expect(res.status).toBe(400);
  });
});
