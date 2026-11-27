# S0-07 — Role Workflow Matrix

**Project:** The Spot Campus (`thespotcampusfinal`) | **Roles:** 6 (`Admin`, `University`, `College`, `TPO`, `Company`, `Student`)

| Role | Web Portal Status | Flutter App Status | Backend Auth/RBAC Status | Overall Role Readiness |
|---|---|---|---|---|
| **Admin** | `PARTIALLY_WORKING` (L2 Build Pass; no `<RoleGuard>`) | N/A (Web-only) | `PARTIALLY_WORKING` (Missing RBAC on reports/payments/university/cv-admin) | `PARTIALLY_WORKING` |
| **University** | `PARTIALLY_WORKING` (`ManageBranch` unrouted) | N/A (Web-only) | `PARTIALLY_WORKING` (`/api/university` public; `updateStudent` bypass) | `PARTIALLY_WORKING` |
| **College** | `PARTIALLY_WORKING` (Duplicate pages) | N/A (Web-only) | `PARTIALLY_WORKING` (`updateCollege` mass assignment) | `PARTIALLY_WORKING` |
| **TPO** | `PARTIALLY_WORKING` (Duplicate pages) | N/A (Web-only) | `PARTIALLY_WORKING` (`tpo_status` ignored; `tpo.route` lacks RBAC) | `PARTIALLY_WORKING` |
| **Company** | `PARTIALLY_WORKING` (`RecruitmentSubscription` unrouted) | N/A (Web-only) | `PARTIALLY_WORKING` (`rounds` 0 RBAC; `exam_payment` unique bug) | `PARTIALLY_WORKING` |
| **Student** | `PARTIALLY_WORKING` (`Plans`/`ExamPaper` issues) | `PARTIALLY_WORKING` (`_joinInterview` broken; no `ExamResult`) | `PARTIALLY_WORKING` (`/api/register` PII leak; `isVerifiedByTPO` bypass) | `PARTIALLY_WORKING` |
