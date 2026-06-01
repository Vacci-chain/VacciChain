// Centralized wallet address fixtures for backend tests.
// All addresses are valid 56-char Stellar public keys (G...).

module.exports = {
  // Happy path: a standard patient wallet
  PATIENT_WALLET: 'GA3AUY2XRF6S7R73ABSLJMKG4R2NQGRUFPEJUGCANMBAAXI4MTBS6AQU',

  // Happy path: an authorized issuer wallet
  ISSUER_WALLET: 'GBXGQJWVLWOYHFLEWA4HDYEGRMTBPBMOU2ISCESQ3GIJBKBEDNZXMRQO',

  // Happy path: an admin wallet
  ADMIN_WALLET: 'GDQJUTQYK2MQX2ZJARTDFPCOHAKIEW2GDCJJSXMFQWNZXWBTVHSWKHEF',

  // Edge case: a second patient wallet (for multi-wallet tests)
  PATIENT_WALLET_2: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGZQE6CJNQZP7SOQKQNBHQ',

  // Edge case: invalid format (too short)
  INVALID_WALLET_SHORT: 'GABC123',

  // Edge case: invalid format (wrong prefix)
  INVALID_WALLET_PREFIX: 'XABC1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ12345678901234',

  // Edge case: empty string
  EMPTY_WALLET: '',
};
