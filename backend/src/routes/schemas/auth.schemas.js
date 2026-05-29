const { z } = require('zod');
const StellarSdk = require('@stellar/stellar-sdk');

/**
 * Validation schemas for auth routes.
 * Co-located with auth.js for easy maintenance.
 */

const sep10Schema = z.object({
  public_key: z.string()
    .min(1, 'public_key is required')
    .refine((val) => {
      try {
        StellarSdk.Keypair.fromPublicKey(val);
        return true;
      } catch {
        return false;
      }
    }, { message: 'Invalid Stellar public key format' }),
});

const verifySchema = z.object({
  transaction: z.string()
    .min(1, 'transaction is required')
    .describe('Signed SEP-10 challenge transaction (XDR)'),
  nonce: z.string()
    .min(1, 'nonce is required')
    .describe('Nonce returned by POST /auth/sep10'),
});

module.exports = {
  sep10Schema,
  verifySchema,
};
