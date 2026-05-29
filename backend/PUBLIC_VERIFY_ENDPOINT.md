# Public Vaccination Verification Endpoint

## Overview

A new public endpoint `GET /verify/public/:wallet` has been added to allow third-party integrators and verification pages to check vaccination status without authentication.

## Endpoints

### Public Endpoint (No Authentication)
```
GET /v1/verify/public/:wallet
```

**Description:** Check vaccination status for any wallet without authentication.

**Parameters:**
- `wallet` (path, required): Stellar public key (56 characters, starts with 'G')

**Response (200 OK):**
```json
{
  "wallet": "GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF",
  "verified": true,
  "records": [
    {
      "token_id": "12345",
      "vaccine_name": "Pfizer-BioNTech",
      "date_administered": "2024-01-15T10:30:00Z",
      "dose_number": 1,
      "dose_series": 2
    }
  ]
}
```

**Error Responses:**

| Status | Condition |
|--------|-----------|
| 400 | Invalid wallet format |
| 429 | Rate limit exceeded (60 requests/min per IP) |
| 503 | RPC timeout or service unavailable |
| 500 | Contract query failed |

### Authenticated Endpoint (Existing)
```
GET /v1/verify/:wallet
```

**Description:** Check vaccination status with authentication (JWT or API key).

**Authentication:** Required (Bearer token or X-API-Key header)

**Response (200 OK):**
```json
{
  "wallet": "GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF",
  "vaccinated": true,
  "verified": true,
  "record_count": 1,
  "records": [
    {
      "token_id": "12345",
      "vaccine_name": "Pfizer-BioNTech",
      "date_administered": "2024-01-15T10:30:00Z",
      "dose_number": 1,
      "dose_series": 2
    }
  ]
}
```

## Key Features

### No Authentication Required
- Public endpoint accessible without JWT or API key
- Ideal for verification pages and third-party integrators
- IP-based rate limiting only

### Wallet Format Validation
- Validates Stellar public key format before querying contract
- Returns 400 with error message for invalid format
- Prevents unnecessary RPC calls

### Response Caching
- Results cached for **60 seconds** to reduce RPC load
- Cache key: wallet address
- Shared cache between public and authenticated endpoints
- Reduces blockchain query overhead

### Rate Limiting
- **60 requests per minute per IP** (configurable via `RATE_LIMIT_VERIFY` env var)
- Returns 429 with `Retry-After` header when exceeded
- Prevents abuse and DDoS attacks

### Simplified Response Schema
- Public endpoint returns minimal schema: `{ wallet, verified, records }`
- Authenticated endpoint returns detailed schema: `{ wallet, vaccinated, verified, record_count, records }`
- Cleaner API for public consumers

## Usage Examples

### cURL
```bash
# Public endpoint (no auth)
curl -X GET "https://api.vaccichain.example.com/v1/verify/public/GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF"

# Authenticated endpoint (with JWT)
curl -X GET "https://api.vaccichain.example.com/v1/verify/GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF" \
  -H "Authorization: Bearer <token>"

# Authenticated endpoint (with API key)
curl -X GET "https://api.vaccichain.example.com/v1/verify/GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF" \
  -H "X-API-Key: <api-key>"
```

### JavaScript/Fetch
```javascript
// Public endpoint
const wallet = 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF';
const response = await fetch(`/v1/verify/public/${wallet}`);
const data = await response.json();

if (data.verified) {
  console.log(`Wallet has ${data.records.length} vaccination records`);
} else {
  console.log('No vaccination records found');
}
```

### Python
```python
import requests

wallet = 'GBRPYHIL2CI3WHZDTOOQFC6EB4KJJGUJJBBX7UYXNMWX5UXVJ5BNLHF'
response = requests.get(f'https://api.vaccichain.example.com/v1/verify/public/{wallet}')
data = response.json()

if response.status_code == 200:
    print(f"Verified: {data['verified']}")
    print(f"Records: {len(data['records'])}")
elif response.status_code == 400:
    print(f"Invalid wallet: {data['error']}")
elif response.status_code == 429:
    print("Rate limit exceeded")
```

## Implementation Details

