# Cross-Platform Regression Report

**Project:** The Spot Campus (`thespotcampusfinal`) | **Branch:** `s0-11-remediation`

---

| Platform / Suite | Command | Result | Exit Code |
|---|---|---|---|
| **Backend Vitest + Supertest** | `cd server && npm.cmd test` | **11/11 PASS** | `0` |
| **DB Migration Dry-Run** | `cd server && npm.cmd run migrate:dry-run` | **PASS** (`3` migrations checked) | `0` |
| **Web ESLint (Errors)** | `cd client && npm.cmd run lint -- --quiet` | **0 errors** | `0` |
| **Web Vitest + RTL** | `cd client && npm.cmd test` | **3/3 PASS** | `0` |
| **Web Production Build** | `cd client && npm.cmd run build` | **PASS** (`42.07s`) | `0` |
| **Flutter Widget Test** | `cd flutter_student_app && flutter test --no-pub` | **1/1 PASS** | `0` |
| **Flutter Static Analysis** | `cd flutter_student_app && dart analyze` | `187` `info` issues | `2` (Deferred) |
