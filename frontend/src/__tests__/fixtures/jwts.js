// Centralized JWT fixtures for frontend tests.
// These are static opaque strings — frontend only passes them in headers,
// it never decodes them, so realistic-looking values are sufficient.

// Happy path: a valid patient JWT
export const PATIENT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.patient.signature';

// Happy path: a valid issuer JWT
export const ISSUER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.issuer.signature';

// Edge case: an expired / invalid token string
export const INVALID_TOKEN = 'invalid.token.value';

// Edge case: empty string (no token)
export const EMPTY_TOKEN = '';
