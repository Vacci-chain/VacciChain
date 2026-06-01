#!/usr/bin/env bash
# Post-deploy smoke test for the VacciChain contract.
#
# Exercises the full lifecycle on the deployed contract:
#   initialize → add_issuer → register_patient → mint_vaccination
#   → verify_vaccination → revoke_vaccination → re-verify → cleanup
#
# Required env vars:
#   VACCINATIONS_CONTRACT_ID   Contract address (C...)
#   ADMIN_SECRET_KEY           Admin account secret key (S...)
#   ADMIN_PUBLIC_KEY           Admin account public key (G...)
#
# Optional env vars:
#   STELLAR_NETWORK            testnet (default) or mainnet
#
# Exit codes: 0 = all checks passed, 1 = one or more checks failed.

set -uo pipefail

NETWORK="${STELLAR_NETWORK:-testnet}"
CONTRACT_ID="${VACCINATIONS_CONTRACT_ID:?VACCINATIONS_CONTRACT_ID must be set}"
ADMIN_SK="${ADMIN_SECRET_KEY:?ADMIN_SECRET_KEY must be set}"
ADMIN_PK="${ADMIN_PUBLIC_KEY:?ADMIN_PUBLIC_KEY must be set}"

# Prefer the modern 'stellar' CLI; fall back to the legacy 'soroban' alias.
if command -v stellar >/dev/null 2>&1; then
  CLI=stellar
elif command -v soroban >/dev/null 2>&1; then
  CLI=soroban
else
  echo "ERROR: neither 'stellar' nor 'soroban' CLI found in PATH" >&2
  exit 1
fi

PASS=0
FAIL=0
TOKEN_ID=""

# Invoke a contract function signed by the admin key.
invoke() {
  "$CLI" contract invoke \
    --id "$CONTRACT_ID" \
    --source "$ADMIN_SK" \
    --network "$NETWORK" \
    -- "$@"
}

pass() { echo "[PASS] $*"; PASS=$((PASS + 1)); }
fail() { echo "[FAIL] $*"; FAIL=$((FAIL + 1)); }

echo "========================================"
echo " VacciChain Smoke Test"
echo "========================================"
echo " CLI:         $CLI"
echo " Network:     $NETWORK"
echo " Contract ID: $CONTRACT_ID"
echo " Admin:       $ADMIN_PK"
echo "========================================"
echo ""

# ── 1. initialize ─────────────────────────────────────────────────────────────
# On a fresh deploy this must succeed; on a re-deploy AlreadyInitialized is OK.
echo "[1/7] initialize"
if OUT=$(invoke initialize --admin "$ADMIN_PK" 2>&1); then
  pass "initialize: contract initialized"
elif echo "$OUT" | grep -qiE "AlreadyInitialized|Contract\(1\)|#1"; then
  pass "initialize: already initialized (re-deploy)"
else
  echo "      $OUT"
  fail "initialize: unexpected error"
fi

# ── 2. add_issuer ─────────────────────────────────────────────────────────────
# Admin registers itself as a temporary smoke-test issuer.
echo "[2/7] add_issuer"
if OUT=$(invoke add_issuer \
  --issuer  "$ADMIN_PK" \
  --name    "Smoke Test Clinic" \
  --license "SMOKE-0001" \
  --country "Testland" 2>&1); then
  pass "add_issuer: admin registered as test issuer"
else
  echo "      $OUT"
  fail "add_issuer failed"
fi

# ── 3. register_patient ───────────────────────────────────────────────────────
# Admin plays the patient role so no extra keypair is needed.
# patient.require_auth() is satisfied because admin signs the transaction
# and patient == admin here.
echo "[3/7] register_patient"
if OUT=$(invoke register_patient --patient "$ADMIN_PK" 2>&1); then
  pass "register_patient: patient registered"
else
  echo "      $OUT"
  fail "register_patient failed"
fi

