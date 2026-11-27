# S0-10 — Baseline Issue Register

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-10 | **Owners:** Dev 1 + Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

| Baseline ID | Original Audit ID | Feature ID | Affected File(s) | Severity | Actual Baseline Result | Blocker? |
|---|---|---|---|---|---|---|
| `BASE-BE-001` | `AUD-032` | `FEAT-022` | `server/package.json` | **High** | `NO AUTOMATED TEST SUITE AVAILABLE` | Yes (for safe refactor) |
| `BASE-BE-002` | New / S0-07 | `FEAT-017` | `server/src/app.js` / `jobFinder` | **Medium** | Cold `import('./src/app.js')` took `38533 ms` | No (dev friction) |
| `BASE-DB-001` | `DB-007` | `FEAT-023` | `server/src/scripts/seed.js` | **High** | No migration runner exists | Yes (for `FEAT-025`) |
| `BASE-WEB-001` | `FE-011` | `FEAT-019` | `client/src/**` | **High** | `npm.cmd run lint` failed: `21` errors, `88` warnings (reproduced) | Yes (CI/lint gate) |
| `BASE-WEB-002` | `FE-017` | `FEAT-022` | `client/package.json` | **High** | `NO AUTOMATED TEST SUITE AVAILABLE` | Yes (for safe refactor) |
| `BASE-FL-001` | S0-03 / S0-07 | `FEAT-020` | `flutter_student_app/lib/**` | **High** | `dart analyze` exited `2`: `187 issues found.` | Yes (lint/static gate) |
| `BASE-FL-002` | `FL-009` | `FEAT-022` | `flutter_student_app/test/widget_test.dart` | **High** | `flutter test` failed (`0/1`): `!timersPending` | Yes (test gate) |
| `BASE-FL-003` | New (Env) | `FEAT-020` | `flutter_student_app/android/` | **Medium** | `flutter build apk --debug` hung `>4m28s` in headless shell | Yes (Android CI) |
| `BASE-FL-004` | S0-03 / S0-07 | `FEAT-020` | `flutter_student_app/ios/` | **Medium** | `BLOCKED — REQUIRED MACOS/XCODE ENVIRONMENT UNAVAILABLE` | Env Blocker |
| `BASE-INT-001` | `FL-001, 005, 008` | `FEAT-014, 017, 020` | `api_service.dart`, `job_finder_service.dart`, `interview_list_screen.dart` | **Critical** | Dual HTTP clients + cleartext HTTP + `_joinInterview` mismatch | Yes |
