const express = require('express');
const StellarSdk = require('@stellar/stellar-sdk');
const { validateStellarPublicKey } = require('../middleware/wallet');
const { simulateContract, verifyVaccination, SorobanTimeoutError, sendRpcTimeout } = require('../stellar/soroban');
const { resolveContractErrorMessage } = require('../stellar/contractErrors');
const { verifyLimiter, verifierKeyLimiter } = require('../middleware/rateLimiter');
const verifierApiKey = require('../middleware/verifierApiKey');
const authMiddleware = require('../middleware/auth');
const { audit } = require('../middleware/auditLog');

const router = express.Router();

const verifyCache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Try JWT first; if no Authorization header, fall through to API key auth.
 * One of the two must succeed — otherwise 401.
 */
function jwtOrApiKey(req, res, next) {
  if (req.headers.authorization) {
    return authMiddleware(req, res, next);
  }
  return verifierApiKey(req, res, next);
}

/**
 * Pick the right rate limiter based on how the caller authenticated.
 * API-key callers get verifierKeyLimiter; JWT callers get verifyLimiter.
 */
function adaptiveLimiter(req, res, next) {
  if (req.verifier) return verifierKeyLimiter(req, res, next);
  return verifyLimiter(req, res, next);
}

/**
 * @swagger
 * /verify/public/{wallet}:
 *   get:
 *     summary: Public vaccination status verification (no authentication required)
 *     description: >
 *       Public endpoint for checking vaccination status. Used by verification pages
 *       and third-party integrators. No authentication required.
 *       Results are cached for 60 seconds to reduce RPC load.
 *     tags:
 *       - Verification
 *     parameters:
 *       - in: path
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *         description: Stellar wallet address to verify
 *     responses:
 *       200:
 *         description: Vaccination status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallet:
 *                   type: string
 *                 verified:
 *                   type: boolean
 *                   description: Whether the wallet has vaccination records
 *                 records:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VaccinationRecord'
 *       400:
 *         description: Invalid wallet format
 *       429:
 *         description: Rate limit exceeded (60 requests per IP per minute)
 *       503:
 *         description: RPC timeout or service unavailable
 *       500:
 *         description: Contract query failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /verify/public/:wallet — Public endpoint, no authentication required
router.get(
  '/public/:wallet',
  validateStellarPublicKey('params', 'wallet'),
  verifyLimiter,
  async (req, res) => {
    const { wallet } = req.params;
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';

    const now = Date.now();
    const cached = verifyCache.get(wallet);
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      return res.json({
        wallet,
        verified: cached.vaccinated,
        records: cached.records
      });
    }

    try {
      const { vaccinated, records } = await verifyVaccination(wallet);

      verifyCache.set(wallet, {
        vaccinated,
        records,
        timestamp: now
      });

      audit({
        actor: ip,
        action: 'verify.public_lookup',
        target: wallet,
        result: 'success',
        meta: { ip },
      });

      res.json({ wallet, verified: vaccinated, records });
    } catch (err) {
      const errorMessage = resolveContractErrorMessage(err);
      audit({ actor: ip, action: 'verify.public_lookup', target: wallet, result: 'failure', meta: { error: errorMessage, ip } });
      
      const isTimeout = err.message && (
        err.message.toLowerCase().includes('timeout') ||
        err.message.toLowerCase().includes('deadline') ||
        err.message.toLowerCase().includes('abort')
      );
      res.status(isTimeout ? 503 : 500).json({ error: errorMessage });
    }
  }
);

/**
 * @swagger
 * /verify/{wallet}:
 *   get:
 *     summary: Authenticated vaccination status verification
 *     description: >
 *       Requires JWT or API key authentication. Returns detailed vaccination records
 *       with additional metadata. Results are cached for 60 seconds.
 *     tags:
 *       - Verification
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *         description: Stellar wallet address to verify
 *     responses:
 *       200:
 *         description: Vaccination status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wallet:
 *                   type: string
 *                 vaccinated:
 *                   type: boolean
 *                 verified:
 *                   type: boolean
 *                 record_count:
 *                   type: number
 *                 records:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VaccinationRecord'
 *       400:
 *         description: Invalid wallet format
 *       401:
 *         description: Unauthorized - JWT or API key required
 *       429:
 *         description: Rate limit exceeded
 *       503:
 *         description: RPC timeout or service unavailable
 *       500:
 *         description: Contract query failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /verify/:wallet — JWT or verifier API key
router.get(
  '/:wallet',
  validateStellarPublicKey('params', 'wallet'),
  jwtOrApiKey,
  adaptiveLimiter,
  async (req, res) => {
    const { wallet } = req.params;
    const actor = req.verifier ? `apikey:${req.verifier.id}` : (req.user?.wallet ?? 'unknown');

    const now = Date.now();
    const cached = verifyCache.get(wallet);
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      return res.json({
        wallet,
        vaccinated: cached.vaccinated,
        verified: cached.vaccinated,
        record_count: cached.records.length,
        records: cached.records
      });
    }

    try {
      const { vaccinated, records } = await verifyVaccination(wallet);

      verifyCache.set(wallet, {
        vaccinated,
        records,
        timestamp: now
      });

      audit({
        actor,
        action: 'verify.lookup',
        target: wallet,
        result: 'success',
        meta: req.verifier ? { verifier_label: req.verifier.label } : {},
      });

      res.json({ wallet, vaccinated, verified: vaccinated, record_count: records.length, records });
    } catch (err) {
      const errorMessage = resolveContractErrorMessage(err);
      audit({ actor, action: 'verify.lookup', target: wallet, result: 'failure', meta: { error: errorMessage } });
      
      const isTimeout = err.message && (
        err.message.toLowerCase().includes('timeout') ||
        err.message.toLowerCase().includes('deadline') ||
        err.message.toLowerCase().includes('abort')
      );
      res.status(isTimeout ? 503 : 500).json({ error: errorMessage });
    }
  }
);

router.verifyCache = verifyCache;
module.exports = router;
