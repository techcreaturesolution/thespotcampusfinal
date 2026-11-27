# S0-07 — Dev 2 Test Evidence

**Owner:** Dev 2 | **Date:** 2026-11-26

---

## 1. Layer 1–3 Execution Log

| Check | Command | Result | Evidence |
|---|---|---|---|
| **Web ESLint** | `cd client; npm.cmd run lint` | Failed (109 issues) | `109 problems (21 errors, 88 warnings)` |
| **Web Vite Build** | `cd client; npm.cmd run build` | **Passed** | `✓ built in 20.92s` (`dist/` bundle generated) |
| **Web Dependency Audit** | `cd client; npm.cmd audit --omit=dev --json` | Executed | `10 prod vulnerabilities (0 critical, 7 high, 3 moderate)` |
| **Web Automated Tests** | Search for `*test*`/`*spec*` in `client/` | `NOT_IMPLEMENTED` | `0` test files, `0` test runners in `client/package.json` |
| **Flutter SDK Check** | `flutter --version; dart --version` | Passed | `Flutter 3.41.9 (stable)` / `Dart 3.11.5` |
| **Flutter Static Analysis** | `cd flutter_student_app; flutter analyze --no-pub` | `BLOCKED` | Timed out / hung on Windows environment |
| **Flutter Automated Tests** | `Test-Path flutter_student_app\test` | `NOT_IMPLEMENTED` | `False` (`test/` directory missing) |
| **iOS Build** | — | `BLOCKED` | `windows_x64` host cannot run Xcode / iOS builds |
| **Browser / Device E2E** | — | `BLOCKED` | No live test accounts / non-destructive audit constraint |
