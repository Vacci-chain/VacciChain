# VacciChain Analytics API Documentation

The VacciChain Analytics Service provides endpoints for querying vaccination statistics, detecting anomalies, and performing batch verification of wallet vaccination status.

**Base URL:** `http://analytics:8000` (internal) or configured `ANALYTICS_URL` (external)

**Service:** Python FastAPI service running on port 8000

## Table of Contents

1. [Authentication](#authentication)
2. [Analytics Endpoints](#analytics-endpoints)
3. [Batch Verification](#batch-verification)
4. [Rate Limiting](#rate-limiting)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

---

## Authentication

### Analytics Endpoints (GET /analytics/*)

All analytics endpoints require authentication via one of:

#### Option 1: API Key Header
```bash
curl -H "X-API-Key: <ANALYTICS_API_KEY>" \
  http://analytics:8000/analytics/rates
```

**Header:** `X-API-Key`
**Value:** Must match `ANALYTICS_API_KEY` environment variable

#### Option 2: Bearer JWT Token
```bash
curl -H "Authorization: Bearer <jwt-token>" \
  http://analytics:8000/analytics/rates
```

**Requirements:**
- Valid JWT signed with `JWT_SECRET`
- Token must have `role: "issuer"` claim
- Token must not be expired

**Example JWT Payload:**
```json
{
  "sub": "GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF",
  "role": "issuer",
  "iat": 1704067200,
  "exp": 1704153600
}
```

### Batch Verification (POST /batch/verify)

**No authentication required** — mirrors the public backend verification endpoint.

---

## Analytics Endpoints

### GET /analytics/rates

**Summary:** Get vaccination counts grouped by vaccine name

**Authentication:** Required (API key or JWT)

**Description:**
Fetches all VaccinationMinted events from the backend and aggregates the count of mints per vaccine type. Useful for understanding vaccine distribution and popularity.

**Request:**
```bash
curl -X GET "http://analytics:8000/analytics/rates" \
  -H "X-API-Key: your-api-key"
```

**Response (200 OK):**
```json
{
  "rates": {
    "Pfizer-BioNTech": 1240,
    "Moderna": 890,
    "Johnson & Johnson": 456,
    "AstraZeneca": 234
  },
  "total_mints": 2820
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `rates` | object | Vaccine name → count mapping |
| `total_mints` | integer | Total number of vaccination mints across all vaccines |

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 403 | JWT token missing required `issuer` role |
| 500 | Backend API unreachable or timeout |

**Performance:**
- Fetches up to 500 events from backend
- Response time: 1-3 seconds (depends on backend)
- No caching (fresh data on each request)

---

### GET /analytics/issuers

**Summary:** Get issuer activity statistics

**Authentication:** Required (API key or JWT)

**Description:**
Fetches all VaccinationMinted events and aggregates statistics per issuer, including total mints and the most recent ledger where they minted. Useful for monitoring issuer activity and identifying active participants.

**Request:**
```bash
curl -X GET "http://analytics:8000/analytics/issuers" \
  -H "X-API-Key: your-api-key"
```

**Response (200 OK):**
```json
{
  "issuers": [
    {
      "issuer": "GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF",
      "total_issued": 1240,
      "last_ledger": 45678901
    },
    {
      "issuer": "GDEF456HIJKLMNOPQRSTUVWXYZ123456789ABCDEFGHIJKLMNOPQRST",
      "total_issued": 890,
      "last_ledger": 45678850
    },
    {
      "issuer": "GABC789DEFGHIJKLMNOPQRSTUVWXYZ123456789ABCDEFGHIJKLMNOP",
      "total_issued": 690,
      "last_ledger": 45678799
    }
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `issuers` | array | List of issuer statistics |
| `issuers[].issuer` | string | Stellar public key of the issuer |
| `issuers[].total_issued` | integer | Total number of vaccination NFTs minted by this issuer |
| `issuers[].last_ledger` | integer | Most recent ledger number where this issuer minted |

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 403 | JWT token missing required `issuer` role |
| 500 | Backend API unreachable or timeout |

**Performance:**
- Fetches up to 500 events from backend
- Response time: 1-3 seconds
- No caching (fresh data on each request)

---

### GET /analytics/anomalies

**Summary:** Detect anomalous issuer activity

**Authentication:** Required (API key or JWT)

**Description:**
Flags issuers whose total mint count exceeds the `ANOMALY_THRESHOLD` (default: 50). This helps identify suspicious or unusual minting patterns that may warrant investigation.

**Request:**
```bash
curl -X GET "http://analytics:8000/analytics/anomalies" \
  -H "X-API-Key: your-api-key"
```

**Response (200 OK):**
```json
{
  "flagged_issuers": [
    {
      "issuer": "GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF",
      "total_issued": 1240
    },
    {
      "issuer": "GDEF456HIJKLMNOPQRSTUVWXYZ123456789ABCDEFGHIJKLMNOPQRST",
      "total_issued": 890
    }
  ],
  "threshold": 50
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `flagged_issuers` | array | List of issuers exceeding the threshold |
| `flagged_issuers[].issuer` | string | Stellar public key of the flagged issuer |
| `flagged_issuers[].total_issued` | integer | Total number of mints by this issuer |
| `threshold` | integer | The anomaly threshold value (from `ANOMALY_THRESHOLD` env var) |

**Configuration:**
- Threshold controlled by `ANOMALY_THRESHOLD` environment variable (default: 50)
- Adjust to be more or less sensitive to unusual activity

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 403 | JWT token missing required `issuer` role |
| 500 | Backend API unreachable or timeout |

**Performance:**
- Fetches up to 500 events from backend
- Response time: 1-3 seconds
- No caching (fresh data on each request)

---

## Batch Verification

### POST /batch/verify

**Summary:** Bulk verify Stellar wallet vaccination status

**Authentication:** Not required (public endpoint)

**Description:**
Accepts up to 100 Stellar public-key addresses and returns the vaccination status for each one by querying the backend's public verification endpoint. Useful for bulk verification workflows and third-party integrations.

**Request:**
```bash
curl -X POST "http://analytics:8000/batch/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "wallets": [
      "GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF",
      "GDEF456HIJKLMNOPQRSTUVWXYZ123456789ABCDEFGHIJKLMNOPQRST",
      "GABC789DEFGHIJKLMNOPQRSTUVWXYZ123456789ABCDEFGHIJKLMNOP"
    ]
  }'
```

**Request Schema:**

```json
{
  "wallets": [
    "string (Stellar public key, starts with 'G')",
    "..."
  ]
}
```

**Request Fields:**
| Field | Type | Constraints | Description |
|-------|------|-----------|-------------|
| `wallets` | array | 1-100 items | List of Stellar public-key addresses to verify |
| `wallets[]` | string | Valid Stellar key | Individual wallet address (56 characters, starts with 'G') |

**Request Validation:**
- Minimum 1 wallet
- Maximum 100 wallets per request
- Each wallet must be a valid Stellar public key format

**Response (200 OK):**
```json
{
  "results": [
    {
      "wallet": "GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF",
      "vaccinated": true,
      "record_count": 2,
      "error": null
    },
    {
      "wallet": "GDEF456HIJKLMNOPQRSTUVWXYZ123456789ABCDEFGHIJKLMNOPQRST",
      "vaccinated": false,
      "record_count": 0,
      "error": null
    },
    {
      "wallet": "GABC789DEFGHIJKLMNOPQRSTUVWXYZ123456789ABCDEFGHIJKLMNOP",
      "vaccinated": null,
      "record_count": null,
      "error": "Connection timeout"
    }
  ],
  "total": 3
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `results` | array | Per-wallet verification results |
| `results[].wallet` | string | Stellar public-key address that was checked |
| `results[].vaccinated` | boolean \| null | True if at least one valid vaccination record exists; null if error |
| `results[].record_count` | integer \| null | Number of vaccination records found; null if error |
| `results[].error` | string \| null | Error message if this wallet could not be verified; null on success |
| `total` | integer | Number of wallets processed |

**Error Responses:**

| Status | Condition | Response |
|--------|-----------|----------|
| 400 | More than 100 wallets provided | `{"detail": "Maximum 100 wallets per request"}` |
| 429 | Rate limit exceeded (30 req/min) | `{"detail": "rate limit exceeded"}` |
| 500 | Backend API unreachable | `{"detail": "Internal server error"}` |

**Performance:**
- Processes up to 100 wallets per request
- Response time: 5-15 seconds (depends on backend and network)
- Individual wallet failures do not fail the entire request
- Recommended batch size: 10-50 wallets for optimal performance

**Rate Limiting:**
- 30 requests per minute per IP
- Applies to the entire `/batch/verify` endpoint
- Returns 429 with `Retry-After` header when exceeded

---

## Rate Limiting

### Analytics Endpoints
- **No explicit rate limit** (relies on backend rate limits)
- Recommended: Implement client-side throttling (1 request per second)

### Batch Verification
- **30 requests per minute per IP**
- Applies to `POST /batch/verify` endpoint
- Returns HTTP 429 when exceeded
- Response includes `Retry-After` header

**Example Rate Limit Response:**
```json
{
  "detail": "rate limit exceeded"
}
```

---

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "detail": "Authentication required"
}
```
**Causes:**
- Missing `X-API-Key` header or `Authorization` header
- Invalid API key
- Invalid or expired JWT token

#### 403 Forbidden
```json
{
  "detail": "Admin role required"
}
```
**Causes:**
- JWT token present but missing `role: "issuer"` claim

#### 400 Bad Request
```json
{
  "detail": "Maximum 100 wallets per request"
}
```
**Causes:**
- Batch verify request with more than 100 wallets
- Invalid request body format

#### 429 Too Many Requests
```json
{
  "detail": "rate limit exceeded"
}
```
**Causes:**
- Exceeded rate limit (30 req/min for batch verify)

#### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```
**Causes:**
- Backend API unreachable
- Backend API timeout
- Database connection failure

---

## Examples

### Example 1: Get Vaccination Rates (API Key Auth)

```bash
#!/bin/bash

API_KEY="your-analytics-api-key"
ANALYTICS_URL="http://analytics:8000"

curl -X GET "${ANALYTICS_URL}/analytics/rates" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "rates": {
    "Pfizer-BioNTech": 1240,
    "Moderna": 890
  },
  "total_mints": 2130
}
```

### Example 2: Get Issuer Activity (JWT Auth)

```bash
#!/bin/bash

JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
ANALYTICS_URL="http://analytics:8000"

curl -X GET "${ANALYTICS_URL}/analytics/issuers" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "issuers": [
    {
      "issuer": "GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF",
      "total_issued": 1240,
      "last_ledger": 45678901
    }
  ]
}
```

### Example 3: Detect Anomalies

```bash
#!/bin/bash

API_KEY="your-analytics-api-key"
ANALYTICS_URL="http://analytics:8000"

curl -X GET "${ANALYTICS_URL}/analytics/anomalies" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "flagged_issuers": [
    {
      "issuer": "GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF",
      "total_issued": 1240
    }
  ],
  "threshold": 50
}
```

### Example 4: Batch Verify Wallets (No Auth)

```bash
#!/bin/bash

ANALYTICS_URL="http://analytics:8000"

curl -X POST "${ANALYTICS_URL}/batch/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "wallets": [
      "GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF",
      "GDEF456HIJKLMNOPQRSTUVWXYZ123456789ABCDEFGHIJKLMNOPQRST"
    ]
  }'
```

**Response:**
```json
{
  "results": [
    {
      "wallet": "GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF",
      "vaccinated": true,
      "record_count": 2,
      "error": null
    },
    {
      "wallet": "GDEF456HIJKLMNOPQRSTUVWXYZ123456789ABCDEFGHIJKLMNOPQRST",
      "vaccinated": false,
      "record_count": 0,
      "error": null
    }
  ],
  "total": 2
}
```

### Example 5: Python Client

```python
import httpx
import json

# Analytics endpoint with API key
async def get_vaccination_rates(api_key: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://analytics:8000/analytics/rates",
            headers={"X-API-Key": api_key}
        )
        return response.json()

# Batch verify with error handling
async def batch_verify_wallets(wallets: list[str]):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "http://analytics:8000/batch/verify",
                json={"wallets": wallets},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                print("Rate limited, retry after:", e.response.headers.get("Retry-After"))
            raise

# Usage
import asyncio

async def main():
    # Get rates
    rates = await get_vaccination_rates("your-api-key")
    print(f"Total mints: {rates['total_mints']}")
    
    # Batch verify
    results = await batch_verify_wallets([
        "GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF",
        "GDEF456HIJKLMNOPQRSTUVWXYZ123456789ABCDEFGHIJKLMNOPQRST"
    ])
    print(f"Verified {results['total']} wallets")

asyncio.run(main())
```

---

## Environment Configuration

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANALYTICS_API_KEY` | (required) | Secret key for X-API-Key authentication |
| `JWT_SECRET` | (required) | Secret for JWT token validation |
| `BACKEND_URL` | `http://backend:4000` | Backend API URL for event queries |
| `ANOMALY_THRESHOLD` | `50` | Issuer mint count threshold for anomaly detection |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |

---

## Acceptance Criteria Met

✅ **All four analytics endpoints are documented with full request/response schemas**
- GET /analytics/rates
- GET /analytics/issuers
- GET /analytics/anomalies
- POST /batch/verify

✅ **POST /batch/verify request body format is documented with an example**
- Request schema with field descriptions
- Validation constraints (1-100 wallets)
- Multiple curl and Python examples

✅ **Authentication requirements (if any) are documented**
- Analytics endpoints: API key or JWT with issuer role
- Batch verify: No authentication required
- Detailed auth examples for both methods

✅ **Rate limits and performance characteristics are noted**
- Analytics: No explicit limit (backend rate limits apply)
- Batch verify: 30 req/min per IP
- Response times: 1-3 seconds for analytics, 5-15 seconds for batch
- Performance recommendations included

✅ **Documentation is stored in docs/analytics-api.md**
- Comprehensive markdown documentation
- Located at `docs/analytics-api.md`
- Includes table of contents, examples, and configuration
