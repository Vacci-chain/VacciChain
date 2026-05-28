# VacciChain Folder Structure Guide

## Introduction

This guide is the authoritative reference for the VacciChain repository layout. It describes every top-level directory, the key files within each of the four independently deployable services, the separation of concerns between those services, and the process for keeping this document accurate as the codebase evolves. New contributors should read this guide before exploring the source code; it will orient you to where things live and why they are structured the way they are.

---

## Top-Level Directory Reference

The repository root contains the following directories. Service directories contain runtime application code that is deployed as part of VacciChain. Tooling directories support development, CI/CD, or infrastructure management but are not themselves deployed.

| Directory | Type | Purpose |
|---|---|---|
| `backend/` | Service | Node.js / Express REST API. Handles authentication (SEP-10), vaccination record management, on-chain event indexing, and all Soroban contract invocations on behalf of authenticated users. |
| `contracts/` | Service | Rust / Soroban smart contract. Contains the on-chain VacciChain contract that enforces soulbound rules, issuer authorization, and vaccination record integrity on the Stellar network. |
| `frontend/` | Service | React / Vite single-page application. Provides the user-facing web interface for patients, issuers, admins, and public verifiers, including Freighter wallet integration and client-side routing. |
| `python-service/` | Service | Python / FastAPI analytics service. Aggregates vaccination statistics, runs scheduled anomaly detection, and exposes analytics endpoints; reads exclusively from the Backend's data layer. |
| `infra/` | Infrastructure | Terraform infrastructure-as-code for cloud deployments. Contains two sub-directories with distinct concerns: `infra/envs/` holds per-environment variable definitions (each environment is an independently navigable deployment target), and `infra/modules/` holds reusable Terraform modules shared across environments. |
| `docs/` | Documentation | Markdown reference documentation, architecture decision records (ADRs), security notes, and operational guides for contributors and maintainers. |
| `monitoring/` | Tooling — observability stack | Prometheus, Grafana, and Alertmanager configuration files for metrics collection and dashboarding. Not deployed as an application service; provides the observability layer for the running stack. |
| `logging/` | Tooling — log aggregation stack | Loki, Promtail, and Grafana configuration files for log aggregation and querying. Not deployed as an application service; provides centralized log collection for the running stack. |
| `nginx/` | Tooling — reverse proxy | Nginx reverse-proxy configuration for the local Docker Compose development stack. Not deployed as a standalone service; routes traffic between services in the local environment. |
| `scripts/` | Tooling — local development scripts | Helper scripts for local development tasks (e.g., database seeding, environment setup). **Not deployed.** Tooling category: local development automation. |
| `tests/` | Tooling — cross-service testing | Placeholder and scaffolding for cross-service and end-to-end tests that span multiple services. **Not deployed.** Tooling category: integration and E2E test infrastructure. |
| `backup/` | Tooling — database backup | Database backup container definition and associated scripts for scheduled backups. **Not deployed** as an application service. Tooling category: data backup and recovery. |
| `staging/` | Tooling — staging deployment | ECS task definition and configuration for the staging environment. **Not deployed** as runtime application code; it is a deployment descriptor used by CI/CD. Tooling category: staging environment configuration. |
| `.github/` | Tooling — CI/CD | GitHub Actions workflow definitions, issue templates, and the pull request template. **Not deployed.** Tooling category: CI/CD pipelines and repository automation. |
| `.kiro/` | Tooling — AI spec files | Kiro AI specification files, including feature requirements, design documents, and implementation plans. **Not deployed.** Tooling category: AI-assisted development tooling. |
| `.vscode/` | Tooling — editor configuration | Visual Studio Code workspace settings and recommended extension configuration. **Not deployed.** Tooling category: editor configuration. |

---

## Key Files by Service

### Backend (`backend/src/`)

#### Routes (`backend/src/routes/`)

Each route file owns a distinct HTTP domain. Test files follow the co-location convention `*.test.js` and are placed alongside their source files; the guide lists source files only.

