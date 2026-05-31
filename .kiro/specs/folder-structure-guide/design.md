# Design Document: Folder Structure Guide

## Overview

This feature produces a single Markdown file — `docs/folder-structure.md` — that serves as the authoritative reference for the VacciChain repository layout. The guide is a documentation artifact, not a runtime component. Its "implementation" is the act of writing the file with the correct content, updating `README.md` to link to it, and updating `.github/pull_request_template.md` to enforce ongoing maintenance.

The guide must cover:
- Every top-level directory (including hidden dot-directories relevant to contributors)
- Key files within each of the four services (Backend, Frontend, Smart Contract, Analytics Service)
- A dedicated Separation of Concerns section with a cross-service interaction table
- A maintenance section with a last-reviewed date and responsible parties

No new runtime code is introduced. The deliverables are three file changes:
1. **Create** `docs/folder-structure.md`
2. **Update** `README.md` — add a "Folder Structure Guide" hyperlink in the Architecture section
3. **Update** `.github/pull_request_template.md` — add the maintenance checklist item

---

## Architecture

The guide is a static Markdown document. There is no build step, no code generation, and no tooling dependency. The document is maintained manually by service owners whenever the repository structure changes.

```
docs/
└── folder-structure.md          ← the guide (created by this feature)

README.md                        ← updated: link added in Architecture section
.github/
└── pull_request_template.md     ← updated: maintenance checklist item added
```

The guide's accuracy is enforced socially (PR checklist) rather than programmatically. Future automation (e.g., a CI script that diffs the directory tree against the guide) is out of scope for this feature.

---

## Components and Interfaces

### `docs/folder-structure.md`

The guide document itself. It has no external interfaces — it is read by humans and linked from `README.md`.

**Required sections (in order):**

| Section | Purpose |
|---|---|
| Introduction / preamble | One-paragraph orientation for new contributors |
| Top-Level Directory Reference | One entry per top-level directory with purpose statement |
| Key Files by Service | Sub-sections for Backend, Smart Contract, Frontend, Analytics Service |
| Separation of Concerns | Domain ownership table + cross-service interaction table |
| Keeping This Guide Up to Date | Maintenance instructions, responsible parties, last-reviewed date |

### `README.md` (modification)

A single hyperlink is added to the existing Architecture section:

```markdown
See the [Folder Structure Guide](docs/folder-structure.md) for detailed descriptions of every directory and key file.
```

### `.github/pull_request_template.md` (modification)

One checklist item is appended to the Checklist section:

```markdown
- [ ] If this PR adds a new directory or key file, I have updated `docs/folder-structure.md`.
```

---

## Data Models

This feature has no data models. The guide is a Markdown document with no structured schema beyond the section headings required by the requirements.

**Content inventory used to write the guide** (derived from repository exploration):

### Top-Level Directories

| Directory | Type | Notes |
|---|---|---|
| `backend/` | Service | Node.js / Express REST API |
| `contracts/` | Service | Rust / Soroban smart contract |
| `frontend/` | Service | React / Vite SPA |
| `python-service/` | Service | Python / FastAPI analytics |
| `infra/` | Infrastructure | Terraform IaC; sub-dirs: `envs/`, `modules/` |
| `docs/` | Documentation | Markdown reference docs, ADRs, security notes |
| `monitoring/` | Tooling | Prometheus + Grafana + Alertmanager configs |
| `logging/` | Tooling | Loki + Promtail + Grafana configs |
| `nginx/` | Tooling | Reverse-proxy config for local Docker stack |
| `scripts/` | Tooling | Local dev helper scripts (not deployed) |
| `tests/` | Tooling | Cross-service / E2E test placeholder |
| `backup/` | Tooling | Database backup container and scripts |
| `staging/` | Tooling | Staging ECS task definition |
| `.github/` | Tooling | CI/CD workflows, issue templates, PR template |
| `.kiro/` | Tooling | Kiro AI spec files (not deployed) |
| `.vscode/` | Tooling | Editor settings (not deployed) |

### Backend Key Files

**`backend/src/routes/`**

| File | HTTP Domain |
|---|---|
| `auth.js` | SEP-10 authentication — challenge generation (`POST /auth/sep10`) and signed-transaction verification + JWT issuance (`POST /auth/verify`) |
| `vaccination.js` | Vaccination record issuance (`POST /vaccination/issue`), revocation (`POST /vaccination/revoke`), and paginated retrieval (`GET /vaccination/:wallet`) |
| `patient.js` | Patient self-registration into the on-chain allowlist (`POST /patient/register`) |
| `verify.js` | Public vaccination status verification (`GET /verify/:wallet`), accepting either a JWT or a verifier API key |
| `admin.js` | Admin-only operations: issuer management, audit log query, API key lifecycle, JWT key rotation, and multi-sig proposal management |
| `consent.js` | Patient consent recording (`POST /patient/consent`) and status query (`GET /patient/consent/:wallet`) |
| `events.js` | Paginated query of indexed on-chain events (`GET /events`) |
| `onboarding.js` | Issuer onboarding application submission, listing, and admin review with multi-sig enforcement |

