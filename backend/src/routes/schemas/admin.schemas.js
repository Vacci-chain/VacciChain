const { z } = require('zod');

/**
 * Validation schemas for admin routes.
 * Co-located with admin.js for easy maintenance.
 */

const addIssuerSchema = z.object({
  address: z.string()
    .min(1, 'address is required')
    .describe('Stellar public key of issuer to authorize'),
});

const createApiKeySchema = z.object({
  label: z.string()
    .min(1, 'label is required')
    .max(255, 'label must not exceed 255 characters')
    .describe('Human-readable label for the API key'),
});

const rotateJwtSchema = z.object({
  new_secret: z.string()
    .min(32, 'new_secret must be at least 32 characters')
    .optional()
    .describe('New JWT signing secret (min 32 chars)'),
  new_kid: z.string()
    .optional()
    .describe('Optional key ID for the new secret'),
  reload_from_env: z.boolean()
    .optional()
    .describe('If true, reload JWT secret from environment'),
}).refine(
  (data) => data.new_secret || data.reload_from_env,
  { message: 'Either new_secret or reload_from_env must be provided' }
);

const approveProposalSchema = z.object({
  proposal_id: z.string()
    .min(1, 'proposal_id is required')
    .uuid('proposal_id must be a valid UUID')
    .describe('UUID of the multi-sig proposal to approve'),
});

module.exports = {
  addIssuerSchema,
  createApiKeySchema,
  rotateJwtSchema,
  approveProposalSchema,
};
