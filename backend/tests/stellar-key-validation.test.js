'use strict';

const { isValidStellarPublicKey } = require('../src/middleware/wallet');

describe('isValidStellarPublicKey', () => {
  it('returns true for a valid Stellar public key', () => {
    const { Keypair } = require('@stellar/stellar-sdk');
    expect(isValidStellarPublicKey(Keypair.random().publicKey())).toBe(true);
  });

  it('returns false for wrong prefix (not G)', () => {
    expect(isValidStellarPublicKey('S' + 'A'.repeat(55))).toBe(false);
  });

  it('returns false for key shorter than 56 chars', () => {
    expect(isValidStellarPublicKey('G' + 'A'.repeat(54))).toBe(false);
  });

  it('returns false for key longer than 56 chars', () => {
    expect(isValidStellarPublicKey('G' + 'A'.repeat(56))).toBe(false);
  });

  it('returns false for invalid base32 characters', () => {
    expect(isValidStellarPublicKey('G' + '0'.repeat(55))).toBe(false);
  });

  it('returns false for a non-string value', () => {
    expect(isValidStellarPublicKey(null)).toBe(false);
    expect(isValidStellarPublicKey(123)).toBe(false);
  });

  it('returns false for correct format but invalid checksum', () => {
    // G + 55 uppercase A's passes the regex but fails Keypair checksum
    expect(isValidStellarPublicKey('G' + 'A'.repeat(55))).toBe(false);
  });
});