# ── 4. mint_vaccination ───────────────────────────────────────────────────────
echo "[4/7] mint_vaccination"
if MINT_OUT=$(invoke mint_vaccination \
  --patient          "$ADMIN_PK" \
  --vaccine_name     "VacciChain Smoke Test Vaccine" \
  --date_administered "2026-06-01" \
  --issuer           "$ADMIN_PK" \
  --dose_number      null \
  --dose_series      null 2>&1); then
  # Strip surrounding whitespace and quotes to obtain the raw u64 token ID.
  TOKEN_ID=$(echo "$MINT_OUT" | tr -d '"' | tr -d ' ' | tr -d '\n')
  if [[ "$TOKEN_ID" =~ ^[0-9]+$ ]]; then
    pass "mint_vaccination: token_id=$TOKEN_ID"
  else
    fail "mint_vaccination: expected numeric token_id, got: $MINT_OUT"
  fi
else
  echo "      $MINT_OUT"
  fail "mint_vaccination failed"
fi

# ── 5. verify_vaccination (expect: vaccinated=true) ───────────────────────────
echo "[5/7] verify_vaccination (expect vaccinated=true)"
if VERIFY_OUT=$(invoke verify_vaccination --wallet "$ADMIN_PK" 2>&1); then
  # The return value is a 3-tuple [bool, records, dose_statuses].
  # Grab the first boolean token from the decoded output.
  FIRST_BOOL=$(echo "$VERIFY_OUT" | grep -oE '\btrue\b|\bfalse\b' | head -1)
  if [[ "$FIRST_BOOL" == "true" ]]; then
    pass "verify_vaccination: vaccinated=true confirmed"
  else
    fail "verify_vaccination: expected vaccinated=true, got first_bool='$FIRST_BOOL' in: $VERIFY_OUT"
  fi
else
  echo "      $VERIFY_OUT"
  fail "verify_vaccination failed"
fi

# ── 6. revoke_vaccination ─────────────────────────────────────────────────────
echo "[6/7] revoke_vaccination"
if [[ -z "$TOKEN_ID" ]]; then
  fail "revoke_vaccination: skipped — mint step did not produce a token_id"
elif OUT=$(invoke revoke_vaccination \
  --token_id "$TOKEN_ID" \
  --revoker  "$ADMIN_PK" 2>&1); then
  pass "revoke_vaccination: token $TOKEN_ID revoked"
else
  echo "      $OUT"
  fail "revoke_vaccination failed"
fi

# ── 7. verify_vaccination post-revoke (expect: vaccinated=false) ──────────────
echo "[7/7] verify_vaccination post-revoke (expect vaccinated=false)"
if VERIFY2_OUT=$(invoke verify_vaccination --wallet "$ADMIN_PK" 2>&1); then
  FIRST_BOOL=$(echo "$VERIFY2_OUT" | grep -oE '\btrue\b|\bfalse\b' | head -1)
  if [[ "$FIRST_BOOL" == "false" ]]; then
    pass "verify_vaccination post-revoke: vaccinated=false confirmed"
  else
    fail "verify_vaccination post-revoke: expected vaccinated=false, got first_bool='$FIRST_BOOL' in: $VERIFY2_OUT"
  fi
else
  echo "      $VERIFY2_OUT"
  fail "verify_vaccination post-revoke failed"
fi

# ── Cleanup: revoke the test issuer ───────────────────────────────────────────
echo ""
echo "[cleanup] revoking test issuer"
if invoke revoke_issuer --issuer "$ADMIN_PK" 2>/dev/null; then
  echo "          test issuer revoked"
else
  echo "          [warn] revoke_issuer failed (non-fatal — issuer will expire naturally)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "========================================"
printf " Results: %d passed, %d failed\n" "$PASS" "$FAIL"
echo "========================================"

if [[ "$FAIL" -gt 0 ]]; then
  echo " SMOKE TEST FAILED"
  exit 1
fi
echo " SMOKE TEST PASSED"
exit 0
