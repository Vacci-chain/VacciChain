const { z } = require('zod');

/**
 * Validation schemas for consent routes.
 * Co-located with consent.js for easy maintenance.
 */

// POST /patient/consent has no body parameters, but we define an empty schema for consistency
const recordConsentSchema = z.object({}).strict();

module.exports = {
  recordConsentSchema,
};
