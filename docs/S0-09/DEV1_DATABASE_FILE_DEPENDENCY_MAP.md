# Dev 1 — Database File Dependency Map

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-09 | **Owner:** Dev 1  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Database Ownership Rule
- **Schema Owner:** **Dev 1 Exclusive** across all **38 `.model.js` files** (`39` Mongoose models, `594` paths, `51` ObjectId refs, `56` indexes).
- **Dev 2 Rule:** Dev 2 NEVER modifies `.model.js` files or assumes unapproved DB fields; Dev 2 consumes only approved API response contracts.

---

## 2. Highest-Contention Shared Models (Import Fan-In Verified)

| Model File | Collection | Direct Backend Importers | Dependent Features | Conflict / Migration Risk |
|---|---|---:|---|---|
| `server/src/modules/college/college.model.js` | `tbl_college` | **12** | `FEAT-007, 009, 010, 011, 012, 013, 025` | **CRITICAL** — College-to-Institute (`FEAT-025`) |
| `server/src/modules/tpo/tpo.model.js` | `tbl_tpo` | **12** | `FEAT-007, 010, 011, 012, 013` | **HIGH** — Multi-controller auth/ownership |
| `server/src/modules/student/student.model.js` | `tbl_student` | **10** | `FEAT-006, 007, 011, 013, 015, 016, 017` | **CRITICAL** — `student.controller.js` + `auth` + `payment` |
| `server/src/modules/application/application.model.js` | `tbl_application` | **7** | `FEAT-012, 013, 014, 015` | **HIGH** — Missing unique `{student_id, job_id}` (`DB-004`) |
| `server/src/modules/company/company.model.js` | `tbl_company` | **7** | `FEAT-007, 012, 013, 014, 016` | **HIGH** — Multi-role login & job posting |
| `server/src/modules/job/job.model.js` | `tbl_job` | **6+** | `FEAT-012, 013, 014, 015` | **HIGH** — Cascade & exam linkage |
| `server/src/modules/exam/exam.model.js` | `tbl_exam` | **4+** | `FEAT-013, 015` | **HIGH** — `exam_id` String->ObjectId migration (`DB-005`) |
| `server/src/modules/subscription/payment.model.js` | `tbl_payment` | **4+** | `FEAT-012, 013, 016` | **CRITICAL** — `exam_payment.user_id` unique bug (`DB-002`) |

---

## 3. Cross-Module Coupling Summary
- **73** cross-module `require()` edges exist in `server/src/modules/` (e.g., `dashboard.controller.js`, `job.controller.js`, `application.controller.js`, `auth.controller.js`, `login.controller.js`, `user.controller.js` directly importing models from other modules).
- **Zero circular imports** detected in `server/src/` (`0` cycles across `152` JS files, `425` edges).
- **Future New Models (`FEAT-023`, `FEAT-024`, `FEAT-025`):** `tbl_migration_history` (Dev 1), `tbl_notification` (Dev 1, blocked on spec), `tbl_institute` (Dev 1, blocked on Step 0A & Migration Plan).
