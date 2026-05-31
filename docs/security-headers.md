# Security Headers

This document describes every HTTP security header configured for the VacciChain stack, the purpose of each header, the exact value in use, and instructions for updating headers when new resources are added.

Headers are applied at two layers:

| Layer | Where configured | Applies to |
|---|---|---|
| **nginx** | `frontend/nginx.conf` | All responses served by the frontend container (HTML, JS, CSS, API proxied responses) |
| **Express** | `backend/src/app.js` (via [Helmet](https://helmetjs.github.io/)) | All responses from the backend API when accessed directly (port 4000) |

In the Docker Compose setup, the browser only talks to nginx (port 3000). nginx proxies `/auth/`, `/vaccination/`, and `/verify/` to the backend, so the nginx headers are the ones the browser actually sees. The Express headers provide defence-in-depth for direct API access and non-Docker deployments.

---

## Headers reference

### 1. Content-Security-Policy (CSP)

**Purpose**
CSP is the primary defence against Cross-Site Scripting (XSS) and data-injection attacks. It tells the browser which sources are allowed to load scripts, styles, images, fonts, and other sub-resources. Any resource not matching the policy is blocked before it executes.

**Configured value**

```
Content-Security-Policy:
  default-src 'self';
  script-src  'self';
  style-src   'self' 'unsafe-inline';
  img-src     'self' data:;
  font-src    'self';
  connect-src 'self' https://horizon-testnet.stellar.org https://horizon.stellar.org
               https://soroban-testnet.stellar.org https://mainnet.sorobanrpc.com;
  frame-ancestors 'none';
  base-uri    'self';
  form-action 'self';
```

**Directive-by-directive justification**

| Directive | Value | Reason |
|---|---|---|
| `default-src` | `'self'` | Catch-all fallback. Any sub-resource type not explicitly listed falls back to same-origin only. |
| `script-src` | `'self'` | All JavaScript is bundled by Vite and served from the same origin. No CDN scripts, no inline `<script>` blocks, no `eval`. |
| `style-src` | `'self' 'unsafe-inline'` | Vite injects critical CSS as inline `<style>` tags during development and in some production builds. `'unsafe-inline'` is required for those injected styles. If you migrate to CSS-in-JS or extract all styles to `.css` files, remove `'unsafe-inline'` and add a nonce or hash instead. |
| `img-src` | `'self' data:` | The UI uses `data:` URIs for SVG icons and placeholder images rendered inline by React components. No external image CDN is used. |
| `font-src` | `'self'` | No external font services (Google Fonts, etc.) are used. All fonts are bundled locally. |
| `connect-src` | `'self'` + Stellar endpoints | The Freighter browser extension and the frontend's `useFreighter` hook make direct XHR/fetch calls to Stellar Horizon and Soroban RPC endpoints for transaction simulation and submission. Both testnet and mainnet URLs are listed so the same build works in both environments. |
| `frame-ancestors` | `'none'` | Prevents the app from being embedded in any `<iframe>`, `<frame>`, or `<object>`. Equivalent to `X-Frame-Options: DENY` but more expressive and not limited to top-level frames. |
| `base-uri` | `'self'` | Prevents attackers from injecting a `<base>` tag that would redirect all relative URLs to an attacker-controlled origin. |
| `form-action` | `'self'` | Restricts where HTML forms can submit. The app uses fetch-based API calls rather than form submissions, but this directive closes the vector entirely. |

---

### 2. X-Frame-Options

**Purpose**
Prevents clickjacking by controlling whether the page can be rendered inside a frame on another origin. This header is understood by older browsers that do not support `frame-ancestors` in CSP.

**Configured value**

```
X-Frame-Options: DENY
```

`DENY` refuses framing from any origin, including the same origin. `SAMEORIGIN` would allow same-origin framing, which is unnecessary for VacciChain — no page in the app is designed to be embedded.

---

### 3. X-Content-Type-Options

**Purpose**
Stops browsers from MIME-sniffing a response away from the declared `Content-Type`. Without this header, a browser might execute a JavaScript file served as `text/plain`, enabling content-injection attacks.

**Configured value**

```
X-Content-Type-Options: nosniff
```

`nosniff` is the only valid value. It instructs the browser to honour the server-declared content type and never guess.

---

### 4. Strict-Transport-Security (HSTS)

**Purpose**
Forces all future connections to the site to use HTTPS, even if the user types `http://` or follows an `http://` link. After the first HTTPS visit, the browser will refuse to make plain-HTTP requests for the duration of `max-age`.

**Configured value**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

| Parameter | Value | Reason |
|---|---|---|
| `max-age` | `31536000` (1 year) | Standard recommendation. The browser caches this policy for one year. |
| `includeSubDomains` | present | Ensures subdomains (e.g. `api.vaccichain.example.com`) are also covered. |
| `preload` | absent | Not included until the domain is submitted to the [HSTS preload list](https://hstspreload.org/). Add `preload` only after the domain is registered there. |

> **Note for local development:** HSTS has no effect over plain HTTP (localhost). It only activates when the response is served over HTTPS. Do not set this header in development environments to avoid locking the browser into HTTPS for `localhost`.

---

### 5. Referrer-Policy

**Purpose**
Controls how much referrer information is included in the `Referer` header when navigating away from the app. Leaking full URLs in the `Referer` header can expose patient wallet addresses or session tokens embedded in query strings.

**Configured value**

```
Referrer-Policy: strict-origin-when-cross-origin
```

| Scenario | What is sent |
|---|---|
| Same-origin navigation | Full URL |
| Cross-origin navigation over HTTPS→HTTPS | Origin only (e.g. `https://vaccichain.example.com`) |
| Cross-origin navigation over HTTPS→HTTP | Nothing (referrer stripped entirely) |

This is the browser default in modern browsers, but setting it explicitly ensures consistent behaviour across all browsers and prevents downgrades.

---

### 6. Permissions-Policy

**Purpose**
Disables browser features that the app does not use. Restricting unused APIs reduces the attack surface if an XSS payload does execute — the attacker cannot access the camera, microphone, geolocation, or payment APIs.

**Configured value**

```
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
```

| Feature | Value | Reason |
|---|---|---|
| `camera` | `()` (blocked) | Not used by the app. |
| `microphone` | `()` (blocked) | Not used by the app. |
| `geolocation` | `()` (blocked) | Not used by the app. |
| `payment` | `()` (blocked) | Payments are handled on-chain via Stellar, not via the Payment Request API. |
| `usb` | `()` (blocked) | No hardware wallet USB access is required; Freighter handles signing. |

---

### 7. X-XSS-Protection

**Purpose**
Enables the legacy XSS auditor built into older versions of Internet Explorer and early Chrome. Modern browsers have removed this auditor in favour of CSP, but the header is included for compatibility with older clients.

**Configured value**

```
X-XSS-Protection: 1; mode=block
```

`mode=block` instructs the browser to block the page entirely rather than attempt to sanitise and render it when an XSS attack is detected. This header has no effect on modern browsers (Chrome 78+, Firefox, Safari) where the auditor was removed.

---

## Where to configure the headers

### nginx (`frontend/nginx.conf`)

Add a `add_header` directive inside the `server` block. All headers listed above should be present:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://horizon-testnet.stellar.org https://horizon.stellar.org https://soroban-testnet.stellar.org https://mainnet.sorobanrpc.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /auth/ {
        proxy_pass http://backend:4000;
    }

    location /vaccination/ {
        proxy_pass http://backend:4000;
    }

    location /verify/ {
        proxy_pass http://backend:4000;
    }
}
```

The `always` flag ensures headers are sent on error responses (4xx, 5xx) as well as successful ones.

### Express (`backend/src/app.js`)

Install [Helmet](https://helmetjs.github.io/), which sets all of the above headers automatically:

```bash
npm install helmet
```

Then add it as the first middleware in `app.js`:

```js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:      ["'self'"],
      scriptSrc:       ["'self'"],
      styleSrc:        ["'self'", "'unsafe-inline'"],
      imgSrc:          ["'self'", "data:"],
      fontSrc:         ["'self'"],
      connectSrc:      [
        "'self'",
        "https://horizon-testnet.stellar.org",
        "https://horizon.stellar.org",
        "https://soroban-testnet.stellar.org",
        "https://mainnet.sorobanrpc.com",
      ],
      frameAncestors:  ["'none'"],
      baseUri:         ["'self'"],
      formAction:      ["'self'"],
    },
  },
  frameguard:           { action: 'deny' },
  noSniff:              true,
  hsts:                 { maxAge: 31536000, includeSubDomains: true },
  referrerPolicy:       { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
}));
```

---

## Updating headers when new resources are added

### Adding an external script (e.g. an analytics snippet)

1. Add the script's origin to `script-src` in both nginx and Express:
   ```
   script-src 'self' https://cdn.example.com;
   ```
2. If the script is loaded inline (e.g. a `<script>` tag in `index.html`), generate a SHA-256 hash of the exact script content and add it instead of `'unsafe-inline'`:
   ```
   script-src 'self' 'sha256-<base64-hash>';
   ```
   Never add `'unsafe-inline'` to `script-src` — it defeats XSS protection entirely.

### Adding an external stylesheet or font (e.g. Google Fonts)

1. Add the font CDN origin to `style-src` and `font-src`:
   ```
   style-src 'self' https://fonts.googleapis.com;
   font-src  'self' https://fonts.gstatic.com;
   ```

### Adding an external image source (e.g. a vaccine logo CDN)

1. Add the image origin to `img-src`:
   ```
   img-src 'self' data: https://images.example.com;
   ```

### Adding a new Stellar network endpoint

The `connect-src` directive must include every Horizon and Soroban RPC URL the frontend fetches directly. When adding a new network (e.g. Futurenet):

1. Add the new endpoint URL to `connect-src` in both nginx and Express:
   ```
   connect-src 'self' ... https://rpc-futurenet.stellar.org;
   ```

### Adding a new API subdomain

If the backend moves to a subdomain (e.g. `api.vaccichain.example.com`), add it to `connect-src`:
```
connect-src 'self' https://api.vaccichain.example.com ...;
```

### Verifying changes

After updating headers, verify them with:

- **Browser DevTools** → Network tab → select any response → Headers panel
- **[securityheaders.com](https://securityheaders.com)** — paste your public URL for a graded report
- **[Mozilla Observatory](https://observatory.mozilla.org)** — comprehensive scan including CSP analysis

---

## Summary table

| Header | Value | Protects against |
|---|---|---|
| `Content-Security-Policy` | See directives above | XSS, data injection, clickjacking (via `frame-ancestors`) |
| `X-Frame-Options` | `DENY` | Clickjacking (legacy browser fallback) |
| `X-Content-Type-Options` | `nosniff` | MIME-type confusion attacks |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | SSL stripping, protocol downgrade attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage of sensitive URL parameters |
| `Permissions-Policy` | camera, mic, geo, payment, usb all blocked | Abuse of browser APIs by injected scripts |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS auditor (IE/old Chrome) |
# Security Headers Documentation

## Overview

VacciChain implements comprehensive security headers to protect against common web vulnerabilities including XSS (Cross-Site Scripting), clickjacking, MIME sniffing, and other attacks. This is especially critical for a blockchain application that handles wallet interactions and sensitive health data.

## Implemented Security Headers

### 1. Content-Security-Policy (CSP)

**Purpose**: Prevents XSS attacks by controlling which resources can be loaded and executed.

**Frontend Configuration** (Nginx):
```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  font-src 'self' data:; 
  connect-src 'self' https://horizon-testnet.stellar.org https://soroban-testnet.stellar.org https://horizon.stellar.org https://soroban.stellar.org; 
  frame-ancestors 'none'; 
  base-uri 'self'; 
  form-action 'self';
