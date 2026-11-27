# S0-05 — Web & Flutter API Integration Mapping

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Cross-References:** `docs/S0-02/S0-02_API_INTEGRATION_AUDIT.md`, `docs/S0-03/S0-03_API_BACKEND_INTEGRATION_AUDIT.md`

---

## 1. Platform Integration Summary

- **Web Frontend (`client/`):** **215** `customFetch` call sites across **~85** distinct backend endpoints (covering all 6 roles).
- **Flutter Mobile (`flutter_student_app/`):** **55** call sites across **38** distinct backend endpoints (Student role only).

---

## 2. Cross-Platform Integration Matrix & Mismatches

| Backend Endpoint Group | Web (`client/`) | Flutter (`flutter_student_app/`) | Integration Status / Mismatches |
|---|---|---|---|
| `POST /api/login`, `GET /api/login/current-user`, `/logout` | `SignIn.jsx`, `DashboardLayout.jsx` | `AuthService` | **Partially Integrated:** Web stores JWT in `localStorage` (`FE-002`); Flutter lacks `role === 'Student'` check (`FL-003`). |
| `POST /api/auth/forgot-password`, `/reset-password` | `ForgotPassword.jsx`, `ResetPassword.jsx` | `ForgotPasswordScreen` only | Reset password is Web-only via email link; works as expected. |
| `POST /api/auth/register`, `POST /api/auth/login` | Unused | Unused | **Unused / Broken** (`API-ISSUE-010`). |
| `PATCH /api/users/update-profile` | `Profile.jsx` | `ProfileScreen` | **Incorrect Request Risk:** Both send unfiltered fields to mass-assignment endpoint (`API-ISSUE-007`). |
| `GET /api/dropdown/*` | `SignUpStudent`, `SignUpCollege`, `CreateJobModal`, `ManageTpo` | `RegisterScreen` | **Correctly Integrated** across both platforms. |
| `POST /api/register` | `SignUpStudent.jsx` | `RegisterScreen` | **Security Risk:** Relies on unauthenticated `/api/register` (`API-ISSUE-003`). |
| `GET /api/jobs/student`, `POST /api/application/:id`, `GET /api/application/student` | `OpeningList.jsx`, `ApplyList.jsx` | `HomeScreen`, `JobListScreen`, `JobDetailScreen`, `MyApplicationsScreen` | **Correctly Integrated.** |
| `GET /api/exam/:id`, `POST /api/paper/*` | `ExamPaper.jsx`, `ExamResult.jsx` | `ExamScreen` | **Incorrect Request (`API-ISSUE-009`):** Both send client `trustScore`/`totalViolations`; Web `ExamResult.jsx` also calls `POST /rounds/job/:jobId/advance`! |
| `GET /api/interviews/student` | `StudentInterviews.jsx` + `VideoInterview.jsx` | `InterviewListScreen` | **Broken on Flutter (`API-ISSUE-012`):** `_joinInterview` uses API `baseUrl` instead of Web client URL. |
| `POST /api/payment`, `POST /api/payment/verify`, `GET /api/payment/check` | `Plans.jsx`, `ResumeBuilder.jsx` | `PlansScreen`, `ResumeService` | **Incorrect Request (`API-ISSUE-006`):** Both send client `amount` instead of `plan_id` only. |
| `/api/preparation/*` (32 endpoints) | 15 Admin + Student pages | 11 Student screens | **Correctly Integrated** on both platforms. |
| `/api/job-finder/*` (21 endpoints) | `JobFinder.jsx` (Student) | `JobFinderService` (Student) | **Correctly Integrated** (Admin endpoints intentionally Web-only). |
| `/api/sessions/*`, `/api/upload/*`, `/api/aiexam/*` | Unused | Unused | **Unused** backend endpoints. |
