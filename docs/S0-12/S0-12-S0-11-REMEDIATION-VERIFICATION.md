# S0-12 — S0-11 Remediation Verification Table

**Project:** The Spot Campus (`thespotcampusfinal`) | **Date:** 2026-11-27

---

| Item | Reported Status | Actual Source Status | Test Evidence | Final Status |
|---|---|---|---|---|
| `AUD-001` (6-role active status) | FIXED_AND_VERIFIED | `login.controller.js` `isAccountInactive` verified | `auth_student_migration.test.js` (`17/17` PASS) | **FIXED AND VERIFIED** |
| `AUD-004` (Student allowlist) | FIXED_AND_VERIFIED | `student.controller.js` `STUDENT_EDITABLE_FIELDS` verified | `auth_student_migration.test.js` (`17/17` PASS) | **FIXED AND VERIFIED** |
| `AUD-002, 003, 005, 006, 009, 010, 013` | FIXED_AND_VERIFIED | Route guards & `/api/register` isolation verified | `security.regression.test.js` (`17/17` PASS) | **FIXED AND VERIFIED** |
| `AUD-007, 011, 015` (Pay, Upload, Exam) | FIXED_AND_VERIFIED | Server pricing, `timingSafeEqual`, upload owner, `trustScore` verified | `security.regression.test.js` (`17/17` PASS) | **FIXED AND VERIFIED** |
| `FEAT-023` (Migration Runner) | FIXED_AND_VERIFIED | `server/src/migrations/runner.js` + `001`–`003` verified | `migrate:dry-run` (`exit 0`) + Vitest PASS | **FIXED AND VERIFIED** |
| `DB-004` (Duplicate apps) | BLOCKED | `application.model.js` index ready; `2` live dupe groups remain | Read-only DB audit + dry-run | **BLOCKED** |
| `DB-005` (`exam_id` migration) | BLOCKED | `45/45` `String` ObjectIds in `tbl_papers` | Read-only DB audit | **BLOCKED** |
| Web `RoleGuard`, `ErrorBoundary`, Lint, Tests | FIXED_AND_VERIFIED | `App.jsx`, `RoleGuard.jsx`, `ErrorBoundary.jsx`, `9` lint fixes | `eslint` (`0` err), `vitest` (`4/4` PASS), `build` PASS | **FIXED AND VERIFIED** |
| Flutter Dio, HTTPS, `_joinInterview`, Test | FIXED_AND_VERIFIED | `job_finder_service.dart`, `AndroidManifest.xml`, `widget_test.dart` | `flutter test` (`1/1` PASS) | **FIXED AND VERIFIED** |
| Flutter Analyzer (`121` info) | PARTIALLY_FIXED | `dart fix --apply` reduced `187 -> 121` `info` issues | `dart analyze` (`0` err, `0` warn, `121` info) | **PARTIALLY VERIFIED** |
| Android & iOS Builds | BLOCKED | `.github/workflows/mobile-ci.yml` added; local env blocked | Windows host / headless hang | **BLOCKED** |