**`backend/src/middleware/`**

| File | Concern |
|---|---|
| `auth.js` | JWT verification with key-rotation support — populates `req.user` |
| `issuer.js` | Issuer role enforcement — checks JWT role and verifies on-chain authorization via `issuerCache` |
| `auditLog.js` | Append-only NDJSON audit log — `audit()` write helper and `queryAuditLog()` read helper |
| `bruteForce.js` | Brute-force protection for `/auth/verify` — tracks failed attempts per IP and wallet, blocks after threshold |
| `idempotency.js` | Idempotency key support — caches responses for 24 hours keyed by `Idempotency-Key` header |
| `multiSig.js` | M-of-N multi-signature enforcement for critical admin operations — proposal creation, approval tracking, and expiry |
| `rateLimiter.js` | Per-route rate limiting — separate limiters for SEP-10, verify, and verifier API key callers |
| `sanitize.js` | Input sanitization — strips HTML tags, control characters, and null bytes from `req.body`, `req.query`, and `req.params` |
| `securityHeaders.js` | HTTP security headers — sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-XSS-Protection`, `Content-Security-Policy`, and `Permissions-Policy` |
| `validate.js` | Zod schema validation middleware factory — parses and strips unknown fields from `req.body` |
| `verifierApiKey.js` | Verifier API key authentication — validates `X-API-Key` header against the hashed key store |
| `wallet.js` | Stellar public key format validation for route parameters and body fields |
| `apiVersion.js` | API versioning — adds `API-Version` response header and `Deprecation`/`Sunset` headers for sunset versions |
| `requestId.js` | Request ID propagation — generates or forwards `X-Request-ID` header for distributed tracing |

**`backend/src/stellar/`**

| File | Role |
|---|---|
| `sep10.js` | SEP-10 challenge construction (`buildChallenge`) and signed-transaction verification (`verifyChallenge`) per SEP-10 v3.4.1 |
| `soroban.js` | Soroban RPC client — `invokeContract` (state-changing calls with signing and polling), `simulateContract` (read-only calls), `mintVaccination`, `verifyVaccination`, and `addIssuer` helpers |
| `contractErrors.js` | Contract error code mapping — translates Soroban XDR error codes to human-readable messages |
| `issuerCache.js` | Short-lived (30 s) in-memory cache for on-chain issuer authorization checks, reducing RPC calls on every minting request |
| `nonceStore.js` | Single-use, TTL-bound nonce store for SEP-10 challenge replay protection |

### Smart Contract Key Files (`contracts/src/`)

| File | Role |
|---|---|
| `lib.rs` | Contract entry point — declares the `VacciChainContract` struct, all public contract functions, the `ContractError` enum, and inline unit tests (`#[cfg(test)]` module) |
| `mint.rs` | Vaccination minting logic — issuer authorization check, patient allowlist check, duplicate detection, deterministic token ID computation, and record persistence |
| `storage.rs` | On-chain storage schema — `VaccinationRecord`, `IssuerRecord`, and `DataKey` enum definitions; `compute_token_id` hash function |
| `events.rs` | Contract event emission helpers — `emit_minted`, `emit_revoked`, `emit_issuer_added`, `emit_patient_registered`, `emit_contract_upgraded`, and related functions |
| `verify.rs` | Vaccination verification logic — `verify_vaccination` (single wallet), `batch_verify` (up to 100 wallets), and `DoseStatus` dose-completion summary |
| `fuzz_tests.rs` | Fuzz test module (`#[cfg(test)]`) — property-based fuzz inputs for contract functions |
| `property_tests.rs` | Property-based test module (`#[cfg(test)]`) — universal correctness properties for contract invariants |
| `security_invariant_tests.rs` | Security invariant test module (`#[cfg(test)]`) — tests that enforce soulbound, authorization, and integrity invariants |
| `upgrade_tests.rs` | Contract upgrade test module (`#[cfg(test)]`) — tests for the WASM upgrade path |

All test modules use the `#[cfg(test)]` convention and are compiled only during `cargo test`.

### Frontend Key Files

**`frontend/src/pages/`**

