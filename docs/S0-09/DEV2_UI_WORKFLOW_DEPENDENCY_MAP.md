# Dev 2 — UI & Workflow Dependency Map

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-09 | **Owner:** Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Web & Flutter Import Graph Summary
- **Web (`client/src/`):** `106` JS/JSX files, `260` internal import edges, **0 circular dependencies**.
  - Top shared hubs: `customFetch.js` (`76`), `Loading.jsx` (`53`), `PageHeader.jsx` (`46`), `DataTable.jsx` (`15`), `IconButton.jsx` (`12`), `SEO.jsx` (`10`), `DashboardCard.jsx` (`6`).
- **Flutter (`flutter_student_app/lib/`):** `38` Dart files, `85` internal import edges, **0 circular dependencies**.
  - Top shared hubs: `api_service.dart` (`27`), `auth_service.dart` (`10`), `premium_paywall.dart` (`6`), `constants.dart` (`5`), `market_job_models.dart` (`3`), `job_finder_service.dart` (`2`), `resume_service.dart` (`2`).

---

## 2. Core UI Workflow Dependency Chains

| Workflow | Web Chain (Dev 2) | Flutter Chain (Dev 2) | Backend Dependency (Dev 1) |
|---|---|---|---|
| **Authentication** | `SignIn.jsx` -> `customFetch.js` -> `DashboardLayout.jsx` -> `App.jsx` | `login_screen.dart` -> `auth_service.dart` -> `api_service.dart` -> `home_screen.dart` | `auth.route.js`, `authMiddleware.js` (`BLOCKING`: `AUD-001, 014, 017`) |
| **Student Profile** | `Profile.jsx` -> `customFetch.js` + `PageHeader.jsx` | `profile_screen.dart` -> `api_service.dart` + `auth_service.dart` | `student.route.js`, `student.model.js` (`BLOCKING`: `AUD-004, 013`) |
| **Job & Apply** | `ApplyList.jsx` / `ManageJob.jsx` -> `DataTable.jsx` + `customFetch.js` | `jobs_screen.dart` -> `job_detail_screen.dart` -> `api_service.dart` | `job.route.js`, `application.route.js` (`BLOCKING`: `AUD-012, DB-004`) |
| **Exam & Interview** | `ExamPaper.jsx` / `VideoInterview.jsx` -> `customFetch.js` / `socket.io-client` | `exam_screen.dart` / `interview_list_screen.dart` -> `api_service.dart` | `exam.route.js`, `interview.route.js`, `socket.js` (`BLOCKING`: `AUD-015, FL-005`) |
| **Payment** | `Plans.jsx` -> `loadScript.js` + `customFetch.js` | `plans_screen.dart` -> `premium_paywall.dart` -> `api_service.dart` | `payment.route.js` (`BLOCKING`: `AUD-007, DB-002`) |
