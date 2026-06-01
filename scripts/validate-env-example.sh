#!/usr/bin/env bash
# Validates that every environment variable required by the codebase is present
# in .env.example. Exits 1 if any variable is missing.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_EXAMPLE="$ROOT/.env.example"
ERRORS=0

# Variables that are intentionally internal/runtime-only and not required in .env.example
SKIP_VARS=(
  "NODE_ENV"
  "CI"
  "PATH"
)

check_var() {
  local var="$1"
  # Skip variables in the exclusion list
  for skip in "${SKIP_VARS[@]}"; do
    [[ "$var" == "$skip" ]] && return
  done
  if ! grep -qE "^[# ]*${var}=" "$ENV_EXAMPLE"; then
    echo "MISSING: $var not found in .env.example"
    ERRORS=$((ERRORS + 1))
  fi
}

# ── Backend: extract from config.js (Zod schema keys) ────────────────────────
while IFS= read -r var; do
  check_var "$var"
done < <(grep -oP '(?<=\s)[A-Z][A-Z0-9_]+(?=:)' "$ROOT/backend/src/config.js" | sort -u)

# ── Python service: extract os.getenv() calls ─────────────────────────────────
while IFS= read -r var; do
  check_var "$var"
done < <(grep -rhoP '(?<=os\.getenv\()["\x27][A-Z][A-Z0-9_]+["\x27]' \
  "$ROOT/python-service/" | tr -d '"'"'" | sort -u)

if [[ $ERRORS -gt 0 ]]; then
  echo ""
  echo "ERROR: $ERRORS variable(s) missing from .env.example"
  echo "Add them with a placeholder value and inline comment."
  exit 1
fi

echo "OK: all required variables are present in .env.example"