| File | User Role / Primary Action |
|---|---|
| `Landing.jsx` | All users — project overview and Freighter wallet connection entry point |
| `PatientDashboard.jsx` | Patients — view all vaccination NFTs held in the connected wallet with pagination, QR code generation, and consent management |
| `IssuerDashboard.jsx` | Authorized issuers — fill and submit the vaccination issuance form to mint an NFT to a patient wallet |
| `AdminDashboard.jsx` | Admins — manage verifier API keys and review/approve issuer onboarding applications |
| `AnalyticsDashboard.jsx` | Authorized issuers — view vaccination rates, issuer activity statistics, and anomaly flags with auto-refresh |
| `VerifyPage.jsx` | Public / verifiers — enter any Stellar wallet address and retrieve its on-chain vaccination status |
| `IssuerOnboarding.jsx` | Healthcare providers — submit an onboarding application to request issuer authorization |

Test files (`*.test.jsx`) are co-located with their source pages. The convention is one test file per page, named `<PageName>.test.jsx`.

**`frontend/src/hooks/`**

| File | State / Side-Effect |
|---|---|
| `useFreighter.jsx` | Wallet connection state — wraps Freighter API for `connect`/`disconnect`, runs the SEP-10 auth flow, stores JWT and role, and exposes `apiFetch` with automatic token refresh |
| `useVaccination.js` | Vaccination API calls — `fetchRecords` (GET records for a wallet) and `issueVaccination` (POST to mint), with loading state and toast notifications |
| `useConsent.js` | Patient consent state — `checkConsent` (GET status) and `giveConsent` (POST), with loading state |
| `useDarkMode.js` | Dark mode preference — persists to `localStorage` and syncs with the `prefers-color-scheme` media query |
| `usePagination.js` | Client-side pagination state — slices an items array by page and page size, exposes `goTo` and `reset` |
| `useToast.jsx` | Toast notification queue — provides a `toast(message, type)` function that auto-dismisses after 4 seconds |

### Analytics Service Key Files (`python-service/`)

| File | Responsibility |
|---|---|
| `main.py` | FastAPI application factory — registers routers, configures structured logging, attaches rate limiting, and manages the APScheduler lifecycle via `lifespan` |
| `auth.py` | Authentication dependency — `require_analytics_auth` FastAPI dependency that accepts either an `X-API-Key` header or a Bearer JWT with `role == 'issuer'` |
| `scheduler.py` | Scheduled anomaly detection — APScheduler job that runs `anomaly_detection()` on a configurable interval and dispatches alerts for flagged issuers |
| `schemas.py` | Pydantic request/response models — `BatchVerifyRequest`, `BatchVerifyResponse`, `WalletResult`, `IssuerStat`, `AnomalyResponse`, and `HealthResponse` |
| `alerting.py` | Webhook alert dispatch — `dispatch_alerts` sends one HTTP POST per flagged issuer to a configured Slack, PagerDuty, or email webhook |
| `gunicorn.conf.py` | Gunicorn production server configuration — sets `UvicornWorker`, worker count (`cpu_count * 2 + 1`), timeout, and bind address |
| `routes/analytics.py` | Analytics endpoints — `GET /analytics/rates`, `GET /analytics/issuers`, `GET /analytics/anomalies`; reads from the Backend's `/events` API |
| `routes/batch.py` | Batch verification endpoint — `POST /batch/verify` accepts up to 100 wallet addresses and returns vaccination status for each by proxying to the Backend |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This feature produces a documentation file, not runtime application logic. However, several of its acceptance criteria are universal coverage requirements that are amenable to property-based testing: for any file in a given directory, that file's name must appear in the guide. These are genuine "for all" properties over finite, enumerable sets.

### Property 1: Top-level directory coverage

*For any* top-level directory present in the repository root, the name of that directory SHALL appear in `docs/folder-structure.md`.

**Validates: Requirements 1.1**

### Property 2: Backend route file coverage

*For any* file present under `backend/src/routes/`, the filename SHALL appear in `docs/folder-structure.md`.

**Validates: Requirements 2.1**

### Property 3: Backend middleware file coverage

*For any* file present under `backend/src/middleware/`, the filename SHALL appear in `docs/folder-structure.md`.

**Validates: Requirements 2.2**

### Property 4: Backend Stellar integration file coverage

*For any* file present under `backend/src/stellar/`, the filename SHALL appear in `docs/folder-structure.md`.

**Validates: Requirements 2.3**

### Property 5: Smart contract source file coverage

*For any* file present under `contracts/src/`, the filename SHALL appear in `docs/folder-structure.md`.

**Validates: Requirements 2.4**

### Property 6: Frontend page file coverage

*For any* non-test file present under `frontend/src/pages/` (i.e., files not matching `*.test.jsx`), the filename SHALL appear in `docs/folder-structure.md`.

**Validates: Requirements 2.5**

### Property 7: Frontend hook file coverage

*For any* file present under `frontend/src/hooks/`, the filename SHALL appear in `docs/folder-structure.md`.

