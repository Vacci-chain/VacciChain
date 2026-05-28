# VacciChain Roadmap

This document expands on the milestones listed in the README with success criteria, dependencies, and issue triage guidance.

---

## Milestones

### v0.1 — Testnet MVP
**Target:** 2026-06-30  
**Focus:** Core contract, backend, frontend, CI

#### Scope
- Soroban smart contract: `mint_vaccination`, `verify_vaccination`, `add_issuer`, `revoke_issuer`, soulbound transfer block
- Backend REST API: SEP-10 auth, vaccination issue/fetch, public verify endpoint
- Frontend: Landing, Patient Dashboard, Issuer Dashboard, Verification Page
- Freighter wallet integration and SEP-10 flow
- Docker Compose stack (all services)
- GitHub Actions CI pipeline with contract, backend, and Python tests

#### Success Criteria
- [ ] Contract deploys to Stellar Testnet and all functions pass unit tests
- [ ] SEP-10 challenge/verify flow issues a valid JWT
- [ ] Authorized issuer can mint a vaccination record; patient wallet reflects it
- [ ] Transfer attempt on a soulbound token is reverted by the contract
- [ ] Public `/verify/:wallet` returns correct status without authentication
- [ ] `docker compose up --build` starts all services with no manual steps
- [ ] CI passes on every pull request to `main`

#### Dependencies
- None — this is the foundation milestone.

---

### v0.2 — Security Hardening
**Target:** 2026-09-30  
**Focus:** Auth hardening, audit, onboarding

#### Scope
- Third-party security audit of the Soroban contract and backend auth layer
- Remediation of all critical and high findings from the audit
- Secret scanning pre-commit hooks (Gitleaks) and CI enforcement
- Comprehensive security headers (CSP, X-Frame-Options, MIME sniffing protection)
- Rate limiting on SEP-10 and verify endpoints
- Append-only NDJSON audit log for all issuer actions
- Anomaly detection in the analytics service with configurable alerting (Slack / PagerDuty / email)
- Developer onboarding documentation and contribution guide

#### Success Criteria
- [ ] Audit report received; all critical/high findings resolved and re-verified
- [ ] Gitleaks hook blocks commits containing Stellar secret keys or JWT secrets
- [ ] Security headers score A or above on [securityheaders.com](https://securityheaders.com)
- [ ] Rate limits enforced and returning `429` under load test
- [ ] Audit log written for every mint and revoke action
- [ ] Anomaly alert fires when an issuer exceeds `ANOMALY_THRESHOLD` mints in the detection window
- [ ] New contributor can set up the project and run all tests following the README alone

#### Dependencies
- Requires v0.1 to be complete and stable on Testnet.

---

### v1.0 — Mainnet Launch
**Target:** 2026-12-31  
**Focus:** Production deployment, compliance

#### Scope
- Mainnet contract deployment with audited and hardened contract code
- Production infrastructure on AWS ECS Fargate with staging environment parity
- Automated staging deployment on merge to `main` via GitHub Actions
- Environment variable validation at backend startup
- Compliance review for relevant healthcare data regulations
- Public demo environment with weekly reset schedule
- Full end-to-end test suite covering the mainnet flow

#### Success Criteria
- [ ] Contract deployed to Stellar Mainnet; contract ID published in documentation
- [ ] Staging environment at `https://staging.vaccichain.example.com` auto-deploys on merge to `main`
- [ ] Backend exits with a clear error on startup if any required env variable is missing or malformed
- [ ] End-to-end tests pass against the staging environment before every mainnet release
- [ ] Compliance review completed and findings documented
- [ ] Zero critical security findings open at time of launch

#### Dependencies
- Requires v0.2 audit remediation to be complete.
- Mainnet deployment keys and contract ID must be provisioned before the release cut.

---

## Issue Triage

Issues are labelled and prioritized as follows:

| Priority | Label | Criteria | Target Response |
|----------|-------|----------|-----------------|
| Critical | `priority: critical` | Security vulnerability, data loss, or mainnet blocker | Same day |
| High | `priority: high` | Blocks a milestone success criterion | Within 3 days |
| Medium | `priority: medium` | Degrades functionality but has a workaround | Current or next milestone |
| Low | `priority: low` | Docs, polish, non-blocking improvements | Backlog |

**Triage process:**
1. New issues are triaged within 48 hours of opening.
2. Assign a milestone label (`v0.1`, `v0.2`, `v1.0`, or `backlog`) and a priority label.
3. Critical and high issues block the milestone they are assigned to — the milestone cannot ship until they are resolved.
4. Issues without enough information to reproduce are labelled `needs-info` and closed after 14 days of no response.
