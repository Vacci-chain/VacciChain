# Redirect Behavior Examples

## How to Test

Start the backend server:
```bash
npm install
npm start
```

## Example Requests

### 1. POST /auth/sep10 (Unversioned)

**Request**:
```bash
curl -i -X POST http://localhost:4000/auth/sep10 \
  -H "Content-Type: application/json" \
  -d '{"public_key":"GBADTEST"}'
```

**Response**:
```http
HTTP/1.1 308 Permanent Redirect
Deprecation: true
Location: /v1/auth/sep10
Content-Length: 0
```

The client should then retry with:
```bash
curl -X POST http://localhost:4000/v1/auth/sep10 \
  -H "Content-Type: application/json" \
  -d '{"public_key":"GBADTEST"}'
```

### 2. POST /auth/verify (Unversioned)

**Request**:
```bash
curl -i -X POST http://localhost:4000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"transaction":"test","nonce":"test"}'
```

**Response**:
```http
HTTP/1.1 308 Permanent Redirect
Deprecation: true
Location: /v1/auth/verify
Content-Length: 0
```

### 3. GET /verify/public/:wallet (Unversioned)

**Request**:
```bash
curl -i http://localhost:4000/verify/public/GBADTESTKEY
```

**Response**:
```http
HTTP/1.1 308 Permanent Redirect
Deprecation: true
Location: /v1/verify/public/GBADTESTKEY
Content-Length: 0
```

### 4. POST /vaccination/issue (Unversioned)

**Request**:
```bash
curl -i -X POST http://localhost:4000/vaccination/issue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "patient_address":"GBADTEST",
    "vaccine_name":"COVID-19",
    "date_administered":"2024-01-01"
  }'
```

**Response**:
```http
HTTP/1.1 308 Permanent Redirect
Deprecation: true
Location: /v1/vaccination/issue
Content-Length: 0
```

## Client Behavior

### Automatic Redirect Following

Most HTTP clients automatically follow redirects:

**curl with automatic redirect**:
```bash
curl -L -X POST http://localhost:4000/auth/sep10 \
  -H "Content-Type: application/json" \
  -d '{"public_key":"GBADTEST"}'
```

The `-L` flag tells curl to follow redirects. With 308, curl will:
1. Receive the 308 response
2. See the `Location: /v1/auth/sep10` header
3. Automatically retry with `POST /v1/auth/sep10` (method preserved)
4. Include the same request body

### JavaScript Fetch API

```javascript
// Fetch automatically follows redirects
fetch('http://localhost:4000/auth/sep10', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ public_key: 'GBADTEST' })
})
.then(response => {
  // This response is from /v1/auth/sep10 after redirect
  return response.json();
});
```

### Axios

```javascript
// Axios automatically follows redirects
axios.post('http://localhost:4000/auth/sep10', {
  public_key: 'GBADTEST'
})
.then(response => {
  // This response is from /v1/auth/sep10 after redirect
  console.log(response.data);
});
```

## Why 308 Matters

### With 308 (Correct):
```
Client: POST /auth/sep10 {"public_key":"GBADTEST"}
Server: 308 → /v1/auth/sep10
Client: POST /v1/auth/sep10 {"public_key":"GBADTEST"}  ← Method preserved
```

### With 301 (Incorrect):
```
Client: POST /auth/sep10 {"public_key":"GBADTEST"}
Server: 301 → /v1/auth/sep10
Client: GET /v1/auth/sep10  ← Method changed to GET, body lost!
```

## Deprecation Header

The `Deprecation: true` header signals to clients that:
- This endpoint is deprecated
- Clients should update to use `/v1/` paths directly
- The redirect is temporary support for legacy clients

Monitoring tools can track this header to identify clients still using deprecated paths.

## All Redirected Paths

| Unversioned Path | Redirects To | Status | Header |
|-----------------|--------------|--------|--------|
| `/auth/*` | `/v1/auth/*` | 308 | `Deprecation: true` |
| `/vaccination/*` | `/v1/vaccination/*` | 308 | `Deprecation: true` |
| `/verify/*` | `/v1/verify/*` | 308 | `Deprecation: true` |
| `/admin/*` | `/v1/admin/*` | 308 | `Deprecation: true` |
| `/patient/*` | `/v1/patient/*` | 308 | `Deprecation: true` |
| `/events/*` | `/v1/events/*` | 308 | `Deprecation: true` |

## Non-Redirected Paths

These paths are NOT redirected:
- `/health` - Health check endpoint (no versioning needed)
- `/v1/*` - Already versioned paths
