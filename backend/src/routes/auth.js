const express = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const StellarSdk = require('@stellar/stellar-sdk');
const { buildChallenge, verifyChallenge } = require('../stellar/sep10');
const { sep10Limiter } = require('../middleware/rateLimiter');
const { audit } = require('../middleware/auditLog');
const validate = require('../middleware/validate');
const { bruteForceGuard, recordFailure, recordSuccess } = require('../middleware/bruteForce');
const { getSigningKey } = require('../jwtKeys');

const router = express.Router();

const sep10Schema = z.object({
  public_key: z.string().refine((val) => {
    try {
      StellarSdk.Keypair.fromPublicKey(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'Invalid Stellar public key' }),
});

const verifySchema = z.object({
  transaction: z.string().min(1, 'transaction is required'),
  nonce: z.string().min(1, 'nonce is required'),
});

/**
 * @swagger
 * /auth/sep10:
 *   post:
 *     summary: Generate a SEP-10 authentication challenge
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - public_key
 *             properties:
 *               public_key:
 *                 type: string
 *                 description: Stellar public key (starts with G) requesting a challenge
 *     responses:
 *       200:
 *         description: Challenge generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   type: string
 *                   description: Unsigned SEP-10 challenge transaction (XDR)
 *                 nonce:
 *                   type: string
 *                   description: Single-use nonce tied to this challenge
 *       400:
 *         description: Invalid Stellar public key format
 *       429:
 *         description: Rate limit exceeded (max 10 requests per IP per minute)
 *       500:
 *         description: Internal server error
 */
router.post('/sep10', sep10Limiter, validate(sep10Schema), async (req, res) => {
  const { public_key } = req.body;

  try {
    const { transaction, nonce } = await buildChallenge(public_key);
    res.json({ transaction, nonce });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     summary: Verify a signed SEP-10 challenge and issue a JWT
 *     description: >
 *       The client signs the challenge transaction from POST /auth/sep10 with
 *       their Stellar wallet and submits it here. On success a short-lived JWT
 *       (1 hour) is returned scoped to the caller's role.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaction
 *               - nonce
 *             properties:
 *               transaction:
 *                 type: string
 *                 description: Signed SEP-10 challenge transaction (XDR)
 *               nonce:
 *                 type: string
 *                 description: Nonce returned by POST /auth/sep10 (must match)
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT (expires in 1 hour)
 *                 wallet:
 *                   type: string
 *                   description: Authenticated Stellar public key
 *                 role:
 *                   type: string
 *                   enum: [admin, patient]
 *                   description: Role derived from the authenticated key
 *       400:
 *         description: Missing or malformed parameters
 *       401:
 *         description: Invalid signature or nonce mismatch
 */
router.post('/verify', validate(verifySchema), bruteForceGuard, (req, res) => {
  const { transaction, nonce } = req.body;
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';

  try {
    const publicKey = verifyChallenge(transaction, nonce);

    const role = publicKey === process.env.ADMIN_PUBLIC_KEY ? 'admin' : 'patient';
    const now = Math.floor(Date.now() / 1000);
    const signingKey = getSigningKey();

    const token = jwt.sign(
      {
        sub: publicKey,
        iss: process.env.HOME_DOMAIN || 'localhost',
        iat: now,
        wallet: publicKey,
        publicKey,
        role,
      },
      signingKey.secret,
      { expiresIn: '1h', keyid: signingKey.kid }
    );

    audit({ actor: publicKey, action: 'auth.login', result: 'success', meta: { role } });

    res.json({ token, wallet: publicKey, role });
  } catch (err) {
    // Attempt to extract wallet from the transaction for per-wallet tracking
    let wallet = null;
    try {
      const tx = StellarSdk.TransactionBuilder.fromXDR(transaction, process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015');
      wallet = tx.source;
    } catch (_) { /* ignore parse errors */ }

    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    recordFailure(`ip:${ip}`, { ip, wallet });
    if (wallet) recordFailure(`wallet:${wallet}`, { ip, wallet });

    audit({ actor: wallet || 'unknown', action: 'auth.login', result: 'failure', meta: { error: err.message } });
    res.status(401).json({ error: err.message });
  }
});

module.exports = router;
