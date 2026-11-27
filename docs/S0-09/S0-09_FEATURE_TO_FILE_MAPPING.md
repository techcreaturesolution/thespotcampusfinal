# S0-09 — Feature-to-File Mapping (`FEAT-001` to `FEAT-025`)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

| Feature ID | Feature Name | Class | Backend & DB Files (Dev 1) | Web Files (Dev 2) | Flutter Files (Dev 2) | Shared / Conflict Files | Primary / Secondary | Readiness |
|---|---|---|---|---|---|---|---|---|
| `FEAT-001` | Dropdown & Lookups | REUSE | `dropdown/*`, 7 models | `SignUp*`, `Profile` | `edit_profile_screen.dart` | `routes.js` | Dev 1 / Dev 2 | READY |
| `FEAT-002` | Idempotency Guard | REUSE | `idempotency/*` (`tbl_idempotency_key`) | `customFetch.js` | NOT APPLICABLE | `app.js`, `customFetch.js` | Dev 1 / Dev 2 | READY |
| `FEAT-003` | Preparation Suite | REUSE | `preparation/**` (9 models) | `admin/Manage*` + `student/*` (26 pages) | `screens/prep/*` (11 screens) | `authMiddleware.js` | Dev 1 / Dev 2 | READY |
| `FEAT-004` | Public Landing & Contact | REUSE | `contact/*` | `Landing.jsx`, `PrivacyPolicy.jsx`, `TermsOfService.jsx` | NOT APPLICABLE | `routes.js` | Dev 2 / Dev 1 | READY |
| `FEAT-005` | Password Reset | REUSE | `auth/auth.controller.js`, `passwordReset.model.js` | `ForgotPassword.jsx`, `ResetPassword.jsx` | `forgot_password_screen.dart` | `auth.route.js` | Dev 1 / Dev 2 | READY |
| `FEAT-006` | AI CV Builder | REUSE | `student/resume.*`, `cvTemplates.js` | `student/ResumeBuilder.jsx`, `ResumePreview.jsx` | `resume_service.dart`, `ai_resume_screen.dart` | `fileUploadMiddleware.js` | Dev 1 / Dev 2 | READY |
| `FEAT-007` | Multi-Role Auth | ENHANCEMENT | `auth/*`, `login.controller.js`, `authMiddleware.js` | `SignIn.jsx`, `DashboardLayout.jsx` | `auth_service.dart`, `login_screen.dart` | `auth.route.js`, `authMiddleware.js`, `customFetch.js` | Dev 1 / Dev 2 | BLOCKED (`AUD-001,014,017`) |
| `FEAT-008` | Admin Portal | ENHANCEMENT | `dashboard/*`, `contact/*`, `payment/*` | `client/src/admin/**` (23 files), `App.jsx` | NOT APPLICABLE | `authMiddleware.js`, `App.jsx` | Dev 1 / Dev 2 | BLOCKED (`AUD-006,009,010`) |
| `FEAT-009` | University Mgmt | ENHANCEMENT | `university/*`, `college.model.js` | `client/src/university/**` (8 files) | NOT APPLICABLE | `college.model.js` | Dev 1 / Dev 2 | BLOCKED (`AUD-002`) |
| `FEAT-010` | College, Degree, Branch, TPO | ENHANCEMENT | `college/*`, `degree/*`, `branch/*`, `tpo/*` | `college/**`, `tpo/**`, `university/**` | NOT APPLICABLE | `college.model.js`, `tpo.model.js` | Dev 1 / Dev 2 | BLOCKED (`AUD-003,008, FE-012`) |
| `FEAT-011` | Student Profile & Verif | ENHANCEMENT | `student/*`, `auth.route.js` (`/api/register`) | `Profile.jsx`, `SignUpStudent.jsx`, `ManageStudent.jsx` | `profile_screen.dart`, `edit_profile_screen.dart` | `auth.route.js`, `student.model.js` | Dev 1 / Dev 2 | BLOCKED (`AUD-004,013`) |
| `FEAT-012` | Company & Job Posting | ENHANCEMENT | `company/*`, `job/*` | `company/ManageJob.jsx`, `CreateJobModal.jsx` | `jobs_screen.dart`, `job_detail_screen.dart` | `job.model.js`, `company.model.js` | Dev 1 / Dev 2 | BLOCKED (`AUD-008,028`) |
| `FEAT-013` | Job Applications | ENHANCEMENT | `application/*` | `ApplyList.jsx`, `CompanyApplications.jsx` | `applications_screen.dart` | `application.model.js` | Dev 1 / Dev 2 | BLOCKED (`AUD-012, DB-004`) |
| `FEAT-014` | Rounds & Interviews | ENHANCEMENT | `interview/round.*`, `interview/interview.*`, `socket.js` | `RoundManagement.jsx`, `VideoInterview.jsx` | `interview_list_screen.dart` | `socket.js`, `api_service.dart` | Dev 1 / Dev 2 | BLOCKED (`AUD-005, FL-005`) |
| `FEAT-015` | AI Exam & Paper | ENHANCEMENT | `exam/*`, `generateMCQs.js` | `ExamPaper.jsx`, `ExamResult.jsx` | `exam_screen.dart` | `exam.model.js` (`exam_id`) | Dev 1 / Dev 2 | BLOCKED (`AUD-015, DB-005`) |
| `FEAT-016` | Payments & Subs | ENHANCEMENT | `subscription/*` | `Plans.jsx`, `ManageRecruitmentPlans.jsx` | `plans_screen.dart`, `premium_paywall.dart` | `payment.route.js` | Dev 1 / Dev 2 | BLOCKED (`AUD-007, DB-002`) |
| `FEAT-017` | Market Job Finder | ENHANCEMENT | `jobFinder/**` | `student/JobFinder.jsx` | `job_finder_service.dart`, `market_jobs_screen.dart` | `api_service.dart` | Dev 1 / Dev 2 | BLOCKED (`DB-001, FL-008`) |
| `FEAT-018` | File Upload & Storage | ENHANCEMENT | `upload/*`, `fileUploadMiddleware.js`, `multerMiddleware.js` | Entity upload forms | `profile_screen.dart` | `fileUploadMiddleware.js`, `uploads.js` | Dev 1 / Dev 2 | BLOCKED (`AUD-011`) |
| `FEAT-019` | Shared Web UI & Lint | ENHANCEMENT | NOT APPLICABLE | `DataTable.jsx`, `App.jsx`, `eslint.config.js` | NOT APPLICABLE | `App.jsx`, `DataTable.jsx` | Dev 2 / None | BLOCKED (`FE-009, 010`) |
| `FEAT-020` | Flutter Net & Sec | ENHANCEMENT | NOT APPLICABLE | NOT APPLICABLE | `api_service.dart`, `AndroidManifest.xml`, `Info.plist` | `api_service.dart`, `constants.dart` | Dev 2 / Dev 1 | BLOCKED (`FL-001, 004, 022`) |
| `FEAT-021` | DB Integrity & Index | ENHANCEMENT | `38` `.model.js` files | NOT APPLICABLE | NOT APPLICABLE | `college.model.js`, `student.model.js` | Dev 1 / None | BLOCKED (`DB-003..011`) |
| `FEAT-022` | Automated Tests | NEW | `server/tests/*` (PENDING) | `client/tests/*` (PENDING) | `flutter_student_app/test/*` | `package.json`, `pubspec.yaml` | Joint | READY |
| `FEAT-023` | DB Migration Runner | NEW | `server/src/migrations/*` (PENDING) | NOT APPLICABLE | NOT APPLICABLE | `server/package.json` | Dev 1 / None | READY |
| `FEAT-024` | Notifications | NEW | `notification/*` (PENDING) | Web bell/toast (PENDING) | `flutter_local_notifications` (PENDING) | `socket.js`, `constants.dart` | Joint | WAITING (Spec) |
| `FEAT-025` | Unified Institute | NEW | `institute/*` (PENDING), `college/*` | `institute/*` (PENDING) | `edit_profile_screen.dart` | `college.model.js`, `constants.js`, `App.jsx` | Joint (Dev 1 Lead) | WAITING (Step 0A + Plan) |