| File | HTTP Domain |
|---|---|
| `auth.js` | SEP-10 authentication — challenge generation (`POST /auth/sep10`) and signed-transaction verification plus JWT issuance (`POST /auth/verify`). |
| `vaccination.js` | Vaccination record issuance (`POST /vaccination/issue`), revocation (`POST /vaccination/revoke`), and paginated retrieval (`GET /vaccination/:wallet`). |
| `patient.js` | Patient self-registration into the on-chain allowlist (`POST /patient/register`). |
| `verify.js` | Public vaccination status verification (`GET /verify/:wallet`), accepting either a JWT or a verifier API key. |
| `admin.js` | Admin-only operations: issuer management, audit log query, API key lifecycle, JWT key rotation, and multi-sig proposal management. |
| `consent.js` | Patient consent recording (`POST /patient/consent`) and status query (`GET /patient/consent/:wallet`). |
| `events.js` | Paginated query of indexed on-chain events (`GET /events`). |
| `onboarding.js` | Issuer onboarding application submission, listing, and admin review with multi-sig enforcement. |

#### Middleware (`backend/src/middleware/`)

| File | Concern |
|---|---|
| `auth.js` | JWT verification with key-rotation support — populates `req.user` for downstream handlers. |
| `issuer.js` | Issuer role enforcement — checks the JWT role and verifies on-chain authorization via `issuerCache`. |
| `auditLog.js` | Append-only NDJSON audit log — provides the `audit()` write helper and `queryAuditLog()` read helper. |
| `bruteForce.js` | Brute-force protection for `/auth/verify` — tracks failed attempts per IP and wallet, blocks after a configurable threshold. |
| `idempotency.js` | Idempotency key support — caches responses for 24 hours keyed by the `Idempotency-Key` request header. |
| `multiSig.js` | M-of-N multi-signature enforcement for critical admin operations — handles proposal creation, approval tracking, and expiry. |
| `rateLimiter.js` | Per-route rate limiting — separate limiters for SEP-10, verify, and verifier API key callers. |
| `sanitize.js` | Input sanitization — strips HTML tags, control characters, and null bytes from `req.body`, `req.query`, and `req.params`. |
| `securityHeaders.js` | HTTP security headers — sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-XSS-Protection`, `Content-Security-Policy`, and `Permissions-Policy`. |
| `validate.js` | Zod schema validation middleware factory — parses request bodies and strips unknown fields. |
| `verifierApiKey.js` | Verifier API key authentication — validates the `X-API-Key` header against the hashed key store. |
| `wallet.js` | Stellar public key format validation for route parameters and body fields. |
| `apiVersion.js` | API versioning — adds the `API-Version` response header and `Deprecation`/`Sunset` headers for sunset versions. |
| `requestId.js` | Request ID propagation — generates or forwards the `X-Request-ID` header for distributed tracing. |

#### Stellar Integration (`backend/src/stellar/`)

| File | Role |
|---|---|
| `sep10.js` | SEP-10 challenge construction (`buildChallenge`) and signed-transaction verification (`verifyChallenge`) per SEP-10 v3.4.1. |
| `soroban.js` | Soroban RPC client — `invokeContract` (state-changing calls with signing and polling), `simulateContract` (read-only calls), and `mintVaccination`, `verifyVaccination`, `addIssuer` helpers. |
| `contractErrors.js` | Contract error code mapping — translates Soroban XDR error codes to human-readable messages. |
| `issuerCache.js` | Short-lived (30 s) in-memory cache for on-chain issuer authorization checks, reducing RPC calls on every minting request. |
| `nonceStore.js` | Single-use, TTL-bound nonce store for SEP-10 challenge replay protection. |

---

### Smart Contract (`contracts/src/`)

All test modules use the `#[cfg(test)]` convention and are compiled only during `cargo test`; the guide notes this inline convention rather than listing individual test functions.

