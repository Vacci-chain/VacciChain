// Centralized API response fixtures for frontend tests.
// Mirrors the shapes returned by the backend and analytics service.

import { PATIENT_WALLET, ISSUER_WALLET } from './wallets';
import { RECORDS_LIST } from './vaccinationRecords';

// Happy path: public verify — wallet is vaccinated
export const VERIFY_VACCINATED = {
  wallet: PATIENT_WALLET,
  vaccinated: true,
  record_count: 2,
};

// Empty case: public verify — no records found
export const VERIFY_NOT_VACCINATED = {
  wallet: PATIENT_WALLET,
  vaccinated: false,
  record_count: 0,
};

// Happy path: vaccination rates from analytics service
export const ANALYTICS_RATES = {
  rates: [
    { vaccine_name: 'COVID-19', count: 120 },
    { vaccine_name: 'Influenza', count: 80 },
  ],
};

// Happy path: issuer activity from analytics service
export const ANALYTICS_ISSUERS = {
  issuers: [
    {
      address: ISSUER_WALLET,
      count: 42,
      last_active: '2024-01-15T10:00:00Z',
    },
  ],
};

// Empty case: no anomalies detected
export const ANALYTICS_ANOMALIES_EMPTY = {
  anomalies: [],
};

// Edge case: high-severity anomaly detected
export const ANALYTICS_ANOMALIES_HIGH = {
  anomalies: [
    {
      issuer: ISSUER_WALLET,
      count: 200,
      severity: 'high',
      reason: 'Spike detected',
    },
  ],
};

// Happy path: successful vaccination issue response
export const ISSUE_SUCCESS = {
  success: true,
  token_id: 'token-001',
  tx_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
};
