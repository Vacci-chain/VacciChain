const { z } = require('zod');

/**
 * Validation schemas for onboarding routes.
 * Co-located with onboarding.js for easy maintenance.
 */

const applySchema = z.object({
  name: z.string()
    .min(2, 'name must be at least 2 characters')
    .max(120, 'name must not exceed 120 characters')
    .describe('Organization name'),
  license_number: z.string()
    .min(1, 'license_number is required')
    .max(60, 'license_number must not exceed 60 characters')
    .describe('Healthcare provider license number'),
  country: z.string()
    .min(2, 'country must be at least 2 characters')
    .max(60, 'country must not exceed 60 characters')
    .describe('Country of operation'),
  wallet: z.string()
    .length(56, 'wallet must be exactly 56 characters (Stellar address)')
    .describe('Stellar public key for the issuer'),
});

const reviewSchema = z.object({
  decision: z.enum(['approved', 'rejected'])
    .describe('Approval decision'),
  reviewer_note: z.string()
    .max(500, 'reviewer_note must not exceed 500 characters')
    .optional()
    .describe('Optional note from reviewer'),
});

module.exports = {
  applySchema,
  reviewSchema,
};