### Middleware Stack
```
Request
  ↓
Wallet format validation (validateStellarPublicKey)
  ↓
Rate limiter (verifyLimiter - 60 req/min per IP)
  ↓
Route handler
  ├─ Check cache (60 second TTL)
  ├─ If cached: return cached result
  ├─ If not cached: query contract
  ├─ Cache result
  └─ Return response
```

### Cache Management
- **Cache Key:** Wallet address
- **Cache TTL:** 60 seconds
- **Cache Storage:** In-memory Map (suitable for single-instance)
- **Shared:** Both public and authenticated endpoints use same cache
- **Audit:** Cache hits not logged separately (same audit entry)

### Audit Logging
Public endpoint requests are logged with:
- `action: 'verify.public_lookup'`
- `actor: <client-ip>`
- `target: <wallet-address>`
- `result: 'success' | 'failure'`
- `meta: { ip: <client-ip> }`

## Differences from Authenticated Endpoint

| Feature | Public | Authenticated |
|---------|--------|---------------|
| Authentication | Not required | Required (JWT or API key) |
| Rate limit | 60 req/min per IP | 60 req/min per JWT user or 120 req/min per API key |
| Response fields | `wallet, verified, records` | `wallet, vaccinated, verified, record_count, records` |
| Audit actor | Client IP | User wallet or API key ID |
| Use case | Public verification, third-party integrators | Internal systems, trusted partners |

## Security Considerations

### Public Access
- Endpoint is intentionally public (no authentication)
- Wallet addresses are public information on Stellar blockchain
- Vaccination status is derived from public blockchain data
- No sensitive information is exposed

### Rate Limiting
- Prevents abuse and DDoS attacks
- Per-IP rate limiting (60 requests/minute)
- Configurable via `RATE_LIMIT_VERIFY` environment variable
- Returns 429 with `Retry-After` header

### Caching
- Reduces RPC load on blockchain
- 60-second cache TTL balances freshness and performance
- Cache is in-memory (suitable for single-instance deployments)
- For multi-instance deployments, consider Redis cache

### Input Validation
- Wallet format validated before contract query
- Invalid format returns 400 immediately
- Prevents malformed RPC calls

## Configuration

### Environment Variables
```bash
# Rate limit for public endpoint (requests per minute per IP)
RATE_LIMIT_VERIFY=60

# Cache TTL (milliseconds)
# Currently hardcoded to 60000 (60 seconds)
# Can be made configurable if needed
```

## Monitoring

### Metrics to Track
- Public endpoint request volume
- Cache hit rate
- Rate limit violations
- Error rates (400, 429, 500, 503)
- RPC timeout frequency

### Audit Log Queries
```javascript
// Find all public verification lookups
const entries = queryAuditLog({ action: 'verify.public_lookup' });

// Find failed lookups
const failures = entries.filter(e => e.result === 'failure');

// Find lookups for specific wallet
const walletLookups = entries.filter(e => e.target === wallet);
```

## Acceptance Criteria Met

✅ **No authentication required**
- Public endpoint accessible without JWT or API key
- No Authorization header needed

✅ **Returns { verified: true/false, records: [...] } schema**
- Response includes `verified` boolean
- Response includes `records` array
- Simplified schema for public consumers

✅ **Wallet format is validated; invalid format returns 400**
- Uses existing `validateStellarPublicKey` middleware
- Returns 400 with error message for invalid format
- Prevents unnecessary contract calls

✅ **Response is cached for 60 seconds to reduce RPC load**
- Cache TTL set to 60 seconds
- Shared cache between public and authenticated endpoints
- Reduces blockchain query overhead

✅ **Rate limited to 60 requests per IP per minute**
- Uses `verifyLimiter` middleware
- Configurable via `RATE_LIMIT_VERIFY` env var
- Returns 429 when exceeded

## Future Enhancements

1. **Redis Cache:** For multi-instance deployments
2. **Configurable Cache TTL:** Make 60-second TTL configurable
3. **Metrics Export:** Prometheus metrics for monitoring
4. **Batch Verification:** Support checking multiple wallets in one request
5. **Webhook Notifications:** Notify when vaccination status changes
