# Dev 2 — Test Execution Log (S0-10)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-10 | **Owner:** Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

| Verification ID | Component | Command Executed | Environment | Exit Code | Actual Result | Status | Related Issue ID |
|---|---|---|---|---:|---|---|---|
| `WEB-LNT-01` | Web ESLint | `npm.cmd run lint` (`client/`) | Node `v22.23.5`, npm `11.11.0` | `1` | `109 problems (21 errors, 88 warnings)` (`5.48s`) | **FAIL** | `BASE-WEB-001` (`FE-011`) |
| `WEB-BLD-01` | Web Build | `npm.cmd run build` (`client/`) | Vite `6.3.5` | `0` | `✓ built in 21.42s` (`24.08s` total) | **PASS** | — |
| `WEB-TSC-01` | Web TypeCheck | `client/package.json` inspection | JS/JSX | — | No TypeScript config | **NOT_APPLICABLE** | — |
| `WEB-TST-01` | Web Tests | `client/package.json` inspection | JS/JSX | — | No test script/suite | **NOT_AVAILABLE** | `BASE-WEB-002` (`FE-017`) |
| `FL-ANA-01` | Flutter Static | `dart analyze` (`flutter_student_app/`) | Dart `3.11.5`, Flutter `3.41.9` | `2` | `187 issues found.` (`110.03s`) | **FAIL** | `BASE-FL-001` |
| `FL-TST-01` | Flutter Test | `flutter test --no-pub --suppress-analytics` | Flutter `3.41.9` | `1` | `0 passed, 1 failed` (`!timersPending`, `97.37s`) | **FAIL** | `BASE-FL-002` (`FL-009`) |
| `FL-AND-01` | Android Debug | `flutter build apk --debug --no-pub --suppress-analytics` | JDK `21.0.12`, Android SDK | — | Hung `>4m28s` (`task-682` cancelled) | **BLOCKED** | `BASE-FL-003` |
| `FL-AND-02` | Android Release | — | JDK `21.0.12`, Android SDK | — | Skipped after debug build blocked | **NOT_EXECUTED** | — |
| `FL-IOS-01` | iOS Build | — | Windows Host | — | macOS / Xcode unavailable | **BLOCKED** | `BASE-FL-004` |
