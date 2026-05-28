// Centralized vaccination record fixtures for backend tests.

const { PATIENT_WALLET, ISSUER_WALLET } = require('./wallets');

module.exports = {
  // Happy path: a fully populated vaccination record
  RECORD_COVID: {
    token_id: 'token-001',
    patient_address: PATIENT_WALLET,
    vaccine_name: 'COVID-19',
    date_administered: '2024-01-15',
    issuer_address: ISSUER_WALLET,
    lot_number: 'LOT-ABC123',
    tx_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  },

  // Happy path: a second record for the same patient (different vaccine)
  RECORD_FLU: {
    token_id: 'token-002',
    patient_address: PATIENT_WALLET,
    vaccine_name: 'Influenza',
    date_administered: '2023-10-01',
    issuer_address: ISSUER_WALLET,
    lot_number: 'LOT-FLU999',
    tx_hash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
  },

  // Happy path: valid issue request payload (POST /vaccination/issue body)
  ISSUE_PAYLOAD: {
    patient_address: PATIENT_WALLET,
    vaccine_name: 'COVID-19',
    date_administered: '2024-01-15',
  },

  // Edge case: issue payload with a future date
  ISSUE_PAYLOAD_FUTURE_DATE: {
    patient_address: PATIENT_WALLET,
    vaccine_name: 'COVID-19',
    date_administered: '2099-12-31',
  },

  // Edge case: issue payload missing required fields
  ISSUE_PAYLOAD_MISSING_VACCINE: {
    patient_address: PATIENT_WALLET,
    date_administered: '2024-01-15',
  },

  // Empty case: no records found for a wallet
  EMPTY_RECORDS_RESPONSE: {
    data: [],
    total: 0,
    page: 1,
    limit: 20,
  },

  // Happy path: paginated records response
  PAGINATED_RECORDS_RESPONSE: {
    data: [
      {
        token_id: 'token-001',
        vaccine_name: 'COVID-19',
        date_administered: '2024-01-15',
        issuer_address: ISSUER_WALLET,
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
  },
};
