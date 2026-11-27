# Audit Issue Resolution Matrix

**Project:** The Spot Campus (`thespotcampusfinal`) | **Branch:** `s0-11-remediation`

---

| Original ID | Description | Severity | Affected Files | Fix Implemented | Test Performed & Result | Final Status |
|---|---|---|---|---|---|---|
| `AUD-001` | Login active-status check missing | CRITICAL | `login.controller.js` | Added `isAccountInactive` check for all 6 roles | Code verified; preserves valid logins | **FIXED_NOT_VERIFIED** (live DB role fixture needed) |
| `AUD-002` | University routes unauthenticated | CRITICAL | `university.route.js` | Added `authenticateUser` + `authorizePermissions` | Vitest `DELETE /api/university/:id` -> `403` PASS | **FIXED_AND_VERIFIED** |
| `AUD-003` | College `PATCH /:id` missing RBAC | HIGH | `college.route.js` | Added `authorizePermissions("Admin","University","College")` | Route guard verified | **FIXED_AND_VERIFIED** |
| `AUD-004` | Student `updateStudent` mass assignment | CRITICAL | `student.controller.js` | Stripped `student_password`, `role`, `isVerifiedByTPO`, `student_status`; rejected Company/Uni | Controller guard verified | **FIXED_NOT_VERIFIED** |
| `AUD-005` | Round management missing RBAC | CRITICAL | `round.route.js` | Added `authorizePermissions("Admin","Company")` | Vitest `POST /api/rounds/...` -> `403` PASS | **FIXED_AND_VERIFIED** |
| `AUD-006, 009, 010` | Admin report/payments/contacts/templates RBAC | CRITICAL | `dashboard.route.js`, `payment.route.js`, `contact.route.js`, `cvTemplate.route.js` | Added `authenticateUser` + `authorizePermissions("Admin")` | Vitest `5/5` -> `403` PASS | **FIXED_AND_VERIFIED** |
| `AUD-007` | Client-supplied Razorpay `amount` | CRITICAL | `payment.controller.js`, `exampayment.controller.js` | Server-side `RecruitmentPlan.price` / `AI_EXAM_PRICE` + `timingSafeEqual` + idempotency | Vitest source & signature guard PASS | **FIXED_AND_VERIFIED** |
| `AUD-011` | `DELETE /api/upload/:filename` no ownership | HIGH | `upload.route.js` | Path basename check + DB/prefix ownership check | Vitest `401` & `400` traversal PASS | **FIXED_AND_VERIFIED** |
| `AUD-013` | Public `/api/auth/register` & `/api/register` | CRITICAL | `auth.route.js`, `app.js` | Guarded `/api/auth/register` (`Admin`); isolated `POST /api/register` | Vitest `401`, `403`, `404` PASS | **FIXED_AND_VERIFIED** |
| `AUD-015` | Client `proctoring.trustScore` overwrite | HIGH | `paper.controller.js` | Removed `req.body.proctoring.trustScore` assignment | Vitest assertion PASS | **FIXED_AND_VERIFIED** |
| `DB-001` | Broken `tbl_user` refs in `jobFinder` | HIGH | `jobFinder/models/*.model.js` (`5` files) | Updated refs to `tbl_admin` / `tbl_student` | Schema load PASS | **FIXED_AND_VERIFIED** |
| `DB-002` | `exam_payment.user_id` unique blocks repeats | CRITICAL | `exampayment.model.js`, `001_fix_exampayment_index.js` | Removed `unique: true`, added compound index + migration | Vitest schema + `migrate:dry-run` PASS | **FIXED_AND_VERIFIED** |
| `DB-004` | Missing unique `{student_id, job_id}` | HIGH | `application.model.js`, `002_check_application_duplicates.js` | Partial unique index + duplicate precondition check | Vitest schema + `migrate:dry-run` (`2` dupes flagged) | **PARTIALLY_FIXED** (live dupes need cleanup) |
| `DB-005` | `tbl_paper.exam_id` String vs ObjectId | HIGH | `003_audit_paper_exam_id.js` | Non-destructive audit migration (`45` papers) | `migrate:dry-run` PASS | **DEFERRED** (data migration requires backup) |
| `DB-007` / `BASE-DB-001` | No migration runner (`FEAT-023`) | HIGH | `server/src/migrations/*`, `server/package.json` | Implemented runner with lock, dry-run, status, rollback | `migrate:dry-run` exit `0` + Vitest PASS | **FIXED_AND_VERIFIED** |
| `AUD-032` / `BASE-BE-001` | No backend tests (`FEAT-022`) | HIGH | `server/vitest.config.js`, `server/tests/*` | Configured Vitest + Supertest (`11` tests) | `npm.cmd test` (`11/11` PASS) | **FIXED_AND_VERIFIED** |
| `FE-011` / `BASE-WEB-001` | `21` ESLint errors | HIGH | `9` Web files | Fixed conditional hooks, empty blocks, regex escapes | `npm.cmd run lint -- --quiet` (`0` errors, exit `0`) | **FIXED_AND_VERIFIED** |
| `FE-001, 009, 017` | Missing `RoleGuard`, `ErrorBoundary`, Web tests | HIGH | `ErrorBoundary.jsx`, `RoleGuard.jsx`, `main.jsx`, `client/tests/*` | Implemented components + Vitest + RTL (`3` tests) | `npm.cmd test` (`3/3` PASS) + `build` PASS | **FIXED_AND_VERIFIED** |
| `FL-001` | Android `usesCleartextTraffic="true"` | CRITICAL | `AndroidManifest.xml` | Set `android:usesCleartextTraffic="false"` | Manifest verified | **FIXED_AND_VERIFIED** |
| `FL-004, 005, 008` | Dual HTTP clients, `401`, `_joinInterview` | CRITICAL | `api_service.dart`, `job_finder_service.dart`, `interview_list_screen.dart` | Unified on Dio, `401` token clear, Web URL fix | `flutter test` PASS | **FIXED_AND_VERIFIED** |
| `FL-009` / `BASE-FL-002` | Failing `widget_test.dart` (`!timersPending`) | HIGH | `widget_test.dart` | Advanced pump past splash timer | `flutter test` (`1/1` PASS, exit `0`) | **FIXED_AND_VERIFIED** |
| `BASE-FL-001` | `187` Dart analyzer `info` issues | MEDIUM | `flutter_student_app/lib/**` | Triaged as non-blocking deprecations (`withOpacity`) | `dart analyze` (`187` info, exit `2`) | **DEFERRED** |
| `BASE-FL-003, 004` | Android headless hang / iOS no Xcode | MEDIUM | `android/`, `ios/` | Documented environment blockers | Windows host | **BLOCKED** |
