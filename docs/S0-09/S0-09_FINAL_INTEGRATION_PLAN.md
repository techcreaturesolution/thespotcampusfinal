# S0-09 — Final Integration Plan

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Shared-File Change Protocol (10 Steps)
1. Identify exact shared file from `S0-09_SHARED_FILE_REGISTER.md` (`24` files).
2. Identify affected features (`FEAT-001`–`025`).
3. Verify Primary Owner (`12` Dev 1, `10` Dev 2, `2` Joint).
4. Document proposed contract/schema change.
5. Primary Owner reviews and approves interface compatibility.
6. Implement in owner's feature branch (`dev1/*` or `dev2/*`).
7. Run relevant unit/API/UI checks.
8. Secondary consumer verifies Web/Flutter integration against `develop`.
9. Update API contract / `docs/` notes if endpoint or payload changed.
10. Merge into `develop` -> integration test -> `main`.

---

## 2. Phased Integration Waves
- **Wave 1 (Foundation & P0 Security):** Dev 1 lands `FEAT-023` (Migration Runner), `FEAT-007` (Auth/Status), `FEAT-008` (Admin RBAC), `FEAT-016` (Razorpay server amount); Dev 2 lands `FEAT-019` (ErrorBoundary/ESLint), `FEAT-020` (Cleartext off + Dio unify), and `FEAT-022` (Test harnesses) in parallel.
- **Wave 2 (P1 Integrity & Consolidation):** Freeze contracts for `FEAT-009`–`015`, `017`, `018`; Dev 1 fixes DB indexes/transactions (`FEAT-021`) while Dev 2 consolidates duplicate UI pages & fixes Flutter `_joinInterview`.
- **Wave 3 (Blocked New Features):** Unlock `FEAT-025` (Unified Institute) & `FEAT-024` (Notifications) only after human-approved Step 0A Matrix & Migration Plan.
