/**
 * Test suite for request body validation schemas.
 * Verifies that all POST endpoints have proper validation.
 */

const { sep10Schema, verifySchema } = require('../src/routes/schemas/auth.schemas');
const { issueSchema, revokeSchema } = require('../src/routes/schemas/vaccination.schemas');
const { addIssuerSchema, createApiKeySchema, rotateJwtSchema, approveProposalSchema } = require('../src/routes/schemas/admin.schemas');
const { registerSchema } = require('../src/routes/schemas/patient.schemas');
const { recordConsentSchema } = require('../src/routes/schemas/consent.schemas');
const { applySchema, reviewSchema } = require('../src/routes/schemas/onboarding.schemas');

describe('Request Body Validation Schemas', () => {
  describe('Auth Schemas', () => {
    describe('sep10Schema', () => {
      it('should accept valid Stellar public key', () => {
        const result = sep10Schema.safeParse({
          public_key: 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF',
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing public_key', () => {
        const result = sep10Schema.safeParse({});
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toContain('required');
      });

      it('should reject invalid Stellar public key', () => {
        const result = sep10Schema.safeParse({
          public_key: 'invalid-key',
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty public_key', () => {
        const result = sep10Schema.safeParse({
          public_key: '',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('verifySchema', () => {
      it('should accept valid transaction and nonce', () => {
        const result = verifySchema.safeParse({
          transaction: 'AAAAAgAAAABIW8...',
          nonce: 'abc123',
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing transaction', () => {
        const result = verifySchema.safeParse({
          nonce: 'abc123',
        });
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toContain('required');
      });

      it('should reject missing nonce', () => {
        const result = verifySchema.safeParse({
          transaction: 'AAAAAgAAAABIW8...',
        });
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toContain('required');
      });

      it('should reject empty transaction', () => {
        const result = verifySchema.safeParse({
          transaction: '',
          nonce: 'abc123',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Vaccination Schemas', () => {
    describe('issueSchema', () => {
      it('should accept valid vaccination issue request', () => {
        const result = issueSchema.safeParse({
          patient_address: 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF',
          vaccine_name: 'Pfizer-BioNTech',
          date_administered: '2024-01-15T10:30:00Z',
          dose_number: 1,
          dose_series: 2,
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing patient_address', () => {
        const result = issueSchema.safeParse({
          vaccine_name: 'Pfizer-BioNTech',
          date_administered: '2024-01-15T10:30:00Z',
        });
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toContain('required');
      });

      it('should reject missing vaccine_name', () => {
        const result = issueSchema.safeParse({
          patient_address: 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF',
          date_administered: '2024-01-15T10:30:00Z',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing date_administered', () => {
        const result = issueSchema.safeParse({
          patient_address: 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF',
          vaccine_name: 'Pfizer-BioNTech',
        });
        expect(result.success).toBe(false);
      });

      it('should reject invalid date format', () => {
        const result = issueSchema.safeParse({
          patient_address: 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF',
          vaccine_name: 'Pfizer-BioNTech',
          date_administered: 'not-a-date',
        });
        expect(result.success).toBe(false);
      });

      it('should reject non-integer dose_number', () => {
        const result = issueSchema.safeParse({
          patient_address: 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF',
          vaccine_name: 'Pfizer-BioNTech',
          date_administered: '2024-01-15T10:30:00Z',
          dose_number: 1.5,
        });
        expect(result.success).toBe(false);
      });

      it('should reject dose_number less than 1', () => {
        const result = issueSchema.safeParse({
          patient_address: 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF',
          vaccine_name: 'Pfizer-BioNTech',
          date_administered: '2024-01-15T10:30:00Z',
          dose_number: 0,
        });
        expect(result.success).toBe(false);
      });

      it('should allow optional dose fields', () => {
        const result = issueSchema.safeParse({
          patient_address: 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF',
          vaccine_name: 'Pfizer-BioNTech',
          date_administered: '2024-01-15T10:30:00Z',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('revokeSchema', () => {
      it('should accept string token_id', () => {
        const result = revokeSchema.safeParse({
          token_id: '12345',
        });
        expect(result.success).toBe(true);
        expect(result.data.token_id).toBe('12345');
      });

      it('should accept number token_id and convert to string', () => {
        const result = revokeSchema.safeParse({
          token_id: 12345,
        });
        expect(result.success).toBe(true);
        expect(result.data.token_id).toBe('12345');
      });

      it('should reject missing token_id', () => {
        const result = revokeSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Admin Schemas', () => {
    describe('addIssuerSchema', () => {
      it('should accept valid address', () => {
        const result = addIssuerSchema.safeParse({
          address: 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF',
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing address', () => {
        const result = addIssuerSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject empty address', () => {
        const result = addIssuerSchema.safeParse({
          address: '',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('createApiKeySchema', () => {
      it('should accept valid label', () => {
        const result = createApiKeySchema.safeParse({
          label: 'My API Key',
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing label', () => {
        const result = createApiKeySchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject empty label', () => {
        const result = createApiKeySchema.safeParse({
          label: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject label exceeding max length', () => {
        const result = createApiKeySchema.safeParse({
          label: 'a'.repeat(256),
        });
        expect(result.success).toBe(false);
      });
    });

    describe('rotateJwtSchema', () => {
      it('should accept new_secret', () => {
        const result = rotateJwtSchema.safeParse({
          new_secret: 'a'.repeat(32),
        });
        expect(result.success).toBe(true);
      });

      it('should accept reload_from_env', () => {
        const result = rotateJwtSchema.safeParse({
          reload_from_env: true,
        });
        expect(result.success).toBe(true);
      });

      it('should reject both missing', () => {
        const result = rotateJwtSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject new_secret less than 32 chars', () => {
        const result = rotateJwtSchema.safeParse({
          new_secret: 'short',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('approveProposalSchema', () => {
      it('should accept valid UUID proposal_id', () => {
        const result = approveProposalSchema.safeParse({
          proposal_id: '550e8400-e29b-41d4-a716-446655440000',
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing proposal_id', () => {
        const result = approveProposalSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject invalid UUID', () => {
        const result = approveProposalSchema.safeParse({
          proposal_id: 'not-a-uuid',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Patient Schemas', () => {
    describe('registerSchema', () => {
      it('should accept empty body', () => {
        const result = registerSchema.safeParse({});
        expect(result.success).toBe(true);
      });

      it('should reject unknown fields', () => {
        const result = registerSchema.safeParse({
          unknown_field: 'value',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Consent Schemas', () => {
    describe('recordConsentSchema', () => {
      it('should accept empty body', () => {
        const result = recordConsentSchema.safeParse({});
        expect(result.success).toBe(true);
      });

      it('should reject unknown fields', () => {
        const result = recordConsentSchema.safeParse({
          unknown_field: 'value',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Onboarding Schemas', () => {
    describe('applySchema', () => {
      it('should accept valid application', () => {
        const result = applySchema.safeParse({
          name: 'Health Clinic',
          license_number: 'HC-12345',
          country: 'US',
          wallet: 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF',
        });
        expect(result.success).toBe(true);
      });

      it('should reject name too short', () => {
        const result = applySchema.safeParse({
          name: 'A',
          license_number: 'HC-12345',
          country: 'US',
          wallet: 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF',
        });
        expect(result.success).toBe(false);
      });

      it('should reject name too long', () => {
        const result = applySchema.safeParse({
          name: 'a'.repeat(121),
          license_number: 'HC-12345',
          country: 'US',
          wallet: 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF',
        });
        expect(result.success).toBe(false);
      });

      it('should reject wallet not 56 chars', () => {
        const result = applySchema.safeParse({
          name: 'Health Clinic',
          license_number: 'HC-12345',
          country: 'US',
          wallet: 'short',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing required fields', () => {
        const result = applySchema.safeParse({
          name: 'Health Clinic',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('reviewSchema', () => {
      it('should accept approved decision', () => {
        const result = reviewSchema.safeParse({
          decision: 'approved',
        });
        expect(result.success).toBe(true);
      });

      it('should accept rejected decision', () => {
        const result = reviewSchema.safeParse({
          decision: 'rejected',
        });
        expect(result.success).toBe(true);
      });

      it('should accept with reviewer_note', () => {
        const result = reviewSchema.safeParse({
          decision: 'approved',
          reviewer_note: 'Looks good',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid decision', () => {
        const result = reviewSchema.safeParse({
          decision: 'pending',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing decision', () => {
        const result = reviewSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject reviewer_note exceeding max length', () => {
        const result = reviewSchema.safeParse({
          decision: 'approved',
          reviewer_note: 'a'.repeat(501),
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
