# Final Issue Resolution Matrix

**Project:** The Spot Campus (`thespotcampusfinal`) | **Branch:** `s0-11-remediation`

---

| Issue ID | Original Status | Fix / Action Performed | Tests Executed & Output | Exit | Final Status |
|---|---|---|---|---:|---|
| `AUD-001` | `FIXED_NOT_VERIFIED` | `isAccountInactive` across 6 roles in `login.controller.js` | `auth_student_migration.test.js` (`3/3` role blocks PASS) | `0` | **FIXED_AND_VERIFIED** |
| `AUD-004` | `FIXED_NOT_VERIFIED` | Explicit `STUDENT_EDITABLE_FIELDS` allowlist in `student.controller.js` | `auth_student_migration.test.js` (`2/2` mass-assign & `403` PASS) | `0` | **FIXED_AND_VERIFIED** |
| `AUD-002, 003, 005, 006, 009, 010, 013` | `FIXED_AND_VERIFIED` | RBAC guards + `/api/register` isolation | `security.regression.test.js` (`11/11` PASS) | `0` | **FIXED_AND_VERIFIED** |
| `AUD-007, 011, 015` | `FIXED_AND_VERIFIED` | Server-side Razorpay pricing, `timingSafeEqual`, upload ownership, `trustScore` removal | `security.regression.test.js` PASS | `0` | **FIXED_AND_VERIFIED** |
| `DB-001, DB-002` | `FIXED_AND_VERIFIED` | Fixed `tbl_user` refs & `exam_payment` compound index | `security.regression.test.js` + `migrate:dry-run` PASS | `0` | **FIXED_AND_VERIFIED** |
| `DB-004` | `PARTIALLY_FIXED` | Read-only audit of `2` live duplicate groups (`3` & `5` docs); deterministic merge plan | `002_check_application_duplicates.js` dry-run | `0` | **BLOCKED** (Live cleanup needs approval) |
| `DB-005` | `DEFERRED` | Audited `45/45` `tbl_papers.exam_id` strings; migration & rollback plan documented | Read-only DB audit | `0` | **BLOCKED** (Contract & backup approval) |
| `FEAT-023` (`DB-007`) | `FIXED_AND_VERIFIED` | Migration runner + dry-run + disposable rollback test | `migrate:dry-run` + `auth_student_migration.test.js` PASS | `0` | **FIXED_AND_VERIFIED** |
| `FE-001, 009, 011, 017` | `FIXED_AND_VERIFIED` | Wired `<RoleGuard>` across `App.jsx`, `<ErrorBoundary>`, `0` ESLint errors, `4/4` RTL tests | `vitest --coverage`, `eslint --quiet`, `vite build` PASS | `0` | **FIXED_AND_VERIFIED** |
| `FL-001, 004, 005, 008, 009` | `FIXED_AND_VERIFIED` | HTTPS manifest, Dio unification, `401` clear, `_joinInterview` URL, `widget_test.dart` | `flutter test --no-pub` (`1/1` PASS) | `0` | **FIXED_AND_VERIFIED** |
| `BASE-FL-001` | `DEFERRED` | `dart fix --apply` (`37` fixes in `11` files) + `dart format .` (`187 -> 121` `info` issues) | `dart analyze` (`121` info, `0` errors, `0` warnings) | `2` | **PARTIALLY_FIXED** |
| `BASE-FL-003, 004` | `BLOCKED` | Added `.github/workflows/mobile-ci.yml` for Ubuntu Android & macOS iOS builds | Windows host blocked | — | **BLOCKED** |
