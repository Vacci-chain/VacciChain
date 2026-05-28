// Centralized vaccination record fixtures for frontend tests.

import { PATIENT_WALLET, ISSUER_WALLET } from './wallets';

// Happy path: a single fully populated record
export const RECORD_COVID = {
  token_id: 'token-001',
  vaccine_name: 'COVID-19',
  date_administered: '2024-01-15',
  issuer: ISSUER_WALLET,
  tx_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
};

// Happy path: a second record (different vaccine)
export const RECORD_FLU = {
  token_id: 'token-002',
  vaccine_name: 'Influenza',
  date_administered: '2023-10-01',
  issuer: ISSUER_WALLET,
  tx_hash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
};

// Edge case: record with dose series info
export const RECORD_WITH_DOSE = {
  ...RECORD_COVID,
  token_id: 'token-003',
  dose_number: 2,
  dose_series: 3,
};

// Edge case: record without a transaction hash
export const RECORD_NO_TX_HASH = {
  ...RECORD_COVID,
  token_id: 'token-004',
  tx_hash: null,
};

// Empty case: no records for a wallet
export const EMPTY_RECORDS = [];

// Happy path: list of two records
export const RECORDS_LIST = [RECORD_COVID, RECORD_FLU];

// Happy path: paginated API response with records
export const PAGINATED_RESPONSE = {
  data: RECORDS_LIST,
  total: 2,
  page: 1,
  limit: 20,
};

// Empty case: paginated API response with no records
export const EMPTY_PAGINATED_RESPONSE = {
  data: [],
  total: 0,
  page: 1,
  limit: 20,
};

// Happy path: valid mint form payload
export const MINT_PAYLOAD = {
  patient_address: PATIENT_WALLET,
  vaccine_name: 'COVID-19',
  date_administered: '2024-01-15',
};