```

**Backend Configuration**:
```
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
```

**Why This Matters for VacciChain**:
- Prevents malicious scripts from intercepting Freighter wallet signing prompts
- Blocks unauthorized connections to external APIs
- Protects against injection attacks that could steal vaccination records

**Production Notes**:
- `unsafe-inline` is used for React inline styles in development
- Consider using a CSS-in-JS solution or nonces to remove `unsafe-inline` in production
- `connect-src` explicitly allows Stellar Horizon and Soroban RPC endpoints

### 2. X-Frame-Options

**Value**: `DENY`

**Purpose**: Prevents clickjacking attacks by disallowing the page to be embedded in frames/iframes.

**Why This Matters for VacciChain**:
- Prevents attackers from overlaying fake UI elements on top of wallet signing prompts
- Protects against UI redressing attacks that could trick users into signing malicious transactions

### 3. X-Content-Type-Options

**Value**: `nosniff`

**Purpose**: Prevents browsers from MIME-sniffing responses, forcing them to respect the declared Content-Type.

**Why This Matters for VacciChain**:
- Prevents browsers from interpreting JSON responses as HTML/JavaScript
- Blocks attacks where malicious content is disguised with incorrect MIME types

### 4. Referrer-Policy

**Value**: `strict-origin-when-cross-origin`

**Purpose**: Controls how much referrer information is sent with requests.

**Behavior**:
- Same-origin requests: Full URL is sent
- Cross-origin requests: Only origin (no path/query) is sent
- HTTPS → HTTP: No referrer is sent

**Why This Matters for VacciChain**:
- Prevents leaking sensitive URLs (e.g., with patient IDs) to external sites
- Maintains privacy while allowing legitimate analytics

### 5. X-XSS-Protection

**Value**: `1; mode=block`

**Purpose**: Enables browser's built-in XSS filter (legacy, but still useful for older browsers).

**Note**: Modern browsers rely on CSP, but this provides defense-in-depth for older browsers.

### 6. Strict-Transport-Security (HSTS)

**Value**: `max-age=31536000; includeSubDomains; preload`

**Purpose**: Forces browsers to only connect via HTTPS.

**Status**: 
- ⚠️ **Disabled in development** (commented out in `nginx.conf`)
- ✅ **Enabled in production** (`nginx.production.conf`)

**Why This Matters for VacciChain**:
- Prevents man-in-the-middle attacks
- Protects wallet private keys and authentication tokens in transit
- Critical for mainnet deployment

**Production Deployment**:
1. Ensure HTTPS is working properly
2. Test with a short `max-age` first (e.g., 300 seconds)
3. Gradually increase to 31536000 (1 year)
4. Consider HSTS preloading: https://hstspreload.org/

### 7. Permissions-Policy

**Value**: `geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()`

**Purpose**: Disables unnecessary browser features to reduce attack surface.

**Why This Matters for VacciChain**:
- VacciChain doesn't need geolocation, camera, or other device features
- Reduces risk of permission-based attacks
- Improves privacy

## Configuration Files

### Frontend (Nginx)

**Development**: `frontend/nginx.conf`
- Includes `unsafe-inline` for React development
- HSTS disabled
- Suitable for local development and testnet

**Production**: `frontend/nginx.production.conf`
- Stricter CSP (no `unsafe-inline`)
- HSTS enabled
- Use for mainnet deployment

### Backend (Express)

**Middleware**: `backend/src/middleware/securityHeaders.js`
- Applied to all API responses
- Restrictive CSP for JSON-only API
- Automatically loaded in `app.js`

## Testing Security Headers

### Automated Testing

**Linux/macOS**:
```bash
chmod +x scripts/test-security-headers.sh
./scripts/test-security-headers.sh
```

**Windows**:
```powershell
.\scripts\test-security-headers.ps1
```

**Custom URLs**:
```bash
# Linux/macOS
./scripts/test-security-headers.sh https://staging.vaccichain.com https://api.vaccichain.com