| File | Role |
|---|---|
| `lib.rs` | Contract entry point — declares the `VacciChainContract` struct, all public contract functions, the `ContractError` enum, and inline unit tests (`#[cfg(test)]` module). |
| `mint.rs` | Vaccination minting logic — issuer authorization check, patient allowlist check, duplicate detection, deterministic token ID computation, and record persistence. |
| `storage.rs` | On-chain storage schema — `VaccinationRecord`, `IssuerRecord`, and `DataKey` enum definitions; `compute_token_id` hash function. |
| `events.rs` | Contract event emission helpers — `emit_minted`, `emit_revoked`, `emit_issuer_added`, `emit_patient_registered`, `emit_contract_upgraded`, and related functions. |
| `verify.rs` | Vaccination verification logic — `verify_vaccination` (single wallet), `batch_verify` (up to 100 wallets), and `DoseStatus` dose-completion summary. |
| `fuzz_tests.rs` | Fuzz test module (`#[cfg(test)]`) — property-based fuzz inputs for contract functions. |
| `property_tests.rs` | Property-based test module (`#[cfg(test)]`) — universal correctness properties for contract invariants. |
| `security_invariant_tests.rs` | Security invariant test module (`#[cfg(test)]`) — tests that enforce soulbound, authorization, and integrity invariants. |
| `upgrade_tests.rs` | Contract upgrade test module (`#[cfg(test)]`) — tests for the WASM upgrade path. |

---

### Frontend (`frontend/src/`)

#### Pages (`frontend/src/pages/`)

Test files follow the co-location convention `*.test.jsx` — one test file per page, named `<PageName>.test.jsx`. The guide lists source files only.

| File | User Role / Primary Action |
|---|---|
| `Landing.jsx` | All users — project overview and Freighter wallet connection entry point. |
| `PatientDashboard.jsx` | Patients — view all vaccination NFTs held in the connected wallet with pagination, QR code generation, and consent management. |
| `IssuerDashboard.jsx` | Authorized issuers — fill and submit the vaccination issuance form to mint an NFT to a patient wallet. |
| `AdminDashboard.jsx` | Admins — manage verifier API keys and review/approve issuer onboarding applications. |
| `AnalyticsDashboard.jsx` | Authorized issuers — view vaccination rates, issuer activity statistics, and anomaly flags with auto-refresh. |
| `VerifyPage.jsx` | Public / verifiers — enter any Stellar wallet address and retrieve its on-chain vaccination status. |
| `IssuerOnboarding.jsx` | Healthcare providers — submit an onboarding application to request issuer authorization. |

#### Hooks (`frontend/src/hooks/`)

| File | State / Side-Effect |
|---|---|
| `useFreighter.jsx` | Wallet connection state — wraps the Freighter API for `connect`/`disconnect`, runs the SEP-10 auth flow, stores the JWT and role, and exposes `apiFetch` with automatic token refresh. |
| `useVaccination.js` | Vaccination API calls — `fetchRecords` (GET records for a wallet) and `issueVaccination` (POST to mint), with loading state and toast notifications. |
| `useConsent.js` | Patient consent state — `checkConsent` (GET status) and `giveConsent` (POST), with loading state. |
| `useDarkMode.js` | Dark mode preference — persists to `localStorage` and syncs with the `prefers-color-scheme` media query. |
| `usePagination.js` | Client-side pagination state — slices an items array by page and page size, exposes `goTo` and `reset`. |
| `useToast.jsx` | Toast notification queue — provides a `toast(message, type)` function that auto-dismisses after 4 seconds. |

---

### Analytics Service (`python-service/`)

#### Top-Level Files

| File | Responsibility |
|---|---|
| `main.py` | FastAPI application factory — registers routers, configures structured logging, attaches rate limiting, and manages the APScheduler lifecycle via `lifespan`. |
| `auth.py` | Authentication dependency — `require_analytics_auth` FastAPI dependency that accepts either an `X-API-Key` header or a Bearer JWT with `role == 'issuer'`. |
| `scheduler.py` | Scheduled anomaly detection — APScheduler job that runs `anomaly_detection()` on a configurable interval and dispatches alerts for flagged issuers. |
| `schemas.py` | Pydantic request/response models — `BatchVerifyRequest`, `BatchVerifyResponse`, `WalletResult`, `IssuerStat`, `AnomalyResponse`, and `HealthResponse`. |
| `alerting.py` | Webhook alert dispatch — `dispatch_alerts` sends one HTTP POST per flagged issuer to a configured Slack, PagerDuty, or email webhook. |
| `gunicorn.conf.py` | Gunicorn production server configuration — sets `UvicornWorker`, worker count (`cpu_count * 2 + 1`), timeout, and bind address. |

