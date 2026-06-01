# Contributing to VacciChain

Thank you for your interest in contributing. This guide covers everything you need to go from zero to a merged pull request.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Fork and Clone](#fork-and-clone)
  - [Environment Setup](#environment-setup)
  - [Secret Scanning Protection](#secret-scanning-protection)
- [Branching Strategy](#branching-strategy)
- [Commit Conventions](#commit-conventions)
- [Code Style and Linting](#code-style-and-linting)
- [Running Tests](#running-tests)
- [Pull Request Process](#pull-request-process)
- [Branch Protection Rules](#branch-protection-rules)
- [Docker Base Image Pinning](#docker-base-image-pinning)

---

## Code of Conduct

We are committed to a welcoming and inclusive community. All contributors are expected to:

- Use respectful and inclusive language
- Accept constructive criticism gracefully
- Focus on what is best for the project and its users
- Show empathy toward other community members

Unacceptable behavior includes harassment, discrimination, intimidation, offensive comments related to personal characteristics, and unwelcome sexual attention. Report violations to the maintainers by opening a private issue or emailing the project contact. All reports will be reviewed and investigated promptly.

---

## Reporting Bugs

Use the **Bug Report** issue template on GitHub:

1. Go to [Issues → New Issue](../../issues/new/choose)
2. Select **Bug Report**
3. Fill in the description, steps to reproduce, expected vs. actual behavior, and your environment (OS, Node.js version, Docker version, etc.)
4. Attach relevant logs or screenshots

Before opening a new bug report, search existing issues to avoid duplicates. If you find an open issue that matches, add a comment with any additional context rather than opening a new one.

---

## Requesting Features

Use the **Feature Request** issue template on GitHub:

1. Go to [Issues → New Issue](../../issues/new/choose)
2. Select **Feature Request**
3. Describe the problem you are trying to solve, your proposed solution, and any alternatives you considered
4. Fill in the acceptance criteria so reviewers know when the feature is complete

---

## Getting Started

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18+ |
| Python | 3.11+ |
| Rust | stable (latest) |
| `wasm32-unknown-unknown` target | — |
| Soroban CLI | latest |
| Docker + Docker Compose | — |
| Freighter Wallet | — (for manual testing) |

### Fork and Clone

External contributors must work from a fork. Do **not** push branches directly to the upstream repository.

```bash
# 1. Fork the repository on GitHub (click "Fork" in the top-right corner)

# 2. Clone your fork
git clone https://github.com/<your-username>/VacciChain.git
cd VacciChain

# 3. Add the upstream remote so you can pull future changes
git remote add upstream https://github.com/dev-fatima-24/VacciChain.git

# 4. Verify your remotes
git remote -v
# origin    https://github.com/<your-username>/VacciChain.git (fetch)
# origin    https://github.com/<your-username>/VacciChain.git (push)
# upstream  https://github.com/dev-fatima-24/VacciChain.git (fetch)
# upstream  https://github.com/dev-fatima-24/VacciChain.git (push)
```

To keep your fork up to date before starting new work:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### Environment Setup

```bash
# Copy and fill in environment variables
cp .env.example .env
# Edit .env — at minimum set STELLAR_NETWORK, SOROBAN_RPC_URL,
# VACCINATIONS_CONTRACT_ID, ADMIN_SECRET_KEY, SEP10_SERVER_KEY,
# ISSUER_SECRET_KEY, and JWT_SECRET

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install Python service dependencies
cd python-service && pip install -r requirements.txt && cd ..

# (Optional) Deploy the smart contract to testnet
cd contracts && make build && make deploy && cd ..
```

Run the full stack with Docker Compose:

```bash
docker compose up --build
# frontend  → http://localhost:3000
# backend   → http://localhost:4000
# analytics → http://localhost:8001
```

Or run each service individually:

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev

# Terminal 3 — Python analytics
cd python-service && uvicorn main:app --port 8001
```

### Secret Scanning Protection

VacciChain uses [Gitleaks](https://github.com/gitleaks/gitleaks) to prevent accidental commits of Stellar secret keys, JWT secrets, and other credentials. Install the pre-commit hook before making any commits:

```bash
# Linux / macOS
./scripts/setup-git-hooks.sh

# Windows
.\scripts\setup-git-hooks.ps1
```

The hook runs automatically on every `git commit`. If it fires, remove the detected secret, rotate it if it was ever pushed, and commit again. See [docs/secret-scanning-setup.md](docs/secret-scanning-setup.md) for full details.

> **Never commit real Stellar secret keys, JWT secrets, or API keys.** Use `.env` (which is gitignored) for all secrets. The `.env.example` file must only contain placeholder values.

---

## Branching Strategy

All work happens on feature branches. The `main` branch is protected — direct pushes are blocked.

### Branch naming

| Pattern | When to use |
|---------|-------------|
| `feature/<short-description>` | New features |
| `fix/<short-description>` | Bug fixes |
| `docs/<short-description>` | Documentation-only changes |
| `chore/<short-description>` | Tooling, dependencies, CI |
| `issues/<issue-numbers>` | When addressing one or more GitHub issues |

Examples: `feature/batch-verify-endpoint`, `fix/sep10-nonce-expiry`, `issues/77-79-82`

### Creating a branch

Always branch from an up-to-date `main`:

```bash
git fetch upstream          # or: git fetch origin (if you are a maintainer)
git checkout main
git merge upstream/main
git checkout -b feature/my-feature
```

---

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must match this format:

```
<type>(<scope>): <subject>

[optional body]

[optional footer — e.g. Closes #42]
```

### Types

| Type | Use for |
|------|---------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, whitespace — no logic change |
| `refactor` | Code restructuring without behavior change |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build, dependency, or tooling changes |

### Scope (optional)

Use the affected area: `backend`, `frontend`, `contracts`, `python-service`, `auth`, `vaccination`, `verify`, `analytics`, or an issue number like `#77`.

### Examples

```bash
git commit -m "feat(backend): add OpenAPI spec generation"
git commit -m "fix(#77): resolve swagger endpoint routing"
git commit -m "docs: add contributor onboarding guide"
git commit -m "test(contracts): add mint_vaccination edge-case tests"
git commit -m "chore: pin Node.js base image digest"
```

Keep the subject line under 72 characters. Use the body to explain *why*, not *what* — the diff shows what changed.

---

## Code Style and Linting

### JavaScript / Node.js (backend & frontend)

- Follow the existing code style in each file — indentation, quote style, and semicolons must be consistent with the surrounding code.
- Use `const` and `let`; never `var`.
- Prefer `async/await` over raw Promise chains.
- All route handlers must use the shared `validate` middleware (Zod schemas) for input validation.
- Do not introduce new dependencies without discussion in an issue first.

If a linter is configured in the project (`npm run lint`), run it before committing:

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

Fix all errors and warnings before opening a PR. Do not disable lint rules inline without a comment explaining why.

### Rust (contracts)

- Run `cargo fmt` before committing:
  ```bash
  cd contracts && cargo fmt
  ```
- Run `cargo clippy` and resolve all warnings:
  ```bash
  cd contracts && cargo clippy -- -D warnings
  ```

### Python (analytics service)

- Follow [PEP 8](https://peps.python.org/pep-0008/).
- Run `black` and `flake8` if they are available in the project:
  ```bash
  cd python-service
  black .
  flake8 .
  ```

### General

- Do not commit commented-out code.
- Remove debug `console.log` / `print` statements before opening a PR.
- Keep functions small and focused. If a function is hard to test, it is probably doing too much.
- Add JSDoc / docstring comments to public functions and non-obvious logic.

---

## Running Tests

Run the full test suite for every service you touched before opening a PR. All checks must pass.

### Backend

```bash
cd backend
npm test                  # run Jest suite (exits after one pass)
npm run test:coverage     # run with coverage — must meet 70% lines/functions/branches
```

The coverage gate is enforced in CI. If your changes drop coverage below 70% in any category, the build will fail. Add tests for any new code you introduce.

### Smart contracts

```bash
cd contracts
cargo test
```

### Python analytics service

```bash
cd python-service
pytest
```

### End-to-end tests

```bash
docker compose -f docker-compose.e2e.yml up --build --abort-on-container-exit
```

E2E tests run against the full Docker stack. They are also run automatically in CI on every PR.

---

## Pull Request Process

### Before submitting

1. Sync your branch with the latest `main` to avoid merge conflicts:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. Run all tests for the services you changed (see [Running Tests](#running-tests)).
3. Run linters and formatters (see [Code Style and Linting](#code-style-and-linting)).
4. Update documentation if your changes affect user-facing behavior, environment variables, or API contracts.
5. Ensure no secrets or `.env` values are included in your commits.

### Submitting

1. Push your branch to your fork:
   ```bash
   git push -u origin feature/my-feature
   ```
2. Open a pull request against `main` on the upstream repository.
3. The PR template will be pre-populated — fill in every section:
   - **Description** — what changed and why
   - **Type of change** — bug fix, feature, breaking change, docs
   - **Changes made** — bullet list of the key changes
   - **Testing** — how you tested the changes and what the results were
   - **Checklist** — check every box that applies
4. Link related issues in the description: `Closes #42` or `Relates to #77, #79`.

### Review and merge

- At least **one maintainer approval** is required before merging.
- All CI checks (tests, linting, security scans) must pass.
- If a reviewer requests changes, push updates to the same branch — do not open a new PR.
- Respond to all review comments, either by making the change or explaining why you disagree.
- Once approved, a maintainer will merge using:
  - **Squash and merge** — for single-purpose changes where one clean commit is appropriate
  - **Create a merge commit** — for multi-commit PRs with logically distinct commits

---

## Branch Protection Rules

The `main` branch is protected with the following rules:

| Rule | Setting |
|------|---------|
| Direct pushes to `main` | Blocked — all changes must go through a PR |
| Required approving reviews | 1 — at least one maintainer must approve |
| Required status checks | All CI jobs must pass (`contract`, `backend`, `frontend`, `python`, `all-tests`) |
| Stale review dismissal | Enabled — new commits dismiss existing approvals |
| Branch deletable | No — `main` cannot be deleted or force-pushed |

---

## Docker Base Image Pinning

All `FROM` statements use pinned SHA256 digests to ensure reproducible, auditable builds:

```dockerfile
FROM node:18.18.2-alpine@sha256:18a70ffe45b8a3db9e3e8dd85a92d7beab70d395e0d529ada0d9de0319c8b4d7
```

**Rules:**
- Never use untagged images (`FROM python` is not allowed).
- Always include both a version tag and a digest.
- Use specific version tags (`node:18.18.2-alpine`) rather than floating tags (`node:18-alpine`).

**Updating a base image:**

```bash
docker pull node:20-alpine
docker inspect node:20-alpine --format '{{index .RepoDigests 0}}'
# Copy the sha256 digest and update the Dockerfile FROM line
```

[Renovate](renovate.json) runs daily and opens PRs for digest updates automatically. Digest-only updates are auto-merged; version bumps require manual review.

---

## Questions?

If something in this guide is unclear, open an issue with the `question` label or start a discussion in the repository. We are happy to help.
