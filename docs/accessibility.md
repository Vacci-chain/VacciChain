# Accessibility Audit — WCAG AA Contrast

**Date:** 2026-05-28  
**Standard:** WCAG 2.1 AA — 4.5:1 normal text, 3:1 large text (18pt+ or 14pt+ bold) and interactive elements  
**Scope:** `frontend/src` — all pages and components (dark-mode only design)

---

## Summary

| Result | Count |
|--------|-------|
| Failures found | 3 |
| Failures fixed | 3 |
| Remaining failures | 0 |

---

## Full Audit Results

All ratios computed using the WCAG relative luminance formula.

| Foreground | Background | Ratio | Type | Location | Result |
|------------|------------|-------|------|----------|--------|
| `#e2e8f0` | `#0f172a` | 14.48:1 | Normal | Body text / page background | ✅ PASS |
| `#38bdf8` | `#0f172a` | 8.33:1 | Normal | Links / page background | ✅ PASS |
| `#38bdf8` | `#1e293b` | 6.83:1 | Normal | Nav brand, NFTCard vaccine name / card background | ✅ PASS |
| `#38bdf8` | `#0f172a` | 8.33:1 | Large | Landing page title / page background | ✅ PASS |
| `#94a3b8` | `#0f172a` | 6.96:1 | Normal | Landing subtitle / page background | ✅ PASS |
| `#94a3b8` | `#1e293b` | 5.71:1 | Normal | Form labels, secondary text / card background | ✅ PASS |
| `#ffffff` | `#0ea5e9` | 2.77:1 | Normal | Button text / button background | ❌ **FAIL** |
| `#ffffff` | `#475569` | 7.58:1 | Normal | Disconnect button text / button background | ✅ PASS |
| `#4ade80` | `#0f172a` | 10.25:1 | Normal | Connected wallet status / page background | ✅ PASS |
| `#4ade80` | `#14532d` | 5.23:1 | Normal | Vaccinated badge text / badge background | ✅ PASS |
| `#f87171` | `#0f172a` | 6.45:1 | Normal | Error messages / page background | ✅ PASS |
| `#f87171` | `#450a0a` | 5.84:1 | Normal | Unvaccinated badge text / badge background | ✅ PASS |
| `#64748b` | `#1e293b` | 3.07:1 | Normal | NFTCard token ID + issuer / card background | ❌ **FAIL** |
| `#64748b` | `#0f172a` | 3.75:1 | Normal | Wallet address / page background | ❌ **FAIL** |
| `#e2e8f0` | `#1e293b` | 11.87:1 | Normal | Input text / input background | ✅ PASS |

---

## Failures and Fixes

### 1. Button text on button background

| | Before | After |
|-|--------|-------|
| Foreground | `#ffffff` | `#ffffff` |
| Background | `#0ea5e9` (sky-500) | `#0369a1` (sky-700) |
| Ratio | 2.77:1 ❌ | 5.93:1 ✅ |

**Files changed:** `Landing.jsx`, `PatientDashboard.jsx`, `IssuerDashboard.jsx`, `VerifyPage.jsx`

---

### 2. NFTCard token ID and issuer text

| | Before | After |
|-|--------|-------|
| Foreground | `#64748b` (slate-500) | `#94a3b8` (slate-400) |
| Background | `#1e293b` | `#1e293b` |
| Ratio | 3.07:1 ❌ | 5.71:1 ✅ |

**File changed:** `NFTCard.jsx`

---

### 3. Wallet address text in Patient Dashboard

| | Before | After |
|-|--------|-------|
| Foreground | `#64748b` (slate-500) | `#94a3b8` (slate-400) |
| Background | `#0f172a` | `#0f172a` |
| Ratio | 3.75:1 ❌ | 6.96:1 ✅ |

**File changed:** `PatientDashboard.jsx`

---

## Notes

- The application uses a single dark theme. There is no light mode; light-mode contrast is not applicable.
- All interactive elements (buttons, links) meet the 3:1 minimum after fixes.
- Large text elements (h1, h2) all passed without changes.
- `VerificationBadge` colors (`#4ade80`/`#14532d` and `#f87171`/`#450a0a`) both pass without changes.
