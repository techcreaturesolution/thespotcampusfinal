# Dev 2 — Frontend Risk Register (S0-11)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-11 | **Owner:** Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

| Risk ID | Original IDs | Description | Severity | Affected Features | Blocker? | Mitigation Owner |
|---|---|---|---|---|---|---|
| `RISK-FE-001` | `BASE-INT-001`, `FL-001, 003, 005, 008, 022` | Flutter cleartext HTTP, dual HTTP clients, `_joinInterview` mismatch, weak Student gate | **CRITICAL** | `FEAT-007, 014, 017, 020` | Yes | Dev 2 |
| `RISK-FE-002` | `BASE-WEB-001`, `FE-001, 009, 011` | `21` ESLint errors / `88` warnings, missing `<RoleGuard>` & `<ErrorBoundary>` | **HIGH** | `FEAT-008, 019` | Yes | Dev 2 |
| `RISK-FE-003` | `BASE-WEB-002`, `FE-017` | `NO AUTOMATED TEST SUITE AVAILABLE` in `client/` | **HIGH** | `FEAT-022` | Yes | Dev 2 |
| `RISK-FE-004` | `BASE-FL-001, 002`, `FL-009` | `187` Dart analyzer issues & `widget_test.dart` failing (`!timersPending`) | **HIGH** | `FEAT-020, 022` | Yes | Dev 2 |
| `RISK-FE-005` | `BASE-FL-003, 004` | Android APK build hung in headless shell; iOS blocked on Windows host | **MEDIUM** | `FEAT-020` (Release) | Env Blocker | Dev 2 |
