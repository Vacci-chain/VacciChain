# Implementation Plan: Folder Structure Guide

## Overview

This plan creates the `docs/folder-structure.md` guide, updates `README.md` to link to it, updates `.github/pull_request_template.md` with the maintenance checklist item, and writes a Node.js test suite (using `fast-check`) that verifies all coverage properties and structural requirements.

## Tasks

- [x] 1. Create `docs/folder-structure.md` with all required sections
  - Create the `docs/` directory if it does not already exist
  - Write the Introduction / preamble paragraph
  - Write the Top-Level Directory Reference section — one entry per directory listed in the design's content inventory, including hidden dot-directories; each entry must include a purpose statement naming the technology stack or tooling and the role it plays; tooling-only directories must explicitly state they are not deployed and identify their tooling category
  - Write the Key Files by Service section with sub-sections for Backend (routes, middleware, stellar), Smart Contract (`contracts/src/`), Frontend (pages, hooks), and Analytics Service (`python-service/` top-level files and `routes/`)
  - Write the Separation of Concerns section — domain ownership for all four services plus the cross-service interaction table labeling each interaction as permitted or prohibited
  - Write the Keeping This Guide Up to Date section — names `docs/folder-structure.md`, lists responsible parties, and includes the last-reviewed date in `YYYY-MM-DD` format
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.3, 5.1, 5.4_

- [x] 2. Update `README.md` — add Folder Structure Guide link
  - In the Architecture section of `README.md`, add the sentence: `See the [Folder Structure Guide](docs/folder-structure.md) for detailed descriptions of every directory and key file.`
  - _Requirements: 4.2_

- [x] 3. Update `.github/pull_request_template.md` — add maintenance checklist item
  - Append the following checklist item to the Checklist section of `.github/pull_request_template.md`: `- [ ] If this PR adds a new directory or key file, I have updated \`docs/folder-structure.md\`.`
  - _Requirements: 5.5_

- [x] 4. Set up the test suite for guide coverage verification
  - [x] 4.1 Create `tests/folder-structure-guide/` directory and initialise the test file `guide.test.js`
    - Add `fast-check` as a dev dependency in `backend/package.json` (or a root-level `package.json` if one exists for cross-service tests); confirm the existing test runner (Jest/Vitest) is available
    - Create `tests/folder-structure-guide/guide.test.js` with shared helpers: `readGuide()` (reads `docs/folder-structure.md` as a UTF-8 string) and `listFiles(dir, opts)` (reads a directory and returns filenames)
    - _Requirements: 4.1_

  - [ ]* 4.2 Write smoke tests — file existence
    - Verify `docs/folder-structure.md` exists at the correct path
    - Verify the `docs/` directory exists
    - _Requirements: 4.1, 4.3_

  - [ ]* 4.3 Write unit test — README link
    - Verify `README.md` contains a markdown link with text `Folder Structure Guide` pointing to `docs/folder-structure.md`
    - _Requirements: 4.2_

  - [ ]* 4.4 Write unit test — PR template checklist item
    - Verify `.github/pull_request_template.md` contains the exact text `If this PR adds a new directory or key file, I have updated \`docs/folder-structure.md\``
    - _Requirements: 5.5_

  - [ ]* 4.5 Write unit tests — structural sections
    - Verify `docs/folder-structure.md` contains a "Keeping This Guide Up to Date" section
    - Verify `docs/folder-structure.md` contains a date matching the `YYYY-MM-DD` pattern
    - Verify `docs/folder-structure.md` contains a "Separation of Concerns" section with all four service names (Backend, Smart Contract, Analytics Service, Frontend)
    - For each known tooling-only directory (`.github/`, `scripts/`, `.vscode/`, `.kiro/`), verify the guide contains language indicating it is not deployed
    - _Requirements: 3.1, 5.1, 5.4_

