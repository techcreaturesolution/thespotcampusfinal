# S0-09 — Circular Dependency and Architecture Risk Report

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Circular Import Verification (Machine-Verified)
- **Backend (`server/src/`, `152` JS files, `425` edges):** **0 circular dependencies**.
- **Web (`client/src/`, `106` JS/JSX files, `260` edges):** **0 circular dependencies**.
- **Flutter (`flutter_student_app/lib/`, `38` Dart files, `85` edges):** **0 circular dependencies**.

---

## 2. Architecture Coupling & Duplication Risks

| Risk | Affected Files | Affected Features | Severity | Blocks Parallel? | Future Solution |
|---|---|---|---|---|---|
| **73 Cross-Module Model Imports** | `dashboard.controller.js`, `job.controller.js`, `application.controller.js`, `auth/*.controller.js` | `FEAT-007, 008, 012, 013, 025` | **High** | No (Dev 1 internal) | Introduce service layer before `FEAT-025` |
| **Dual Upload Middleware** | `fileUploadMiddleware.js` + `multerMiddleware.js` (`7` importers) | `FEAT-018` | **High** | No | Retire `multerMiddleware.js` in Dev 1 Wave 2 |
| **Dual Auth Controllers / Dead Route** | `auth.controller.js`, `login.controller.js`, `user.controller.js` + dead `/api/auth/login` | `FEAT-007` | **Critical** | **Yes (Wave 1)** | Consolidate in `FEAT-007` (`DEV1` Sequential) |
| **Dual Flutter HTTP Clients** | `api_service.dart` (Dio) + `job_finder_service.dart` (raw `http`) | `FEAT-017, 020` | **High** | No | Unify into `ApiService` (`DEV2`) |
| **Duplicate Web Role Pages** | `college/*`, `tpo/*`, `university/*` management pages | `FEAT-010` | **Medium** | No | Consolidate in `DEV2` Wave 2 |
| **Unmounted `session` Module** | `server/src/modules/session/*` | Cleanup | **Low** | No | Archive/remove after verification |
