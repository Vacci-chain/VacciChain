# Requirements Document

## Introduction

New contributors to VacciChain need a clear, authoritative reference that explains what every directory and key file is responsible for. The existing README architecture section provides a high-level tree but does not describe the purpose of individual files, the separation of concerns between services, or the conventions contributors should follow when adding new code. This feature expands that section into a dedicated `docs/folder-structure.md` guide that is maintained alongside the codebase.

## Glossary

- **Guide**: The `docs/folder-structure.md` file that is the subject of this feature.
- **Top-level Directory**: Any directory that appears directly under the repository root (e.g., `backend/`, `frontend/`, `contracts/`, `python-service/`, `infra/`, `docs/`, `monitoring/`, `logging/`, `nginx/`, `scripts/`, `tests/`, `.github/`).
- **Key File**: A source file whose role is not obvious from its name alone, including but not limited to route handlers, middleware modules, helper utilities, configuration entry points, and contract modules. For maintenance purposes, a key file is any file added directly inside a service's top-level subdirectory (one level below the service root).
- **Service**: One of the four independently deployable units — Backend (Node.js/Express), Frontend (React/Vite), Analytics Service (Python/FastAPI), and Smart Contract (Rust/Soroban).
- **Contributor**: Any developer who clones the repository and intends to read, modify, or extend the codebase.
- **Separation of Concerns**: The architectural principle that each Service owns a distinct domain of responsibility and does not duplicate logic owned by another Service.
- **Maintenance Trigger**: Any pull request that adds a new top-level directory or a new key file to an existing service.

---

## Requirements

### Requirement 1: Top-Level Directory Coverage

**User Story:** As a new contributor, I want every top-level directory described in one place, so that I can orient myself in the repository without reading multiple READMEs.

#### Acceptance Criteria

1. THE Guide SHALL contain a dedicated section that lists every top-level directory present in the repository at the time of writing, including hidden dot-directories (e.g., `.github/`, `.vscode/`) that contain files relevant to contributors.
2. WHEN a top-level directory is listed, THE Guide SHALL include a purpose statement of at least one complete sentence that names the technology stack or tooling the directory contains and the role it plays in the project.
3. WHEN a top-level directory contains sub-directories that represent distinct concerns (where "distinct concerns" means each sub-directory is independently navigable and serves a different audience or deployment target, e.g., `infra/modules/` vs. `infra/envs/`), THE Guide SHALL describe each such sub-directory separately with its own purpose statement.
4. IF a top-level directory is tooling-only — meaning it contains no runtime application code and is not deployed as part of any service (e.g., `.github/`, `scripts/`) — THEN THE Guide SHALL explicitly state that it is not deployed and identify the tooling category it belongs to (e.g., CI/CD, local development scripts, editor configuration).

---

### Requirement 2: Key File Descriptions Within Each Service

**User Story:** As a new contributor, I want to know what each important file inside a service does, so that I can find the right file to edit without reading all the source code.

#### Acceptance Criteria

1. THE Guide SHALL describe every file under `backend/src/routes/` with its HTTP domain (e.g., "SEP-10 authentication", "vaccination record issuance"). Each description SHALL include at minimum the file name and a one-sentence role statement.
2. THE Guide SHALL describe every file under `backend/src/middleware/` with the concern it enforces (e.g., "JWT verification", "rate limiting", "request sanitisation"). Each description SHALL include at minimum the file name and a one-sentence role statement.
3. THE Guide SHALL describe every file under `backend/src/stellar/` with its role in Stellar/Soroban integration. Each description SHALL include at minimum the file name and a one-sentence role statement.
4. THE Guide SHALL describe every file under `contracts/src/` with its role in the Soroban smart contract (e.g., minting logic, storage schema, event emission). Each description SHALL include at minimum the file name and a one-sentence role statement. IF a file contains Rust unit tests (e.g., a `#[cfg(test)]` module), THE Guide SHALL note that inline test convention rather than listing each test function individually.
5. THE Guide SHALL describe every file under `frontend/src/pages/` with the user role it serves and the primary action it enables. Each description SHALL include at minimum the file name and a one-sentence role statement.
6. THE Guide SHALL describe every file under `frontend/src/hooks/` with the state or side-effect it encapsulates. Each description SHALL include at minimum the file name and a one-sentence role statement.
7. THE Guide SHALL describe the following top-level files in `python-service/`: `main.py`, `auth.py`, `scheduler.py`, `schemas.py`, `alerting.py`, and `gunicorn.conf.py`, and each file under `python-service/routes/`, with its responsibility. Each description SHALL include at minimum the file name and a one-sentence role statement.
8. IF a file is a JavaScript or JSX test file co-located with source (matching the pattern `*.test.js` or `*.test.jsx`), THEN THE Guide SHALL note the co-location convention for that service rather than listing each test file individually.

