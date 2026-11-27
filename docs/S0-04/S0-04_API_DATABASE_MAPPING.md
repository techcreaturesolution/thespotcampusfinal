# S0-04 — API-to-Database Mapping

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Cross-References:** `docs/S0-01/S0-01_API_INVENTORY.md`, `docs/S0-02/S0-02_API_INTEGRATION_AUDIT.md`, `docs/S0-03/S0-03_API_BACKEND_INTEGRATION_AUDIT.md`

---

## 1. Core API-to-Collection Dependency Matrix

| Module / Route Prefix | Models / Collections Read | Models / Collections Written / Updated / Deleted | Aggregations / Transactions / Notes |
|---|---|---|---|
| `/api/auth/*` | `tbl_admin`, `tbl_student`, `tbl_company`, `tbl_college`, `tbl_university`, `tbl_tpo`, `tbl_password_reset` | `tbl_admin` (`register`), `tbl_password_reset` (upsert/delete), password update on matched user | `POST /api/auth/login` field mismatch (`AUD-017`) |
| `/api/login/*` | All 6 user collections (`tbl_admin`, `tbl_student`, `tbl_company`, `tbl_college`, `tbl_university`, `tbl_tpo`) | None (read-only + JWT issue) | Populates `college_id`, `university_id`, `degree_id`, `branch_id` |
| `/api/users/*` | Matched user collection by `req.user.role` | Matched user collection (`findByIdAndUpdate` with `req.body`) | Mass assignment risk (`AUD-008`) |
| `/api/university/*` | `tbl_university`, `tbl_college` | `tbl_university` | N+1 `countDocuments` on `tbl_college` |
| `/api/college/*` | `tbl_college`, `tbl_degree`, `tbl_tpo` | `tbl_college` | N+1 `countDocuments` on `tbl_degree` & `tbl_tpo` |
| `/api/tpo/*` | `tbl_tpo`, `tbl_college`, `tbl_university`, `tbl_degree` | `tbl_tpo` | `isEmailExists` checks all 6 user collections |
| `/api/degree/*` & `/api/branch/*` | `tbl_degree`, `tbl_branch`, `tbl_college`, `tbl_tpo` | `tbl_degree`, `tbl_branch` | No role checks on writes |
| `/api/degreeMaster/*` | `tbl_degree_master` | `tbl_degree_master` | Unauthenticated CRUD (`AUD-003`) |
| `/api/company/*` | `tbl_company`, `tbl_jobpost` | `tbl_company`, `tbl_jobpost`, `tbl_application` (on delete) | Non-transactional cascade delete (`DB-006`) |
| `/api/student/*` & `/api/register/*` | `tbl_student`, `tbl_tpo`, `tbl_resume` | `tbl_student`, `tbl_resume` | `/api/register` exposes `GET` all students |
| `/api/cv-templates/*` | `tbl_cv_template`, `tbl_resume`, `tbl_student` | `tbl_cv_template` (`GET /` mutates DB!), `tbl_resume` (`ai_compiled_html`) | Side-effect write on `GET /cv-templates` |
| `/api/jobs/*` | `tbl_jobpost`, `tbl_exam`, `tbl_student`, `tbl_application`, `tbl_tpo`, `tbl_college`, `tbl_degree` | `tbl_jobpost`, `tbl_application`, `tbl_exam` (on delete) | Non-transactional cascade delete (`DB-006`) |
| `/api/application/*` | `tbl_application`, `tbl_student`, `tbl_exam`, `tbl_jobpost`, `tbl_payment`, `tbl_tpo`, `tbl_resume` | `tbl_application` | Duplicate application race condition (`DB-004`) |
| `/api/exam/*` | `tbl_exam`, `tbl_jobpost` | `tbl_exam` | Stores AI-generated `questions[]` inline |
| `/api/paper/*` | `tbl_paper`, `tbl_exam`, `tbl_application`, `tbl_candidate_round` | `tbl_paper`, `tbl_candidate_round` | `exam_id` stores `job_id` string (`DB-005`) |
| `/api/rounds/*` | `tbl_jobpost`, `tbl_application`, `tbl_candidate_round`, `tbl_interview` | `tbl_jobpost`, `tbl_application`, `tbl_candidate_round`, `tbl_interview` | Uses `tbl_candidate_round.aggregate` for progress; no transactions (`DB-006`) |
| `/api/interviews/*` | `tbl_interview`, `tbl_candidate_round`, `tbl_recruitment_subscription` | `tbl_interview`, `tbl_candidate_round`, `tbl_recruitment_subscription` | Auto-expires past interviews on read |
| `/api/stats/*` | All 13 core collections + `tbl_payment`, `tbl_recruitment_subscription`, `exam_payment` | None (read-only) | Unpaginated financial & admin reports |
| `/api/payment/*` & `/api/aiexam/*` | `tbl_student`, `tbl_payment`, `tbl_recruitment_plan`, `exam_payment` | `tbl_payment`, `exam_payment` | `exam_payment.user_id` unique bug (`DB-002`) |
| `/api/recruitment-subscription/*` | `tbl_recruitment_plan`, `tbl_recruitment_subscription`, `tbl_interview` | `tbl_recruitment_plan`, `tbl_recruitment_subscription` | `checkSubscription` bypasses DB for `Company` role |
| `/api/preparation/*` | All 9 `tbl_prep_*` collections | `tbl_prep_*` collections | `subject.controller.js` uses `Question.aggregate` |
| `/api/job-finder/*` | `JobPosting`, `JobSearch`, `AutoImportRule`, `AgentRun`, `SearchCache`, `JobFinderSettings` | All 6 `jobFinder` collections | Uses `AgentRun.aggregate`; dangling `tbl_user` refs (`DB-001`) |
| `/api/contact/*` | `tbl_contact` | `tbl_contact` | Unauthenticated `GET` & `DELETE` |
| `/api/ (global)` | `tbl_idempotency_key` | `tbl_idempotency_key` | `requireIdempotency` middleware |

---

## 2. Web & Flutter Database Dependency Summary

- **Web Frontend (`client/`):** Consumes all 27 mounted route groups (except `/api/auth/register`, `/api/auth/login`, `/api/upload/*`, `/api/aiexam/*`, `/api/sessions/*`).
- **Flutter App (`flutter_student_app/`):** Consumes Student-scoped endpoints backed by `tbl_student`, `tbl_university`, `tbl_college`, `tbl_degree`, `tbl_branch`, `tbl_jobpost`, `tbl_application`, `tbl_exam`, `tbl_paper`, `tbl_interview`, `tbl_payment`, `tbl_recruitment_plan`, `tbl_resume`, `tbl_cv_template`, all 9 `tbl_prep_*` collections, and `JobPosting`/`JobSearch`.
