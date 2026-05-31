const { z } = require('zod');

/**
 * Validation schemas for patient routes.
 * Co-located with patient.js for easy maintenance.
 */

// POST /patient/register has no body parameters, but we define an empty schema for consistency
const registerSchema = z.object({}).strict();

module.exports = {
  registerSchema,
};
