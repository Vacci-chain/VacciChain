// Centralized API response fixtures for backend tests.
// Mirrors the shapes returned by the Express routes.

const { PATIENT_WALLET, ISSUER_WALLET } = require('./wallets');

module.exports = {
  // Happy path: SEP-10 challenge response
  SEP10_CHALLENGE: {
    transaction: 'AAAAAgAAAABIQvkylb3/M+0wTwfqSo7VVV+xopwUcY+KJH31xvEGzgAAAGQAJZf9AAAAAwAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAAAAAAA=',
    nonce: 'test-nonce-123',
  },

  // Happy path: successful auth/verify response
  AUTH_VERIFY_SUCCESS: {
    token: 'eyJhbGciOiJIUzI1NiJ9.test.signature',
    wallet: PATIENT_WALLET,
    role: 'patient',
  },

  // Happy path: public verify endpoint — wallet is vaccinated
  VERIFY_VACCINATED: {
    wallet: PATIENT_WALLET,
    vaccinated: true,
    record_count: 2,
  },

  // Empty case: public verify endpoint — no records found
  VERIFY_NOT_VACCINATED: {
    wallet: PATIENT_WALLET,
    vaccinated: false,
    record_count: 0,
  },

  // Happy path: successful vaccination issue response
  ISSUE_SUCCESS: {
    success: true,
    token_id: 'token-001',
    tx_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  },

  // Happy path: issuer activity from analytics service
  ANALYTICS_ISSUERS: {
    issuers: [
      {
        address: ISSUER_WALLET,
        count: 42,
        last_active: '2024-01-15T10:00:00Z',
      },
    ],
  },

  // Happy path: vaccination rates from analytics service
  ANALYTICS_RATES: {
    rates: [
      { vaccine_name: 'COVID-19', count: 120 },
      { vaccine_name: 'Influenza', count: 80 },
    ],
  },

  // Empty case: no anomalies detected
  ANALYTICS_ANOMALIES_EMPTY: {
    anomalies: [],
  },

  // Edge case: anomaly detected for an issuer
  ANALYTICS_ANOMALIES_HIGH: {
    anomalies: [
      {
        issuer: ISSUER_WALLET,
        count: 200,
        severity: 'high',
        reason: 'Spike detected',
      },
    ],
  },

  // Edge case: generic 400 validation error shape
  ERROR_VALIDATION: {
    error: 'Validation failed',
  },

  // Edge case: 401 unauthorized shape
  ERROR_UNAUTHORIZED: {
    error: 'Missing authorization header',
  },

  // Edge case: 403 forbidden shape
  ERROR_FORBIDDEN: {
    error: 'Issuer role required',
  },
};
