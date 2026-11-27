# Dev 1 — API Shared Contract Map

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-09 | **Owner:** Dev 1  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Authoritative API Contract Registry
- **Backend Route Registry:** `server/src/config/routes.js` (`30` `app.use` mounts, `27` route files, `4` direct routes; `217` mounted / `216` unique endpoints + `6` unmounted).
- **Web Consumer:** `client/src/utils/customFetch.js` (`76` file importers, `215` call sites, `148` unique `METHOD+path`).
- **Flutter Consumer:** `flutter_student_app/lib/services/api_service.dart` (`27` file importers) + `auth_service.dart` (`10`) + `job_finder_service.dart` (`2`) + `resume_service.dart` (`2`).

---

## 2. Cross-Platform Critical API Contracts

| Contract Group | Authoritative Backend Route(s) | Web Consumer(s) | Flutter Consumer(s) | Coordination Rule |
|---|---|---|---|---|
| **Auth & Session** | `auth/auth.route.js`, `auth/login.route.js`, `auth/user.route.js` | `SignIn.jsx`, `DashboardLayout.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx` | `auth_service.dart`, `login_screen.dart` | Dev 1 owns response/cookie/status; Dev 2 updates `customFetch` & `AuthService` after contract approval |
| **Student & Resume** | `student/student.route.js`, `student/resume.route.js` | `Profile.jsx`, `ResumeBuilder.jsx`, `SignUpStudent.jsx` | `profile_screen.dart`, `resume_service.dart`, `ai_resume_screen.dart` | Isolate `/api/register` (`AUD-013`) requires joint payload verification |
| **Jobs & Applications** | `job/job.route.js`, `application/application.route.js` | `ManageJob.jsx`, `ApplyList.jsx`, `CompanyApplications.jsx` | `jobs_screen.dart`, `job_detail_screen.dart`, `applications_screen.dart` | Unique constraint & ownership checks (`FEAT-013`) |
| **Rounds, Interviews & Exams** | `interview/round.route.js`, `interview/interview.route.js`, `exam/exam.route.js`, `exam/paper.route.js` | `RoundManagement.jsx`, `VideoInterview.jsx`, `ExamPaper.jsx` | `interview_list_screen.dart`, `exam_screen.dart` | Fix Flutter `_joinInterview` URL (`FL-005`) & `isCorrect` leak (`AUD-015`) |
| **Payments & Subscriptions** | `subscription/payment.route.js`, `subscription/subscription.route.js` | `Plans.jsx`, `ManageRecruitmentPlans.jsx` | `plans_screen.dart`, `premium_paywall.dart` | Server-side Razorpay amount (`AUD-007`) — Dev 1 authoritative |
| **Preparation Suite** | `preparation/*/*.route.js` (`32` APIs) | `26` Web prep pages | `11` Flutter prep screens | `REUSE` (`FEAT-003`) — freeze contract |
| **Market Job Finder** | `jobFinder/jobFinder.route.js` | `JobFinder.jsx` | `job_finder_service.dart`, `market_jobs_screen.dart` | Fix `tbl_user` refs (`DB-001`) before Flutter Dio unification |
| **File Upload** | `upload/upload.route.js`, `fileUploadMiddleware.js` | Entity forms | `profile_screen.dart` | `DELETE /:filename` ownership check (`AUD-011`) |
