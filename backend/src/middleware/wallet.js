const StellarSdk = require('@stellar/stellar-sdk');

const STELLAR_PUBLIC_KEY_REGEX = /^G[A-Z2-7]{55}$/;
const INVALID_KEY_ERROR = 'Invalid Stellar public key';

function isValidStellarPublicKey(value) {
  if (typeof value !== 'string' || !STELLAR_PUBLIC_KEY_REGEX.test(value)) return false;
  try {
    StellarSdk.Keypair.fromPublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function validateStellarPublicKey(location, fieldName) {
  return (req, res, next) => {
    const value = req[location]?.[fieldName];
    if (value === undefined || value === null || value === '') return next();
    if (!isValidStellarPublicKey(value)) {
      return res.status(400).json({ error: INVALID_KEY_ERROR });
    }
    next();
  };
}

module.exports = { validateStellarPublicKey, isValidStellarPublicKey };
