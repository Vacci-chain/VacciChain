# Secret Scanning Setup

## What is Gitleaks and why does VacciChain use it?

[Gitleaks](https://github.com/gitleaks/gitleaks) is an open-source tool that scans Git repositories for hardcoded secrets — API keys, passwords, private keys, and similar credentials — before they can be committed or pushed.

VacciChain handles Stellar secret keys (`ADMIN_SECRET_KEY`, `SEP10_SERVER_KEY`, `ISSUER_SECRET_KEY`), JWT signing secrets, and Soroban contract credentials. A single leaked key can allow an attacker to mint or revoke vaccination records on behalf of any issuer, drain a funded wallet, or forge authentication tokens. Gitleaks is configured as a pre-commit hook so secrets are caught locally before they ever reach the remote repository. A matching GitHub Actions workflow provides a second layer of protection on every push and pull request.

---

## Installation

### Linux

```bash
chmod +x scripts/setup-git-hooks.sh
./scripts/setup-git-hooks.sh
```

The script downloads Gitleaks v8.18.4, installs it to `/usr/local/bin`, installs the `pre-commit` Python package, and wires up the hook.

**Prerequisites:** `wget`, `tar`, `sudo`, Python with `pip`.

### macOS

```bash
chmod +x scripts/setup-git-hooks.sh
./scripts/setup-git-hooks.sh
```

The script installs Gitleaks via Homebrew and then installs the `pre-commit` hook.

**Prerequisites:** [Homebrew](https://brew.sh/), Python with `pip`.

### Windows

```powershell
.\scripts\setup-git-hooks.ps1
```

The script installs Gitleaks via `winget` and then installs the `pre-commit` hook.

**Prerequisites:** [winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/) (included in Windows 10 1709+ / Windows 11), Python with `pip`.

### Manual setup (any platform)

If the scripts fail, follow these steps:

1. Install Gitleaks from the [releases page](https://github.com/gitleaks/gitleaks/releases) and ensure it is on your `PATH`.
2. Install `pre-commit`:
   ```bash
   pip install pre-commit
   ```
3. Install the hook:
   ```bash
   pre-commit install
   ```

---

## Verifying the setup

After running the script, make a test commit. The hook will run automatically. You can also trigger it manually:

```bash
# Scan staged files only (runs before each commit)
gitleaks protect --staged

# Scan the entire working tree
gitleaks detect --source . --verbose --redact
```

---

## Configuration

The `.gitleaks.toml` file at the repository root defines:

- **Custom rules** for Stellar secret keys, JWT secrets, Soroban keys, and generic API keys, layered on top of Gitleaks' built-in ruleset.
- **Allowlist** for known safe paths (`.env.example`, test files, Markdown docs) and placeholder patterns (`EXAMPLE_*`, `<your-key-here>`, etc.).

Edit `.gitleaks.toml` to add project-specific rules or to allowlist additional false positives.

---

## If a secret is accidentally committed

Act immediately — assume the secret is compromised from the moment it appears in a commit, even if the push was to a private repository.

### 1. Revoke and rotate the secret

| Secret | How to rotate |
|---|---|
| `ADMIN_SECRET_KEY` / `ISSUER_SECRET_KEY` / `SEP10_SERVER_KEY` | Generate a new Stellar keypair (`stellar keys generate`), update the contract's issuer allowlist if needed, and update `.env` / your secrets manager. |
| `JWT_SECRET` | Replace with a new random value. All existing sessions are immediately invalidated. |
| Any third-party API key | Revoke in the provider's dashboard and issue a new key. |

### 2. Remove the secret from Git history

Use [git-filter-repo](https://github.com/newren/git-filter-repo) (preferred over `git filter-branch`):

```bash
pip install git-filter-repo
git filter-repo --path <file-containing-secret> --invert-paths
```

Or to replace the literal value everywhere in history:

```bash
git filter-repo --replace-text <(echo 'ACTUAL_SECRET_VALUE==>REMOVED')
```

After rewriting history, force-push all affected branches:

```bash
git push origin --force --all
git push origin --force --tags
```

> **Note:** Force-pushing rewrites shared history. Coordinate with all contributors so they re-clone or rebase onto the new history.

### 3. Invalidate GitHub's cached view

GitHub caches repository content. After force-pushing, [contact GitHub Support](https://support.github.com/contact) to request removal of the secret from cached views and the reflog.

### 4. Audit for misuse

Check Stellar Horizon for any transactions signed with the leaked key after the commit timestamp. Review application logs for unexpected JWT usage.

---

## Bypassing the hook (emergency only)

```bash
git commit --no-verify -m "message"
```

Only use this if the hook is blocking a genuine false positive that cannot wait for a `.gitleaks.toml` update. Document the reason in the commit message and open a follow-up issue to fix the allowlist.

---

## CI/CD

The GitHub Actions workflow at `.github/workflows/gitleaks.yml` runs Gitleaks on every push and pull request targeting `main` or `develop`. A failed scan blocks the PR from merging and uploads a redacted report as a workflow artifact.

---

## Troubleshooting

**Hook not running after setup**
```bash
pre-commit install
```

**`gitleaks: command not found`**
Ensure the binary is on your `PATH`:
```bash
which gitleaks   # Linux/macOS
where gitleaks   # Windows
```

**False positive blocking a commit**
Add the file path or pattern to the `[allowlist]` section in `.gitleaks.toml`, commit that change, then retry your original commit.