# Windows
.\scripts\test-security-headers.ps1 -FrontendUrl "https://staging.vaccichain.com" -BackendUrl "https://api.vaccichain.com"
```

### Manual Testing

**Using curl**:
```bash
# Frontend
curl -I http://localhost:3000

# Backend
curl -I http://localhost:4000/health
```

**Using browser DevTools**:
1. Open VacciChain in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Refresh page
5. Click on the main document request
6. Check "Response Headers" section

### Online Security Scanners

**SecurityHeaders.com**:
1. Deploy to a publicly accessible URL
2. Visit https://securityheaders.com/
3. Enter your URL
4. Target: Grade A or higher

**Mozilla Observatory**:
1. Visit https://observatory.mozilla.org/
2. Enter your URL
3. Target: A+ rating

**Expected Results**:
- ✅ Content-Security-Policy: Present
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy: Present
- ⚠️ Strict-Transport-Security: Only in production with HTTPS

## Common Issues and Solutions

### Issue: CSP Blocks Inline Scripts

**Symptom**: Console errors like "Refused to execute inline script"

**Solution**:
1. Move inline scripts to external `.js` files
2. Use nonces or hashes for necessary inline scripts
3. For React: Use styled-components or CSS modules instead of inline styles

### Issue: CSP Blocks External Resources

**Symptom**: Images, fonts, or API calls fail to load

**Solution**:
1. Add the domain to the appropriate CSP directive
2. Example: `img-src 'self' https://trusted-cdn.com`
3. Be specific - avoid using wildcards like `*`

