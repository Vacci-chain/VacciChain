# API Reference — VacciChain

Base URL: `http://localhost:4000/v1`

This document lists primary endpoints, request/response schemas, authentication requirements, and examples.

## Authentication

- SEP-10 flow issues a JWT on successful verification.
- Include JWT as `Authorization: Bearer <token>` for protected endpoints.

---

## POST /auth/sep10

Generates a SEP-10 challenge transaction for the provided public key.

Request:
```json
{ "public_key": "G..." }
```

Response (200):
```json
{ "challenge": "<base64-xdr>" }
```

Errors:
- 400: missing or invalid `public_key`

---

## POST /auth/verify

Verify signed SEP-10 challenge and return JWT.

Request:
```json
{ "signed_xdr": "<base64-xdr>" }
```

Response (200):
```json
{ "token": "<jwt>", "expires_in": 3600 }
```

Errors:
- 401: invalid signature or expired challenge

---

## POST /vaccination/issue

Mint a vaccination NFT for a patient. Issuer-only action.

Headers:
- `Authorization: Bearer <issuer_jwt>`

Request body:
```json
{
  "patient_wallet": "G...",
  "vaccine": "COVID-19",
  "date": "2026-05-01",
  "batch": "BATCH-123",
  "metadata": { "lot": "L-123" }
}
```

Response (201):
```json
{
  "token_id": "abc123",
  "contract_tx": "<hash>",
  "issued_at": "2026-05-01T12:34:56Z"
}
```

Errors:
- 400: validation error (missing fields)
- 403: issuer not authorized
- 409: duplicate record detected

---

## GET /vaccination/:wallet

Fetch all vaccination records for a wallet.

Response (200):
```json
{
  "wallet": "G...",
  "records": [
    { "token_id": "abc123", "vaccine":"COVID-19", "date":"2026-05-01", "issuer":"G..." }
  ]
}
```

Errors:
- 404: wallet not found (no records)

---

## GET /verify/:wallet

Public endpoint returning aggregated verification result.

Response (200):
```json
{
  "wallet": "G...",
  "verified": true,
  "records": [ { "vaccine":"COVID-19", "date":"2026-05-01", "issuer":"G..." } ]
}
```

Errors:
- 400: malformed wallet address

---

## Analytics (Python service)

Base URL: `http://localhost:8001`

### GET /analytics/rates
Response:
```json
{ "by_vaccine": { "COVID-19": 1234 } }
```

### POST /batch/verify
Request: `{"wallets": ["G...", "G..."]}`
Response: `{"results": [{"wallet":"G...","verified":true}]}`

---

For full endpoint listings, examples, and error codes, see the `backend/src/routes` implementations and expand this document as needed.
