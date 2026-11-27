# S0-08 — Dev 2 Role-Based Feature Classification

**Owner:** Dev 2 | **Roles:** `Admin`, `University`, `College`, `TPO`, `Company`, `Student`

| Role | Platform | Access & CRUD Scope (Existing) | Classification & Required UI/RBAC Alignment |
|---|---|---|---|
| **Admin** | Web Only | Full platform CRUD, Preparation CMS, CV Templates, Plans, Reports, Transactions | **ENHANCEMENT:** Add `<RoleGuard allowedRoles={['Admin']}>` (`FE-001`) + sidebar link for `AllTransactions` (`FE-014`). |
| **University** | Web Only | View affiliated colleges, students, jobs, degrees | **ENHANCEMENT:** Add `<RoleGuard>`; remove dead `ManageBranch.jsx` (`FE-013`). |
| **College** | Web Only | Manage degrees, branches, TPOs, students, jobs, applications | **ENHANCEMENT:** Consolidate duplicate `ManageStudent`/`ManageJob` with `TPO`/`University` (`FE-012`); prepare Institute terminology. |
| **TPO** | Web Only | Verify students, approve jobs, view applications | **ENHANCEMENT:** Consolidate duplicate UIs (`FE-012`); enforce `<RoleGuard>`. |
| **Company** | Web Only | Manage jobs, rounds, interviews, AI exams, view sanitized applicants | **ENHANCEMENT:** Enforce `<RoleGuard>`; archive dead `RecruitmentSubscription.jsx` (`FE-013`). |
| **Student** | Web + Flutter | Profile, Resume, Jobs, Applications, Preparation, Exams, Interviews, Plans | **ENHANCEMENT:** Fix `Plans` (`amount`), `ExamPaper`/`ExamScreen` (`trustScore`), Flutter `_joinInterview` (`FL-005`), Flutter `role == 'Student'` gate (`FL-003`). |
