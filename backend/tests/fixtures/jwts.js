// Centralized JWT fixtures for backend tests.
// Tokens are signed with the test secret used in tests/setup.js.

const jwt = require('jsonwebtoken');
const { PATIENT_WALLET, ISSUER_WALLET, ADMIN_WALLET } = require('./wallets');

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '1h' });
}

module.exports = {
  // Happy path: valid patient JWT
  PATIENT_TOKEN: sign({ sub: PATIENT_WALLET, wallet: PATIENT_WALLET, role: 'patient' }),

  // Happy path: valid issuer JWT
  ISSUER_TOKEN: sign({ sub: ISSUER_WALLET, wallet: ISSUER_WALLET, role: 'issuer' }),

  // Happy path: valid admin JWT
  ADMIN_TOKEN: sign({ sub: ADMIN_WALLET, wallet: ADMIN_WALLET, role: 'admin' }),

  // Edge case: token signed with wrong secret
  WRONG_SECRET_TOKEN: jwt.sign(
    { sub: PATIENT_WALLET, wallet: PATIENT_WALLET, role: 'patient' },
    'wrong-secret',
    { expiresIn: '1h' }
  ),

  // Edge case: expired token
  EXPIRED_TOKEN: jwt.sign(
    { sub: PATIENT_WALLET, wallet: PATIENT_WALLET, role: 'patient' },
    SECRET,
    { expiresIn: '-1s' }
  ),

  // Edge case: token missing the wallet claim
  TOKEN_MISSING_WALLET: jwt.sign(
    { sub: PATIENT_WALLET, role: 'patient' },
    SECRET,
    { expiresIn: '1h' }
  ),

  // Edge case: token with an unrecognized role
  TOKEN_INVALID_ROLE: jwt.sign(
    { sub: PATIENT_WALLET, wallet: PATIENT_WALLET, role: 'superuser' },
    SECRET,
    { expiresIn: '1h' }
  ),
};