- [ ] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Write property-based tests for file coverage (Properties 1–8)
  - [ ] 6.1 Write property test for top-level directory coverage
    - **Property 1: Top-level directory coverage**
    - Use `fc.constantFrom(...dirs)` over the actual top-level directories enumerated from the repository root
    - Assert each directory name appears in `docs/folder-structure.md`
    - **Validates: Requirements 1.1**

  - [ ]* 6.2 Write property test for backend route file coverage
    - **Property 2: Backend route file coverage**
    - Use `fc.constantFrom(...files)` over files in `backend/src/routes/`
    - Assert each filename appears in `docs/folder-structure.md`
    - **Validates: Requirements 2.1**

  - [ ]* 6.3 Write property test for backend middleware file coverage
    - **Property 3: Backend middleware file coverage**
    - Use `fc.constantFrom(...files)` over files in `backend/src/middleware/`
    - Assert each filename appears in `docs/folder-structure.md`
    - **Validates: Requirements 2.2**

  - [ ]* 6.4 Write property test for backend Stellar integration file coverage
    - **Property 4: Backend Stellar integration file coverage**
    - Use `fc.constantFrom(...files)` over files in `backend/src/stellar/`
    - Assert each filename appears in `docs/folder-structure.md`
    - **Validates: Requirements 2.3**

  - [ ]* 6.5 Write property test for smart contract source file coverage
    - **Property 5: Smart contract source file coverage**
    - Use `fc.constantFrom(...files)` over files in `contracts/src/`
    - Assert each filename appears in `docs/folder-structure.md`
    - **Validates: Requirements 2.4**

  - [ ]* 6.6 Write property test for frontend page file coverage
    - **Property 6: Frontend page file coverage**
    - Use `fc.constantFrom(...files)` over non-test files in `frontend/src/pages/` (exclude `*.test.jsx`)
    - Assert each filename appears in `docs/folder-structure.md`
    - **Validates: Requirements 2.5**

  - [ ]* 6.7 Write property test for frontend hook file coverage
    - **Property 7: Frontend hook file coverage**
    - Use `fc.constantFrom(...files)` over files in `frontend/src/hooks/`
    - Assert each filename appears in `docs/folder-structure.md`
    - **Validates: Requirements 2.6**

  - [ ]* 6.8 Write property test for analytics service file coverage
    - **Property 8: Analytics service file coverage**
    - Use `fc.constantFrom(...files)` over the fixed set `{main.py, auth.py, scheduler.py, schemas.py, alerting.py, gunicorn.conf.py}` plus files under `python-service/routes/`
    - Assert each filename appears in `docs/folder-structure.md`
    - **Validates: Requirements 2.7**

- [ ] 7. Write property-based tests for cross-service interaction and domain keyword coverage (Properties 9–10)
  - [ ] 7.1 Write property test for cross-service interaction coverage
    - **Property 9: Cross-service interaction coverage**
    - Use `fc.constantFrom` over the six interaction pairs: `{Frontend→Backend, Frontend→Smart Contract, Frontend→Analytics, Backend→Smart Contract, Analytics→Backend, Analytics→Smart Contract}`
    - Assert each interaction pair appears in the guide and is labeled "permitted" or "prohibited"
    - **Validates: Requirements 3.6**

  - [ ]* 7.2 Write property test for service domain keyword coverage
    - **Property 10: Service domain keyword coverage**
    - Use `fc.constantFrom` over the required domain keywords for each service as specified in Requirements 3.2–3.5 (e.g., "JWT issuance", "SEP-10", "soulbound", "issuer authorization", "aggregated statistics", "anomaly detection", "Freighter", "client-side routing")
    - Assert each keyword appears in the Separation of Concerns section of `docs/folder-structure.md`
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

- [ ] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The guide itself (Task 1) is the primary deliverable; Tasks 2 and 3 are small, targeted file edits
- Task 4.1 must complete before any test sub-tasks in Tasks 4–7 can run
- Property tests use `fc.constantFrom` over finite filesystem-enumerated sets, making them effectively exhaustive despite the `numRuns: 100` configuration
- Each property test follows the pattern: enumerate files from disk → `fc.constantFrom(...files)` → assert filename in guide content
- The test suite should be run from the repository root so that relative paths (`docs/folder-structure.md`, `backend/src/routes/`, etc.) resolve correctly

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2", "3", "4.1"] },
    { "id": 2, "tasks": ["4.2", "4.3", "4.4", "4.5"] },
    { "id": 3, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8"] },
    { "id": 4, "tasks": ["7.1", "7.2"] }
  ]
}
```
