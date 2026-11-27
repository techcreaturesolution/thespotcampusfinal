# S0-11 — Feature Start Permission Matrix (`FEAT-001` to `FEAT-025`)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## Summary Totals (`25` Features)
- **GO:** **8** (`FEAT-001`–`FEAT-006`, `FEAT-022`, `FEAT-023`)
- **CONDITIONAL GO:** **15** (`FEAT-007`–`FEAT-021`) — Permitted in Wave 1–2 remediation order only; blocked for new feature expansion until P0/P1 defects resolved
- **BLOCKED:** **2** (`FEAT-024`, `FEAT-025`)

---

| Feature ID | Feature Name | Class | Primary Owner | Blockers / Dependencies | S0-11 Decision | Required Condition |
|---|---|---|---|---|---|---|
| `FEAT-001` | Dropdown & Lookups | REUSE | Dev 1 | None (`API-02` PASS) | **GO** | Freeze read-only contract |
| `FEAT-002` | Idempotency Guard | REUSE | Dev 1 | None | **GO** | Preserve header contract |
| `FEAT-003` | Preparation Suite | REUSE | Dev 1 + Dev 2 | Minor `DB-015` | **GO** | No breaking schema changes |
| `FEAT-004` | Public Landing & Contact | REUSE | Dev 2 + Dev 1 | `AUD-009` (`GET/DEL` fixed in `008`) | **GO** | Keep `POST /contact` public |
| `FEAT-005` | Password Reset | REUSE | Dev 1 | Minor `AUD-021` Origin allowlist | **GO** | Harden Origin allowlist |
| `FEAT-006` | AI CV Builder | REUSE | Dev 1 + Dev 2 | `AUD-010` (`FEAT-008`) | **GO** | Guard template admin routes in `008` |
| `FEAT-007` | Multi-Role Auth & Login | ENHANCEMENT | Dev 1 + Dev 2 | `AUD-001, 014, 017`, `FE-002`, `FL-003` | **CONDITIONAL GO** | Wave 1 P0: fix `*_status` & JWT/role gate |
| `FEAT-008` | Admin Portal & Governance | ENHANCEMENT | Dev 1 + Dev 2 | `AUD-006, 009, 010`, `FE-001, 014` | **CONDITIONAL GO** | Wave 1 P0: add `Admin` RBAC & `<RoleGuard>` |
| `FEAT-009` | University Management | ENHANCEMENT | Dev 1 + Dev 2 | `AUD-002, 027`, `FEAT-007` | **CONDITIONAL GO** | Wait for `FEAT-007` auth freeze |
| `FEAT-010` | College, Degree, Branch, TPO | ENHANCEMENT | Dev 1 + Dev 2 | `AUD-003, 008`, `FE-012` | **CONDITIONAL GO** | Wait for `FEAT-007`; no `tbl_institute` rename yet |
| `FEAT-011` | Student Profile & Verif | ENHANCEMENT | Dev 1 + Dev 2 | `AUD-004, 013`, `FEAT-007` | **CONDITIONAL GO** | Isolate `/api/register`, whitelist fields |
| `FEAT-012` | Company & Job Posting | ENHANCEMENT | Dev 1 + Dev 2 | `AUD-008, 028, 030` | **CONDITIONAL GO** | Add `createJob` RBAC & pagination |
| `FEAT-013` | Job Application Pipeline | ENHANCEMENT | Dev 1 + Dev 2 | `AUD-012`, `DB-004`, `FEAT-023` | **CONDITIONAL GO** | Add unique `{student_id, job_id}` & ownership |
| `FEAT-014` | Rounds & Interviews | ENHANCEMENT | Dev 1 + Dev 2 | `AUD-005, 012`, `FL-005` | **CONDITIONAL GO** | Add `/rounds/*` RBAC & fix Flutter URL |
| `FEAT-015` | AI Exam & Proctored Paper | ENHANCEMENT | Dev 1 + Dev 2 | `AUD-015, 016`, `DB-005`, `FEAT-023` | **CONDITIONAL GO** | Migrate `exam_id` via `023`, strip `isCorrect` |
| `FEAT-016` | Payments & Subscriptions | ENHANCEMENT | Dev 1 + Dev 2 | `AUD-007`, `DB-002`, `FL-002` | **CONDITIONAL GO** | Wave 1 P0: server-side Razorpay amount & index fix |
| `FEAT-017` | Market Job Finder | ENHANCEMENT | Dev 1 + Dev 2 | `DB-001`, `FL-008`, `BASE-BE-002` | **CONDITIONAL GO** | Fix `tbl_user` refs & unify Flutter `Dio` |
| `FEAT-018` | File Upload & Storage | ENHANCEMENT | Dev 1 + Dev 2 | `AUD-011` | **CONDITIONAL GO** | Add `DELETE /:filename` ownership check |
| `FEAT-019` | Shared Web UI & Code Quality | ENHANCEMENT | Dev 2 | `BASE-WEB-001` (`FE-011`), `FE-009, 010` | **CONDITIONAL GO** | Wave 1: fix `21` ESLint errors, `<ErrorBoundary>` |
| `FEAT-020` | Flutter Net & Transport Sec | ENHANCEMENT | Dev 2 | `BASE-FL-001`, `BASE-INT-001`, `FL-001, 004` | **CONDITIONAL GO** | Wave 1: disable cleartext, unify `Dio`, fix `187` issues |
| `FEAT-021` | Database Integrity & Index | ENHANCEMENT | Dev 1 | `DB-003..011`, `FEAT-023` | **CONDITIONAL GO** | Run after `FEAT-023` migration runner |
| `FEAT-022` | Automated Test Suites | NEW | Joint | `BASE-BE-001, WEB-002, FL-002` | **GO** | Wave 1 foundation (Vitest/RTL + fix `widget_test.dart`) |
| `FEAT-023` | DB Migration Runner | NEW | Dev 1 | `BASE-DB-001` (`DB-007`) | **GO** | Wave 1 foundation before schema migrations |
| `FEAT-024` | Push & Local Notifications | NEW | Joint | Missing Notification Spec | **BLOCKED** | Approve Notification Spec & payload contract |
| `FEAT-025` | Unified Institute Arch | NEW | Joint (Dev 1 Lead) | Missing Step 0A + Migration Plan + `FEAT-023` | **BLOCKED** | Approve Step 0A Matrix, Migration Plan, and `023` |
