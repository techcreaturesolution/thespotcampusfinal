# S0-12 — Developer Ownership, Master Roadmap & Merge Plan

**Project:** The Spot Campus (`thespotcampusfinal`) | **Branch:** `s0-11-remediation` (from `ravi` @ `66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Developer Ownership (`S0-09` Baseline Reconciled)
- **Dev 1 (`145` exclusive + `12` shared primary):** `server/**`, Mongoose models (`39`), migrations (`FEAT-023`), API contracts, Vitest+Supertest.
- **Dev 2 (`155` exclusive + `10` shared primary):** `client/**` (`108` excl.), `flutter_student_app/**` (`47` excl.), UI components, Web/Flutter tests, Mobile CI.
- **Protected (`4`):** `server/.env`, `client/.env`, `flutter_student_app/.env`, `.agents/AGENTS.md`.
- **Branch Strategy:** `main` <- `develop` <- `baseline/s0-12-dev1` & `baseline/s0-12-dev2` (no direct `main` commits, no force-push, Primary Owner approval on `24` shared files).

## 2. Master 16-Step Roadmap Structure (External Detailed Spec Missing)
- **Release 1 — Placement Core:** Steps 0–9 (`FEAT-001`–`002`, `004`–`023`, `025` blocked on Step 0A & Migration Plan)
- **Release 2 — Practice & Assessment:** Steps 10–11 (`FEAT-003` Prep Suite)
- **Release 3 — Training & Readiness:** Steps 12–13 (`FEAT-006` AI CV Builder)
- **Release 4 — AI Career Intelligence:** Step 14 (`FEAT-017` Market Job Finder)
- **Release 5 — Campus Ecosystem & Enterprise Expansion:** Step 15 (`FEAT-024` Notifications — blocked on spec)
