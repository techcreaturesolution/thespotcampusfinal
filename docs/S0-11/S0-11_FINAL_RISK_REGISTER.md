# S0-11 — Final Consolidated Risk Register

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

| Risk ID | Original IDs | Description | Component | Severity | Owner | Blocker? | Affected Features | Mitigation |
|---|---|---|---|---|---|---|---|---|
| `RISK-001` | `AUD-007`, `DB-002` | Client-supplied Razorpay amount & `exam_payment.user_id` unique bug | Backend / DB | **CRITICAL** | Dev 1 | Yes | `FEAT-016` | Server-side plan lookup + fix index |
| `RISK-002` | `AUD-001, 002..006, 009, 010, 014, 017` | Missing `*_status` login check & missing `authorizePermissions` RBAC | Backend / Auth | **CRITICAL** | Dev 1 | Yes | `FEAT-007`–`011`, `014` | Enforce active status & role middleware |
| `RISK-003` | `BASE-INT-001`, `FL-001, 003, 005, 008, 022` | Flutter cleartext HTTP, dual HTTP clients, `_joinInterview` URL mismatch | Flutter | **CRITICAL** | Dev 2 | Yes | `FEAT-007, 014, 017, 020` | Disable cleartext, unify `Dio`, fix route |
| `RISK-004` | `AUD-011, 013, 015` | `DELETE /upload/:filename` no ownership, `/api/register` exposure, `isCorrect` leak | Backend | **HIGH** | Dev 1 | Yes | `FEAT-011, 015, 018` | Ownership checks & server-side scoring |
| `RISK-005` | `BASE-BE-001, WEB-002, FL-002`, `AUD-032`, `FE-017`, `FL-009` | Zero backend/Web tests + failing Flutter `widget_test.dart` (`!timersPending`) | Testing | **HIGH** | Joint | Yes | `FEAT-022` (all) | Wave 1 Vitest/RTL + fix `widget_test.dart` |
| `RISK-006` | `BASE-DB-001`, `DB-007, 001, 004, 005` | No migration runner + missing unique `{student_id, job_id}`, `exam_id` type, `tbl_user` refs | DB | **HIGH** | Dev 1 | Yes | `FEAT-013, 015, 017, 021, 023, 025` | Build `FEAT-023` runner + schema fixes |
| `RISK-007` | `BASE-WEB-001, FL-001(ana)`, `FE-001, 009, 011` | `21` ESLint errors / `88` warnings, `187` Dart issues, missing `<RoleGuard>`/`<ErrorBoundary>` | Web / Flutter | **HIGH** | Dev 2 | Yes | `FEAT-008, 019, 020` | Resolve lint/analyzer errors in Wave 1 |
| `RISK-008` | `S0-08` Doc Gap | Missing Step 0A Matrix, 16-Step Roadmap, Migration Plan, Notification Spec | Docs / Spec | **HIGH** | Project | Yes | `FEAT-024, 025` | Block `FEAT-024, 025` until docs approved |
| `RISK-009` | `BASE-FL-003, 004` | Android APK build hung `>4m28s`; iOS blocked on Windows host | Mobile CI | **MEDIUM** | Dev 2 | Env | `FEAT-020` (Release) | Interactive/CI Android & macOS/Xcode runners |
| `RISK-010` | `BASE-BE-002` | Cold `import('./src/app.js')` takes `38.53s` | Backend | **MEDIUM** | Dev 1 | No | `FEAT-017` | Lazy-load heavy `jobFinder` imports |
