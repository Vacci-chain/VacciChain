# Unversioned Path Redirect Implementation

## Summary

Implemented 308 permanent redirects for all unversioned API paths to their `/v1/` equivalents with `Deprecation: true` header, as specified in the README.

## Changes Made

### 1. Fixed `backend/src/app.js`

**Problem**: Unversioned routes were registered BEFORE the redirect middleware, causing requests to match the unversioned routes instead of being redirected.

**Solution**: Removed direct registration of unversioned routes. Now only `/v1/` routes are registered, and a redirect middleware handles all unversioned paths.

**Before**:
```javascript
// These were registered first, preventing redirects
app.use('/auth', authRoutes);
app.use('/vaccination', vaccinationRoutes);
app.use('/verify', verifyRoutes);
app.use('/admin', adminRoutes);
app.use('/events', eventsRoutes);

// v1 routes
app.use('/v1', v1);

// Redirect middleware (never reached due to routes above)
app.use(['/auth', '/vaccination', ...], (req, res) => {
  res.setHeader('Deprecation', 'true');
  res.redirect(308, `/v1${req.originalUrl}`);
});
```

**After**:
```javascript
// Only v1 routes registered
app.use('/v1', v1);

// Redirect middleware now catches unversioned paths
app.use(['/auth', '/vaccination', '/verify', '/admin', '/patient', '/events'], (req, res) => {
  res.setHeader('Deprecation', 'true');
  res.redirect(308, `/v1${req.originalUrl}`);
});
```

### 2. Created Test Suite

**File**: `backend/tests/unversioned-redirect.test.js`

Comprehensive test coverage for:
- ✅ POST /auth/sep10 → 308 → /v1/auth/sep10
- ✅ POST /auth/verify → 308 → /v1/auth/verify
- ✅ POST /vaccination/issue → 308 → /v1/vaccination/issue
- ✅ POST /vaccination/revoke → 308 → /v1/vaccination/revoke
- ✅ GET /vaccination/:wallet → 308 → /v1/vaccination/:wallet
- ✅ GET /verify/public/:wallet → 308 → /v1/verify/public/:wallet
- ✅ GET /verify/:wallet → 308 → /v1/verify/:wallet
- ✅ All /admin, /patient, /events paths
- ✅ Deprecation: true header present
- ✅ 308 status (not 301) to preserve HTTP method

## Acceptance Criteria Met

✅ **POST /auth/sep10 redirects to POST /v1/auth/sep10 with 308**
- Status code: 308 Permanent Redirect
- Location header: `/v1/auth/sep10`
- Deprecation header: `true`

✅ **POST /auth/verify redirects to POST /v1/auth/verify with 308**
- Status code: 308 Permanent Redirect
- Location header: `/v1/auth/verify`
- Deprecation header: `true`

✅ **All unversioned vaccination and verify paths redirect similarly**
- `/vaccination/issue` → `/v1/vaccination/issue`
- `/vaccination/revoke` → `/v1/vaccination/revoke`
- `/vaccination/:wallet` → `/v1/vaccination/:wallet`
- `/verify/public/:wallet` → `/v1/verify/public/:wallet`
- `/verify/:wallet` → `/v1/verify/:wallet`

✅ **Deprecation: true header is present on all redirect responses**
- Set via `res.setHeader('Deprecation', 'true')`

✅ **Redirect preserves the request method (308, not 301)**
- 308 Permanent Redirect ensures POST stays POST
- 301 would change POST to GET on redirect (incorrect)

## Why 308 Instead of 301?

**308 Permanent Redirect**:
- Preserves the HTTP method (POST stays POST)
- Preserves the request body
- Correct for API redirects

**301 Moved Permanently**:
- Changes POST to GET on redirect
- Loses request body
- Incorrect for API redirects

## Testing

Run the test suite:
```bash
npm install
npm test -- unversioned-redirect.test.js
```

Or verify the implementation:
```bash
node verify-redirects.js
```

## Documentation

The README already documents this behavior:

> All endpoints are versioned. Responses include an `API-Version: 1` header.
> Unversioned paths (`/auth/...`, `/vaccination/...`, etc.) return a `308 Permanent Redirect` to `/v1/...` with a `Deprecation: true` header.

## Related Files

- `backend/src/app.js` - Main application with redirect middleware
- `backend/tests/unversioned-redirect.test.js` - Test suite
- `backend/verify-redirects.js` - Simple verification script
- `README.md` - API documentation