#### Routes (`python-service/routes/`)

| File | Responsibility |
|---|---|
| `analytics.py` | Analytics endpoints — `GET /analytics/rates`, `GET /analytics/issuers`, `GET /analytics/anomalies`; reads from the Backend's `/events` API. |
| `batch.py` | Batch verification endpoint — `POST /batch/verify` accepts up to 100 wallet addresses and returns vaccination status for each by proxying to the Backend. |

---

## Separation of Concerns

Each of the four services owns a distinct domain of responsibility. Logic must not be duplicated across service boundaries; if you are unsure which service should own a new piece of logic, consult this section.

### Domain Ownership

**Backend (Node.js / Express)**
The Backend is the sole owner of JWT issuance, SEP-10 challenge handling, Soroban contract invocation on behalf of authenticated users, and on-chain event indexing (polling and storing contract events into the Backend's data layer). All business logic that requires authentication context or contract interaction flows through the Backend.

**Smart Contract (Rust / Soroban)**
The Smart Contract is the sole enforcer of soulbound rules, issuer authorization, and on-chain record integrity. No other service may bypass the contract to write vaccination records directly to the Stellar ledger. The contract is the single source of truth for what records exist and which issuers are authorized.

**Analytics Service (Python / FastAPI)**
The Analytics Service is the sole owner of aggregated statistics, anomaly detection, and scheduled reporting. It reads exclusively from the Backend's data layer (via the Backend's `/events` API) rather than directly from the Smart Contract or the Frontend. It must not invoke Soroban RPC calls or hold JWT issuance logic.

**Frontend (React / Vite)**
The Frontend is the sole owner of wallet connection (Freighter), user-facing rendering, and client-side routing. It must not invoke Soroban RPC calls directly, must not call the Analytics Service directly, and must not implement business logic that belongs to the Backend (e.g., JWT issuance, SEP-10 challenge construction).

### Cross-Service Interaction Table

| Interaction | Status | Notes |
|---|---|---|
| Frontend → Backend API | **Permitted** | All authenticated and public API calls from the UI go through the Backend REST API. |
| Frontend → Smart Contract directly | **Prohibited** | The Frontend must not invoke Soroban RPC calls directly; all contract interactions are mediated by the Backend. |
| Frontend → Analytics Service directly | **Prohibited** | The Frontend must not call the Analytics Service directly; analytics data is surfaced through the Backend or dedicated analytics endpoints accessed via the Backend. |
| Backend → Smart Contract via Soroban SDK | **Permitted** | The Backend is the authorized caller of the Soroban contract for state-changing operations (mint, revoke, add issuer, register patient). |
| Analytics Service → Backend data layer | **Permitted** | The Analytics Service reads from the Backend's `/events` API to compute statistics and detect anomalies. |
| Analytics Service → Smart Contract directly | **Prohibited** | The Analytics Service must not invoke Soroban RPC calls directly; it reads only from the Backend's indexed data. |

---

## Keeping This Guide Up to Date

This guide is maintained manually. It must be updated in the same pull request that introduces the structural change — do not merge a PR that adds a new directory or key file without updating this document first.

**File to update:** `docs/folder-structure.md`

**Responsible parties:**
- Backend maintainers — for changes under `backend/`
- Frontend maintainers — for changes under `frontend/`
- Smart Contract maintainers — for changes under `contracts/`
- Analytics Service maintainers — for changes under `python-service/`
- Any contributor — for changes to top-level directories or cross-cutting tooling directories

**Last reviewed:** 2025-07-27