**Validates: Requirements 2.6**

### Property 8: Analytics service file coverage

*For any* file in the set {`main.py`, `auth.py`, `scheduler.py`, `schemas.py`, `alerting.py`, `gunicorn.conf.py`} and any file under `python-service/routes/`, the filename SHALL appear in `docs/folder-structure.md`.

**Validates: Requirements 2.7**

### Property 9: Cross-service interaction coverage

*For any* interaction in the set {Frontend→Backend, Frontend→Smart Contract, Frontend→Analytics, Backend→Smart Contract, Analytics→Backend, Analytics→Smart Contract}, the guide SHALL contain that interaction pair and label it as either "permitted" or "prohibited".

**Validates: Requirements 3.6**

### Property 10: Service domain keyword coverage

*For any* service in {Backend, Smart Contract, Analytics Service, Frontend} and its required domain keywords (as specified in Requirements 3.2–3.5), each keyword SHALL appear in the guide's Separation of Concerns section.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

---

## Error Handling

This feature has no runtime error handling because it produces no runtime code. The following failure modes apply during the authoring and maintenance process:

| Failure Mode | Mitigation |
|---|---|
| Guide becomes stale after a structural change | PR checklist item in `.github/pull_request_template.md` prompts authors to update the guide |
| A new file is added but not documented | The "key file" definition in the requirements glossary and the PR checklist item together enforce coverage |
| The `docs/` directory is deleted | The guide would need to be recreated; the PR checklist item would catch this if the deletion is in a PR |
| README link is broken (e.g., docs/ moved) | Standard link-checking CI (if added in future) would catch this; currently a manual concern |

---

## Testing Strategy

This feature is a documentation artifact. The testing strategy focuses on verifying that the guide's content satisfies the coverage and structural requirements.

### Unit Tests (Example-Based)

These tests verify specific structural requirements that are not universal properties:

- **README link test**: Verify that `README.md` contains a markdown link with text `Folder Structure Guide` pointing to `docs/folder-structure.md`.
- **PR template checklist test**: Verify that `.github/pull_request_template.md` contains the exact text `If this PR adds a new directory or key file, I have updated \`docs/folder-structure.md\``.
- **Maintenance section test**: Verify that `docs/folder-structure.md` contains a "Keeping This Guide Up to Date" section.
- **Last-reviewed date test**: Verify that `docs/folder-structure.md` contains a date matching the `YYYY-MM-DD` pattern.
- **Separation of Concerns section test**: Verify that `docs/folder-structure.md` contains a "Separation of Concerns" section with all four service names.
- **Tooling-only directory test**: For each known tooling-only directory (`.github/`, `scripts/`, `.vscode/`, `.kiro/`), verify the guide contains language indicating it is not deployed.

### Property Tests

PBT is appropriate here because the coverage requirements are universal: for every file in a given directory, the filename must appear in the guide. These properties hold across the entire set of files in each directory and would catch any file added in the future that is not documented.

**Library**: [fast-check](https://fast-check.io/) (JavaScript) or [pytest-hypothesis](https://hypothesis.readthedocs.io/) (Python). Since the guide is a Markdown file and the test inputs are filesystem paths, either language is suitable. The recommended approach is a small Node.js test suite using `fast-check` alongside the existing backend test infrastructure.

**Configuration**: Each property test runs with a minimum of 100 iterations. Because the input space is finite (the set of files in each directory), the generator will exhaust all inputs quickly, making these effectively exhaustive tests.

**Tag format**: `Feature: folder-structure-guide, Property {N}: {property_text}`

**Property test implementations**:

Each property test follows this pattern:
1. Read the actual filesystem to enumerate the set of files in the target directory
2. Use `fc.constantFrom(...files)` to generate one file at a time
3. Read `docs/folder-structure.md`
4. Assert that the generated filename appears in the guide content

Example (Property 2 — backend route file coverage):

```javascript
// Feature: folder-structure-guide, Property 2: backend route file coverage
it('every backend route file appears in the guide', () => {
  const routeFiles = fs.readdirSync('backend/src/routes').filter(f => f.endsWith('.js'));
  const guideContent = fs.readFileSync('docs/folder-structure.md', 'utf8');
  fc.assert(
    fc.property(fc.constantFrom(...routeFiles), (filename) => {
      return guideContent.includes(filename);
    }),
    { numRuns: 100 }
  );
});
```

The same pattern applies to Properties 1, 3–8. Properties 9 and 10 use `fc.constantFrom` over the fixed sets of interactions and keywords respectively.

### Smoke Tests

- **File existence**: Verify `docs/folder-structure.md` exists at the correct path.
- **docs/ directory existence**: Verify the `docs/` directory exists.
