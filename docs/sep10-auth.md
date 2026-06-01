# SEP-10 Authentication

VacciChain uses [SEP-10](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md) (Stellar Web Authentication) to prove wallet ownership without ever transmitting a private key. The result is a short-lived JWT that gates all protected API endpoints.

---

## Why SEP-10?

Traditional username/password or OAuth flows require a central identity store. SEP-10 replaces that with a cryptographic challenge-response: the server issues a Stellar transaction that only the wallet owner can sign. Because the transaction is structurally invalid (sequence number 0), it can never be submitted to the network — it exists solely as a signing vehicle.

This gives VacciChain:

- **No password database** — identity is the wallet keypair.
- **Replay protection** — each challenge is single-use and expires in 5 minutes.
- **Network binding** — the transaction is tied to a specific network passphrase, preventing cross-network replays.
- **Standard interoperability** — any SEP-10-compliant wallet (e.g. Freighter) can participate without custom integration.

---

## Flow

```
Client (Freighter)                Backend                    Stellar Network
      │                              │                              │
      │── POST /v1/auth/sep10 ──────►│                              │
      │   { public_key }             │  build challenge tx          │
      │                              │  sign with SEP10_SERVER_KEY  │
      │                              │  store nonce (5 min TTL)     │
      │◄── { transaction, nonce } ───│                              │
      │                              │                              │
      │  sign tx with wallet         │                              │
      │                              │                              │
      │── POST /v1/auth/verify ─────►│                              │
      │   { transaction, nonce }     │  consume nonce (single-use)  │
      │                              │  verify server signature     │
      │                              │  verify client signature     │
      │                              │  derive role from public key │
      │◄── { token, wallet, role } ──│                              │
      │                              │                              │
      │── GET /v1/vaccination/:w ───►│                              │
      │   Authorization: Bearer …    │  validate JWT                │
      │◄── vaccination records ──────│                              │
```

---

## Challenge Transaction Structure

The challenge built in [`backend/src/stellar/sep10.js`](../backend/src/stellar/sep10.js) follows SEP-10 v3.4.1:

| Field | Value |
|---|---|
| Source account | Server keypair (`SEP10_SERVER_KEY`) |
| Sequence number | `0` — structurally invalid, cannot be submitted |
| Time bounds | `[now, now + 300]` — 5-minute window |
| Operation 1 | `manage_data`, source = **client** public key, key = `"<HOME_DOMAIN> auth"`, value = 64-byte base64 nonce |
| Operation 2 | `manage_data`, source = **server** public key, key = `"web_auth_domain"`, value = `WEB_AUTH_DOMAIN` |
| Signed by | Server keypair |

The nonce is 48 cryptographically random bytes encoded as base64 (producing exactly 64 bytes), generated with `crypto.randomBytes(48)`.

---

## Replay Protection

Two independent layers prevent a captured challenge from being reused:

**Nonce store** ([`backend/src/stellar/nonceStore.js`](../backend/src/stellar/nonceStore.js))

- On challenge creation, the nonce is stored in memory with a 5-minute TTL.
- On verification, `consume()` atomically reads and deletes the nonce. A second attempt with the same nonce throws `"Invalid or already used nonce"`.
- A background interval purges expired entries every 60 seconds.

**Transaction time bounds**

- The challenge transaction carries `timeBounds: [now, now+300]`.
- `verifyChallenge` checks the current time against these bounds and rejects expired transactions even if the nonce were somehow still present.

Both checks must pass. Either one alone is sufficient to block replay, but both are enforced for defence in depth.

---

## Verification Steps

`verifyChallenge` in [`backend/src/stellar/sep10.js`](../backend/src/stellar/sep10.js) performs these checks in order:

1. **Consume nonce** — fails fast if unknown, expired, or already used.
2. **Parse with network passphrase** — rejects transactions built for a different network.
3. **Sequence number is 0** — confirms the transaction was never submitted.
4. **Time bounds** — rejects expired challenges.
5. **Server signature** — confirms the challenge was issued by this server.
6. **Operation format** — first op must be `manage_data` with key `"<HOME_DOMAIN> auth"`.
7. **Client signature** — confirms the submitter controls the wallet in `op.source`.

The verified `clientPublicKey` is returned and used to mint the JWT.

---

## JWT Issuance

After successful verification ([`backend/src/routes/auth.js`](../backend/src/routes/auth.js)):

- Role is derived: `ADMIN_PUBLIC_KEY` → `admin`, otherwise `patient`. Issuers are promoted to the `issuer` role separately via the issuer middleware.
- JWT claims: `sub`, `wallet`, `role`, `iss` (HOME_DOMAIN), `iat`, `exp` (+1 hour).
- Signed with the current key from the rotating key store (`jwtKeys.js`). The `kid` header enables the auth middleware to try the matching key first during key rotation.
- A successful login is written to the append-only audit log.

Brute-force protection ([`backend/src/middleware/bruteForce.js`](../backend/src/middleware/bruteForce.js)) tracks failures per IP and per wallet; repeated failures trigger a lockout before verification is attempted.

---

## Rate Limiting

`POST /v1/auth/sep10` is protected by `sep10Limiter`: **10 requests per IP per minute** (configurable via `RATE_LIMIT_SEP10`). This limits the cost of generating challenges for arbitrary public keys.

---

## Relevant Source Files

| File | Purpose |
|---|---|
| `backend/src/stellar/sep10.js` | `buildChallenge` and `verifyChallenge` — core SEP-10 logic |
| `backend/src/stellar/nonceStore.js` | In-memory nonce store with TTL and single-use enforcement |
| `backend/src/routes/auth.js` | `POST /v1/auth/sep10` and `POST /v1/auth/verify` route handlers |
| `backend/src/middleware/auth.js` | JWT validation middleware used on protected routes |
| `frontend/src/hooks/useFreighter.js` | Client-side wallet connect and SEP-10 signing flow |
