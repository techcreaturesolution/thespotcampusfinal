# S0-07 — Consolidated Issue Register

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Baseline:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. S0-01 to S0-06 Reconciliation & New Findings

| Source Audit | Finding Range | Total | Verification Result | Notes |
|---|---|---|---|---|
| **S0-01 (Backend)** | `AUD-001` – `AUD-038` | 38 | **CONFIRMED** (Open) | Static/code evidence re-verified; `0` fixed during audit. |
| **S0-02 (Web)** | `FE-001` – `FE-022` | 22 | **CONFIRMED** (Open) | Re-verified against `client/src/` + Vite build. |
| **S0-03 (Flutter)** | `FL-001` – `FL-022` | 22 | **CONFIRMED** (Open) | `FL-001` (Android) & `FL-022` (iOS) confirmed distinct. |
| **S0-04 (Database)** | `DB-001` – `DB-016` | 16 | **CONFIRMED** (Open) | Re-verified via Mongoose introspection (`39` models, `56` indexes). |
| **S0-05 (API)** | `API-ISSUE-001` – `018` | 18 | **CONFIRMED** (Open) | Re-verified against `217` mounted + `6` unmounted routes. |
| **S0-07 (New)** | `VER-NEW-001` | 1 | **`NEW_FINDING`** | Web ESLint (`npm.cmd run lint`) fails with **109 problems (21 errors, 88 warnings)** across `client/src/`. |

---

## 2. New Finding Detail

| Finding ID | Category | Severity | File Path | Description | Evidence | Impact | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|
| `VER-NEW-001` | Build/Quality | High | `client/src/` (multiple files incl. `ManageJob.jsx`, `TpoApplications.jsx`) | ESLint fails with 21 errors & 88 warnings | `cd client; npm.cmd run lint` -> `✖ 109 problems (21 errors, 88 warnings)` | Code quality & React hook dependency bugs (`react-hooks/exhaustive-deps`, `no-unused-vars`). | Fix all 21 ESLint errors before feature development. | Open |
