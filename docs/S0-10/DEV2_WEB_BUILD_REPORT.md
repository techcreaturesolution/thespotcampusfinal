# Dev 2 — Web Build & Lint Report (S0-10)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-10 | **Owner:** Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`) | **Date:** 2026-11-27

---

## 1. Environment & Scripts (`client/package.json`)
- **Node.js:** `v22.23.5` | **npm:** `11.11.0` (`npm.cmd`) | **Vite:** `^6.3.5` | **React:** `^18.3.1` | **ESLint:** `^9.25.0`.
- **Scripts:** `dev`, `build`, `lint`, `preview`. **No `type-check` or `test` script exists.**

## 2. Verification Results (`task-636`)

| Check ID | Check | Command | Exit | Duration | Status | Observed Output |
|---|---|---|---|---|---|---|
| `WEB-BLD-01` | Production Build | `npm.cmd run build` (`vite build`) | `0` | `24.08s` (`✓ built in 21.42s`) | **PASS** | Bundle generated in `client/dist/` (`vendor-excel`: `283.05 kB`, `vendor-core`: `276.26 kB`, `Landing`: `92.79 kB`, `VideoInterview`: `86.93 kB`) |
| `WEB-LNT-01` | ESLint Static Check | `npm.cmd run lint` (`eslint .`) | `1` | `5.48s` | **FAIL** | `109 problems (21 errors, 88 warnings)` — reproduces S0-07 baseline (`BASE-WEB-001` / `FE-011`) |
| `WEB-TSC-01` | Type Check | `client/package.json` inspection | — | — | **NOT_APPLICABLE** | JavaScript/JSX project (no TypeScript config) |
