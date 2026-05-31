# Request Body Validation Implementation

This document describes the comprehensive request body validation system implemented across all POST endpoints in the VacciChain backend API.

## Overview

All POST endpoints now have defined validation schemas using Zod that enforce:
- Required field presence
- Type correctness (e.g., number vs string)
- Field-level constraints (min/max length, enum values, etc.)
- Validation errors are caught before reaching route handlers
- Detailed error messages with field paths

## Architecture

### Schema Organization

Validation schemas are **co-located with their route files** in a `schemas/` directory:

```
backend/src/routes/
├── schemas/
│   ├── auth.schemas.js
│   ├── vaccination.schemas.js
│   ├── admin.schemas.js
│   ├── patient.schemas.js
│   ├── consent.schemas.js
│   └── onboarding.schemas.js
├── auth.js
├── vaccination.js
├── admin.js
├── patient.js
├── consent.js
└── onboarding.js
```

This co-location makes it easy to:
- Find and update schemas alongside their route handlers
- Understand what validation applies to each endpoint
- Keep schemas and handlers in sync

### Validation Middleware

The existing `validate()` middleware in `src/middleware/validate.js` handles:
1. Parsing request body against the Zod schema
2. Stripping unknown fields (security)
3. Returning 400 with detailed error messages on validation failure
4. Preventing invalid requests from reaching route handlers

```javascript
const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse(req.body);
    req.body = validated;
    next();
  } catch (err) {
    if (err.issues) {
      return res.status(400).json({
        error: 'Validation failed',
        details: err.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(err);
  }
};
```

## POST Endpoints with Validation

### Authentication Routes (`/auth`)

#### POST /auth/sep10
**Schema:** `sep10Schema`
```javascript
{
  public_key: string (required, valid Stellar public key)
}
```
**Validation:**
- `public_key` is required
- Must be a valid Stellar public key format (starts with G, 56 chars)
- SDK validation confirms key validity

**Error Response (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "public_key",
      "message": "Invalid Stellar public key format"
    }
  ]
}
```

#### POST /auth/verify
**Schema:** `verifySchema`
```javascript
{
  transaction: string (required, min 1 char),
  nonce: string (required, min 1 char)
}
```
**Validation:**
- Both fields required
- Non-empty strings

**Error Response (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "transaction",
      "message": "transaction is required"
    }
  ]
}
```

### Vaccination Routes (`/vaccination`)

#### POST /vaccination/issue
**Schema:** `issueSchema`
```javascript
{
  patient_address: string (required),
  vaccine_name: string (required, max 256 chars),
  date_administered: string (required, valid ISO date),
  dose_number: number (optional, integer, min 1),
  dose_series: number (optional, integer, min 1)
}
```
**Validation:**
- `patient_address` required
- `vaccine_name` required, max 256 characters
- `date_administered` required, must parse as valid date
- `dose_number` and `dose_series` optional but must be positive integers if provided

**Error Response (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "date_administered",
      "message": "date_administered must be a valid ISO date string"
    },
    {
      "path": "dose_number",
      "message": "dose_number must be an integer"
    }
  ]
}
```

#### POST /vaccination/revoke
**Schema:** `revokeSchema`
```javascript
{
  token_id: string | number (required, converted to string)
}
```
**Validation:**
- `token_id` required
- Accepts string or number, converts to string
- Prevents type confusion

### Admin Routes (`/admin`)

#### POST /admin/issuers
**Schema:** `addIssuerSchema`
```javascript
{
  address: string (required, valid Stellar public key)
}
```
**Validation:**
- `address` required
- Must be valid Stellar public key

#### POST /admin/api-keys
**Schema:** `createApiKeySchema`
```javascript
{
  label: string (required, 1-255 chars)
}
```
**Validation:**
- `label` required
- Non-empty, max 255 characters

#### POST /admin/jwt/rotate
**Schema:** `rotateJwtSchema`
```javascript
{
  new_secret: string (optional, min 32 chars),
  new_kid: string (optional),
  reload_from_env: boolean (optional)
}
```
**Validation:**
- Either `new_secret` or `reload_from_env` must be provided
- If `new_secret` provided, must be at least 32 characters
- Prevents invalid JWT rotation requests

#### POST /admin/multisig/approve
**Schema:** `approveProposalSchema`
```javascript
{
  proposal_id: string (required, valid UUID)
}
```
**Validation:**
- `proposal_id` required
- Must be valid UUID format

### Patient Routes (`/patient`)

#### POST /patient/register
**Schema:** `registerSchema`
```javascript
{} // No body parameters
```
**Validation:**
- Rejects any body fields (strict mode)
- Ensures no unexpected data is sent

### Consent Routes (`/patient`)

#### POST /patient/consent
**Schema:** `recordConsentSchema`
```javascript
{} // No body parameters
```
**Validation:**
- Rejects any body fields (strict mode)
- Ensures no unexpected data is sent

### Onboarding Routes (`/onboarding`)

#### POST /onboarding/apply
**Schema:** `applySchema`
```javascript
{
  name: string (required, 2-120 chars),
  license_number: string (required, 1-60 chars),
  country: string (required, 2-60 chars),
  wallet: string (required, exactly 56 chars)
}
```
**Validation:**
- All fields required
- `name` between 2-120 characters
- `license_number` between 1-60 characters
- `country` between 2-60 characters
- `wallet` exactly 56 characters (Stellar address length)

#### POST /onboarding/applications/:id/review
**Schema:** `reviewSchema`
```javascript
{
  decision: enum['approved', 'rejected'] (required),
  reviewer_note: string (optional, max 500 chars)
}
```
**Validation:**
- `decision` required, must be 'approved' or 'rejected'
- `reviewer_note` optional, max 500 characters

## Validation Flow

```
Request arrives
    ↓
