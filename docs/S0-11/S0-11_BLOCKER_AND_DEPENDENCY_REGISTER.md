# S0-11 — Blocker and Dependency Register

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

| Blocker ID | Type | Description | Blocks | Owner | Resolution Gate |
|---|---|---|---|---|---|
| `BLK-001` | Documentation | External **Step 0A Role & Permission Matrix** missing from repo | `FEAT-025`, Gate 2 | Project / Lead | Commit approved Step 0A doc |
| `BLK-002` | Documentation | External **College-to-Institute Migration Plan** & **16-Step Roadmap** missing | `FEAT-025`, Gate 11 | Project / Lead | Commit approved docs |
| `BLK-003` | Documentation | **Notification Specification** missing | `FEAT-024` | Project / Lead | Approve spec |
| `BLK-004` | Security (P0) | `AUD-007` Razorpay client amount + `DB-002` + `AUD-001..006` RBAC | `FEAT-007`–`016`, Gate 5 | Dev 1 | Wave 1 P0 fixes |
| `BLK-005` | Testing / Lint | `0` backend/Web tests, `21` ESLint errors, `187` Dart issues, `widget_test.dart` fail | Wave 2–3, Gates 6, 7, 10 | Joint | Wave 1 `FEAT-019, 020, 022` |
| `BLK-006` | Environment | Android headless build hang (`BASE-FL-003`) & no macOS/Xcode (`BASE-FL-004`) | Gate 8 (Mobile release) | Dev 2 / DevOps | Interactive/CI runners |
