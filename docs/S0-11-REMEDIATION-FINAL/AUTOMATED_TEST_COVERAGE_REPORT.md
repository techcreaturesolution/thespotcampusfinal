# Automated Test & Coverage Report

**Project:** The Spot Campus (`thespotcampusfinal`) | **Branch:** `s0-11-remediation`

---

| Suite | Command | Tests | Exit Code | Measured V8 Coverage |
|---|---|---|---:|---|
| **Backend (`server/`)** | `npx.cmd vitest run --coverage` | **17/17 PASS** (`2` files) | `0` | Stmts: `15.12%` (`982/6493`), Branches: `4.25%` (`196/4602`), Funcs: `4.33%` (`36/830`), Lines: `16.84%` (`972/5770`) |
| **Web (`client/`)** | `npx.cmd vitest run --coverage` | **4/4 PASS** (`1` file) | `0` | Stmts: `88.88%`, Branches: `93.33%`, Funcs: `83.33%`, Lines: `88.88%` (`ErrorBoundary.jsx` `87.5%`, `RoleGuard.jsx` `90%`) |
| **Flutter (`flutter_student_app/`)** | `flutter test --no-pub --suppress-analytics` | **1/1 PASS** (`widget_test.dart`) | `0` | Not configured |
