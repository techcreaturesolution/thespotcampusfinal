# Dev 1 — Backend Risk Register (S0-11)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-11 | **Owner:** Dev 1  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

| Risk ID | Original IDs | Description | Severity | Affected Features | Blocker? | Mitigation Owner |
|---|---|---|---|---|---|---|
| `RISK-BE-001` | `AUD-007`, `DB-002` | Client-supplied Razorpay amount & `exam_payment.user_id` unique constraint bug | **CRITICAL** | `FEAT-016` | Yes | Dev 1 |
| `RISK-BE-002` | `AUD-001, 002..006, 009, 010, 014, 017` | Missing `*_status` check & missing `authorizePermissions` RBAC on admin/core routes | **CRITICAL** | `FEAT-007`–`011`, `014` | Yes | Dev 1 |
| `RISK-BE-003` | `AUD-011, 013, 015` | Unchecked `DELETE /upload/:filename`, `/api/register` exposure, `isCorrect` leak | **HIGH** | `FEAT-011, 015, 018` | Yes | Dev 1 |
| `RISK-BE-004` | `BASE-BE-001`, `AUD-032` | `NO AUTOMATED TEST SUITE AVAILABLE` in `server/` | **HIGH** | `FEAT-022` (all) | Yes | Dev 1 |
| `RISK-BE-005` | `BASE-DB-001`, `DB-007, 001, 004, 005` | No migration runner + missing unique `{student_id, job_id}`, `exam_id` type, `tbl_user` refs | **HIGH** | `FEAT-013, 015, 017, 021, 023, 025` | Yes | Dev 1 |
| `RISK-BE-006` | `BASE-BE-002` | Cold `import('./src/app.js')` takes `38.53s` | **MEDIUM** | `FEAT-017` | No | Dev 1 |