---

### Requirement 3: Separation of Concerns Between Services

**User Story:** As a new contributor, I want to understand which service owns which domain of logic, so that I add new code to the correct service and avoid duplicating logic.

#### Acceptance Criteria

1. THE Guide SHALL contain a dedicated "Separation of Concerns" section that maps all four Services — Backend, Smart Contract, Analytics Service, and Frontend — each to its exclusive domain of responsibility.
2. WHEN describing the Backend service's domain, THE Guide SHALL state that the Backend is the sole owner of JWT issuance, SEP-10 challenge handling, Soroban contract invocation on behalf of authenticated users, and on-chain event indexing (polling and storing contract events into the Backend's data layer).
3. WHEN describing the Smart Contract's domain, THE Guide SHALL state that the Smart Contract is the sole enforcer of soulbound rules, issuer authorization, and on-chain record integrity.
4. WHEN describing the Analytics Service's domain, THE Guide SHALL state that the Analytics Service is the sole owner of aggregated statistics, anomaly detection, and scheduled reporting, and that it reads exclusively from the Backend's data layer rather than directly from the Smart Contract or Frontend.
5. WHEN describing the Frontend's domain, THE Guide SHALL state that the Frontend is the sole owner of wallet connection (Freighter), user-facing rendering, and client-side routing.
6. THE Guide SHALL include a table or list that explicitly enumerates the following cross-service interactions, labeling each as permitted or prohibited:
   - Frontend → Backend API (permitted)
   - Frontend → Smart Contract directly (prohibited)
   - Frontend → Analytics Service directly (prohibited)
   - Backend → Smart Contract via Soroban SDK (permitted)
   - Analytics Service → Backend data layer (permitted)
   - Analytics Service → Smart Contract directly (prohibited)

---

### Requirement 4: Guide Storage Location

**User Story:** As a contributor, I want the folder structure guide stored in a predictable location, so that I can find it without searching.

#### Acceptance Criteria

1. THE Guide SHALL be stored at the path `docs/folder-structure.md` relative to the repository root.
2. THE Guide SHALL be linked from the root `README.md` Architecture section using a markdown hyperlink with the link text "Folder Structure Guide". IF the root `README.md` does not contain an Architecture section at the time of guide creation, THEN the link SHALL be added to the most prominent navigational section present.
3. IF the `docs/` directory does not exist at the time of guide creation, THEN the system SHALL create it before writing `docs/folder-structure.md`.

---

### Requirement 5: Guide Maintenance on Structural Changes

**User Story:** As a maintainer, I want the guide to stay accurate when the project structure changes, so that new contributors are never misled by stale documentation.

#### Acceptance Criteria

1. THE Guide SHALL include a "Keeping This Guide Up to Date" section that names `docs/folder-structure.md` as the file to update and identifies the Backend, Frontend, Smart Contract, and Analytics Service maintainers as the responsible parties for keeping it current.
2. WHEN a pull request adds a new top-level directory, `docs/folder-structure.md` SHALL be updated in the same pull request before merging, such that the new directory is named and described in the guide.
3. WHEN a pull request adds a new key file to an existing service, `docs/folder-structure.md` SHALL be updated in the same pull request before merging, such that the new file is named and described in the guide.
4. THE Guide SHALL include the date it was last reviewed in the format `YYYY-MM-DD` so that contributors can assess its freshness.
5. WHERE the project uses a pull request template (`.github/pull_request_template.md`), THE pull request template SHALL include a checklist item with the exact text: "If this PR adds a new directory or key file, I have updated `docs/folder-structure.md`."