Express JSON parser
    ↓
Sanitization middleware (strips HTML, control chars)
    ↓
Route handler with validate(schema) middleware
    ↓
Zod schema validation
    ├─ Success: req.body updated with validated data
    │           Route handler executes
    │
    └─ Failure: 400 response with detailed errors
               Route handler never executes
```

## Error Response Format

All validation errors return HTTP 400 with this format:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "field_name",
      "message": "Human-readable error message"
    },
    {
      "path": "nested.field",
      "message": "Another error"
    }
  ]
}
```

### Example: Multiple Validation Errors

```bash
curl -X POST http://localhost:4000/v1/vaccination/issue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "vaccine_name": "",
    "date_administered": "invalid-date",
    "dose_number": 1.5
  }'
```

Response:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "patient_address",
      "message": "patient_address is required"
    },
    {
      "path": "vaccine_name",
      "message": "vaccine_name is required"
    },
    {
      "path": "date_administered",
      "message": "date_administered must be a valid ISO date string"
    },
    {
      "path": "dose_number",
      "message": "dose_number must be an integer"
    }
  ]
}
```

## Type Safety

Zod schemas provide runtime type validation. Common type mismatches caught:

| Sent | Expected | Error |
|------|----------|-------|
| `"123"` | number | "Expected number, received string" |
| `1.5` | integer | "Expected integer" |
| `"2024-13-45"` | ISO date | "Invalid date format" |
| `"pending"` | enum | "Invalid enum value" |
| `null` | string | "Expected string, received null" |

## Testing

Comprehensive test suite in `tests/validation-schemas.test.js` covers:
- Valid inputs for each schema
- Missing required fields
- Type mismatches
- Constraint violations (min/max length, enum values, etc.)
- Optional field handling
- Edge cases

Run tests:
```bash
npm test -- validation-schemas.test.js
```

## Security Benefits

1. **Defense in Depth**: Validation happens before business logic
2. **Type Safety**: Prevents type confusion attacks
3. **Constraint Enforcement**: Prevents oversized payloads, invalid formats
4. **Unknown Field Rejection**: Strips unexpected fields (prevents injection)
5. **Detailed Errors**: Helps clients understand what went wrong
6. **Audit Trail**: All validation failures can be logged

## Maintenance

When adding a new POST endpoint:

1. Create schema in appropriate `schemas/*.schemas.js` file
2. Export schema from that file
3. Import schema in route file
4. Add `validate(schema)` middleware to route
5. Add tests to `tests/validation-schemas.test.js`

Example:
```javascript
// src/routes/schemas/example.schemas.js
const exampleSchema = z.object({
  field: z.string().min(1),
});

// src/routes/example.js
const { exampleSchema } = require('./schemas/example.schemas');
router.post('/endpoint', validate(exampleSchema), handler);
```

## Acceptance Criteria Met

✅ All POST endpoints have defined schemas
✅ Missing required fields return 400 with field-level error messages
✅ Type mismatches return 400 with detailed error messages
✅ Validation errors do not reach route handler logic
✅ Validation schemas are co-located with their route files