### Issue: Freighter Wallet Not Working

**Symptom**: Wallet connection or signing fails

**Solution**:
1. Ensure `connect-src` includes Stellar endpoints
2. Check browser console for CSP violations
3. Freighter injects scripts - may need `script-src` adjustments

### Issue: HSTS Errors in Development

**Symptom**: Browser forces HTTPS on localhost

**Solution**:
1. Clear HSTS settings in browser:
   - Chrome: `chrome://net-internals/#hsts` → Delete domain
   - Firefox: Delete `SiteSecurityServiceState.txt` in profile folder
2. Use different domain for development (e.g., `local.vaccichain.test`)

## Security Best Practices

### 1. Regular Audits
- Test headers after every deployment
- Run security scanners monthly
- Review CSP violations in browser console

### 2. CSP Reporting
Consider adding CSP reporting in production:
```nginx
add_header Content-Security-Policy "...; report-uri /csp-report";
```

### 3. Gradual Rollout
- Test in staging first
- Use `Content-Security-Policy-Report-Only` to test without blocking
- Monitor for violations before enforcing

### 4. Keep Updated
- Review OWASP recommendations: https://owasp.org/www-project-secure-headers/
- Follow Mozilla guidelines: https://infosec.mozilla.org/guidelines/web_security
- Update headers as new threats emerge

## Production Deployment Checklist

- [ ] Switch to `nginx.production.conf`
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Test HSTS with short `max-age` first
- [ ] Remove `unsafe-inline` from CSP if possible
- [ ] Test all functionality (especially Freighter wallet)
- [ ] Run securityheaders.com scan (target: Grade A)
- [ ] Run Mozilla Observatory scan (target: A+)
- [ ] Set up CSP violation reporting
- [ ] Document any CSP exceptions and why they're needed
- [ ] Schedule regular security header audits

## Additional Resources

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [SecurityHeaders.com](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [HSTS Preload](https://hstspreload.org/)

## Support

For security concerns or questions:
1. Review this documentation
2. Check browser console for CSP violations
3. Test with provided scripts
4. Contact the security team for production deployments
