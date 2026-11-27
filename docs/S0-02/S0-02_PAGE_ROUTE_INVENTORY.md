# S0-02 — Page & Route Inventory

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Total Page Files:** 74 (`72` active/routed or layout-rendered, `2` unrouted)  
**Total Routes in `App.jsx`:** 67 (12 public/top-level + `/dashboard` + 54 child routes)

---

## 1. Public & Auth Pages (16 Common Files)

| Page / Component | Route | File Path | Layout | Roles | Key APIs | Status |
|---|---|---|---|---|---|---|
| `Landing` | `/` | `common/pages/Landing.jsx` | Standalone | Public | `GET /recruitment-subscription/plans/active`, `POST /contact/` | Fully Implemented |
| `SignIn` | `/sign-in` | `common/pages/SignIn.jsx` | Standalone | Public | `POST /login` | Fully Implemented |
| `SignUpStudent` | `/sign-up-student` | `common/pages/SignUpStudent.jsx` | Standalone | Public | `GET /dropdown/*`, `POST /register` | Fully Implemented |
| `SignUpCompany` | `/sign-up-company` | `common/pages/SignUpCompany.jsx` | Standalone | Public | `POST /company` | Fully Implemented |
| `SignUpUniversity` | `/sign-up-university` | `common/pages/SignUpUniversity.jsx` | Standalone | Public | `POST /university` | Fully Implemented |
| `SignUpCollege` | `/sign-up-college` | `common/pages/SignUpCollege.jsx` | Standalone | Public | `GET /dropdown/universities`, `POST /college` | Fully Implemented |
| `ForgotPassword` | `/forgot-password` | `common/pages/ForgotPassword.jsx` | Standalone | Public | `POST /auth/forgot-password` | Fully Implemented |
| `ResetPassword` | `/reset-password/:token` | `common/pages/ResetPassword.jsx` | Standalone | Public | `POST /auth/reset-password` | Fully Implemented |
| `AccountDeletionRequest` | `/account-deletion-request` | `common/pages/AccountDeletionRequest.jsx` | Standalone | Public | External Google Form | Fully Implemented |
| `PrivacyPolicy` | `/privacy-policy` | `common/pages/PrivacyPolicy.jsx` | Standalone | Public | None (Static) | Fully Implemented |
| `TermsOfService` | `/terms-of-service` | `common/pages/TermsOfService.jsx` | Standalone | Public | None (Static) | Fully Implemented |
| `ViewPdf` | `/view-pdf` | `common/pages/ViewPdf.jsx` | Standalone | Public | None (Query URL viewer) | Fully Implemented |
| `ErrorPage` | `errorElement` | `common/pages/ErrorPage.jsx` | Standalone | Public | None | Fully Implemented |
| `DashboardLayout` | `/dashboard` | `common/pages/DashboardLayout.jsx` | Shell | All Auth | `GET /login/current-user`, `GET /login/logout` | Partially Implemented (No route guard) |
| `Profile` | `/dashboard/{role}/profile` | `common/pages/Profile.jsx` | Dashboard | All 6 Roles | `GET /student/resume/me`, `PATCH /users/update-profile` | Fully Implemented |
| `VideoInterview` | `/dashboard/video-interview/:roomId` | `common/pages/VideoInterview.jsx` | Dashboard | Company, Student | `GET /interviews/room/:roomId`, `PATCH /interviews/:id/end`, Socket.IO | Fully Implemented |

---

## 2. Admin Pages (15 Files)

| Page | Route (`/dashboard/...`) | File Path | Key APIs | Status |
|---|---|---|---|---|
| `AdminDashboard` | `index` (role=Admin) | `admin/pages/AdminDashboard.jsx` | `GET /stats` | Fully Implemented |
| `ManageUniversity` | `admin/manage-university` | `admin/pages/ManageUniversity.jsx` | `GET /university`, `PATCH /university/:id/status/:status`, `DELETE /university/:id` | Fully Implemented |
| `ManageCollege` | `admin/manage-college` | `admin/pages/ManageCollege.jsx` | `GET /college`, `PATCH /college/:id/status/:status`, `DELETE /college/:id` | Fully Implemented |
| `ManageCompany` | `admin/manage-company` | `admin/pages/ManageCompany.jsx` | `GET /company`, `PATCH /company/:id/status/:status`, `DELETE /company/:id` | Fully Implemented |
| `ManageStudent` | `admin/manage-student` | `admin/pages/ManageStudent.jsx` | `GET /student`, `DELETE /student/:id` | Fully Implemented |
| `ManageTpo` | `admin/manage-tpo` | `admin/pages/ManageTpo.jsx` | `GET /tpo`, `DELETE /tpo/:id` | Fully Implemented |
| `ManageRecruitmentPlans` | `admin/manage-recruitment-plans` | `admin/pages/ManageRecruitmentPlans.jsx` | `GET/POST/PATCH/DELETE /recruitment-subscription/plans*`, `GET /payment` | Fully Implemented |
| `ManageCvTemplates` | `admin/manage-cv-templates` | `admin/pages/ManageCvTemplates.jsx` | `GET /cv-templates`, `POST/PATCH/DELETE /cv-templates/admin*` | Fully Implemented |
| `ContactList` | `admin/contact-list` | `admin/pages/ContactList.jsx` | `GET /contact`, `DELETE /contact/:id` | Fully Implemented |
| `AdminReport` | `admin/reports` | `admin/pages/AdminReport.jsx` | `GET /stats/admin-report` | Fully Implemented |
| `AllTransactions` | `admin/transactions` | `admin/pages/AllTransactions.jsx` | `GET /stats/transactions` | Partially Implemented (Missing sidebar link) |
| `ManageSubjects` | `admin/preparation/subjects` | `admin/pages/preparation/ManageSubjects.jsx` | `GET/POST/PATCH/DELETE /preparation/subjects*` | Fully Implemented |
| `ManageQuestions` | `admin/preparation/questions` | `admin/pages/preparation/ManageQuestions.jsx` | `GET/POST/PATCH/DELETE /preparation/questions*` | Fully Implemented |
| `ManageMockTests` | `admin/preparation/mock-tests` | `admin/pages/preparation/ManageMockTests.jsx` | `GET/POST/PATCH/DELETE /preparation/mock-tests*` | Fully Implemented |
| `ManagePdfs` | `admin/preparation/pdfs` | `admin/pages/preparation/ManagePdfs.jsx` | `GET/POST/PATCH/DELETE /preparation/pdfs*` | Fully Implemented |

---

## 3. Student Pages (20 Files)

| Page | Route (`/dashboard/...`) | File Path | Key APIs | Status |
|---|---|---|---|---|
| `StudentDashboard` | `index` (role=Student) | `student/pages/StudentDashboard.jsx` | `GET /application/student`, `GET /stats` | Fully Implemented |
| `JobFinder` | `student/job-finder` | `student/pages/JobFinder.jsx` | `GET /job-finder/meta`, `GET/POST /job-finder/searches*`, `POST /job-finder/jobs/:id/apply` | Fully Implemented |
| `OpeningList` | `student/opening-list` | `student/pages/OpeningList.jsx` | `GET /jobs/student`, `POST /application/:id` | Fully Implemented |
| `ApplyList` | `student/apply-list` | `student/pages/ApplyList.jsx` | `GET /application/student` | Fully Implemented |
| `ExamPaper` | `student/exam-paper/:id` | `student/pages/ExamPaper.jsx` | `GET /exam/:id`, `POST /paper/session/:id`, `POST /paper/:paperId/snapshot|violation|auto-submit`, `POST /paper/:id/` | Partially Implemented (Client proctoring trust + CDN scripts) |
| `ExamResult` | `exam-result/:id`, `company/exam-result/:id`, `student/exam-result/:id` | `student/pages/ExamResult.jsx` | `GET /paper/:id`, `POST /rounds/job/:jobId/advance` | Duplicate Routes |
| `StudentInterviews` | `student/my-interviews` | `student/pages/StudentInterviews.jsx` | `GET /interviews/student` | Fully Implemented |
| `Plans` | `student/plans` | `student/pages/Plans.jsx` | `GET /recruitment-subscription/plans/active`, `GET /payment/check`, `POST /payment`, `POST /payment/verify` | Partially Implemented (Client amount sent) |
| `ResumeBuilder` | `student/ai-cv-builder` | `student/pages/ResumeBuilder.jsx` | `GET /payment/check`, `GET/POST /student/resume/me`, `GET /cv-templates`, `POST /student/resume/ai-summaries`, `POST /cv-templates/compile` | Fully Implemented (Monolithic 1,954 lines) |
| `PreparationDashboard` | `student/preparation` | `student/pages/preparation/PreparationDashboard.jsx` | `GET /preparation/progress` | Fully Implemented |
| `PreviousYearPapers` | `student/preparation/previous-papers` | `student/pages/preparation/PreviousYearPapers.jsx` | `GET /preparation/questions/previous-year*`, `bookmarks*` | Fully Implemented |
| `MockTests` | `student/preparation/mock-tests` | `student/pages/preparation/MockTests.jsx` | `GET /preparation/mock-tests/active`, `POST .../start` | Fully Implemented |
| `TakeTest` | `student/preparation/take-test/:attemptId` | `student/pages/preparation/TakeTest.jsx` | `POST /preparation/mock-tests/save/:id`, `submit/:id` | Fully Implemented |
| `TestResult` | `student/preparation/test-result/:attemptId` | `student/pages/preparation/TestResult.jsx` | `GET /preparation/mock-tests/result/:id` | Fully Implemented |
| `SubjectPractice` | `student/preparation/subjects` | `student/pages/preparation/SubjectPractice.jsx` | `GET /preparation/subjects/active`, `bookmarks*` | Fully Implemented |
| `PracticeSession` | `student/preparation/practice/:subjectId` | `student/pages/preparation/PracticeSession.jsx` | `GET /preparation/questions/practice/:subjectId` | Fully Implemented |
| `ReadingMaterial` | `student/preparation/reading-material` | `student/pages/preparation/ReadingMaterial.jsx` | `GET /preparation/pdfs/active`, `POST .../reading-progress` | Fully Implemented |
| `DailyChallenge` | `student/preparation/daily-challenge` | `student/pages/preparation/DailyChallenge.jsx` | `GET/POST /preparation/daily-challenge*` | Fully Implemented |
| `PerformanceDashboard` | `student/preparation/performance` | `student/pages/preparation/PerformanceDashboard.jsx` | `GET /preparation/progress*` (4 calls) | Fully Implemented |
| `Bookmarks` | `student/preparation/bookmarks` | `student/pages/preparation/Bookmarks.jsx` | `GET/POST /preparation/bookmarks*` | Fully Implemented |

---

## 4. Company, College, University & TPO Pages (23 Files)

| Role | Page | Route (`/dashboard/...`) | Key APIs | Status |
|---|---|---|---|---|
| Company | `CompanyDashboard` | `index` (role=Company) | `GET /stats` | Fully Implemented |
| Company | `ManageJob` | `company/manage-job` | `GET/PATCH/DELETE /jobs*`, `GET /recruitment-subscription/check` | Fully Implemented |
| Company | `RoundManagement` | `company/round-management/:jobId` | `GET/POST/PATCH /rounds/*`, `POST /interviews` | Fully Implemented |
| Company | `CompanyApplications` | `company/applicants` | `GET /application/company`, `GET /application/:id/resume` | Fully Implemented |
| Company | `CompanyInterviews` | `company/company-interviews` | `GET/PATCH /interviews*` | Fully Implemented |
| Company | `RecruitmentSubscription` | *(Unrouted)* | `GET/POST /recruitment-subscription/*` | **Deprecated / Unrouted** |
| College | `CollegeDashboard` | `index` (role=College) | `GET /stats` | Fully Implemented |
| College | `ManageJob` | `college/manage-job` | `GET /jobs/college`, `DELETE /jobs/:id` | Duplicate (`tpo/`, `university/`) |
| College | `ManageStudent` | `college/manage-student` | `GET/DELETE /student*`, `PATCH /student/:id/verify` | Duplicate (`tpo/`, `university/`, `admin/`) |
| College | `ManageDegree` | `college/manage-degree` | `GET/POST/PATCH/DELETE /degree*` | Duplicate (`university/`) |
| College | `ManageBranch` | `college/manage-branch` | `GET/POST/PATCH/DELETE /branch*` | Fully Implemented |
| College | `ManageTpo` | `college/manage-tpo` | `GET/POST/PATCH/DELETE /tpo*` | Fully Implemented |
| College | `CollegeApplications` | `college/applications` | `GET /application/institution` | Duplicate (`tpo/`) |
| University | `UniversityDashboard` | `index` (role=University) | `GET /stats` | Fully Implemented |
| University | `ManageCollege` | `university/manage-college` | `GET /college/my-colleges` | Fully Implemented |
| University | `ManageJob` | `university/manage-job` | `GET /jobs/college`, `DELETE /jobs/:id` | Duplicate |
| University | `ManageStudent` | `university/manage-student` | `GET/DELETE /student*` | Duplicate |
| University | `ManageDegree` | `university/manage-degree` | `GET /degree`, `GET /branch` | Duplicate |
| University | `ManageBranch` | *(Unrouted)* | `GET /degree`, `GET /branch` | **Deprecated / Unrouted** |
| TPO | `TpoDashboard` | `index` (role=TPO) | `GET /stats` | Fully Implemented |
| TPO | `ManageJob` | `tpo/manage-job` | `GET /jobs/college`, `PATCH /jobs/:id/approve`, `DELETE /jobs/:id` | Duplicate |
| TPO | `ManageStudent` | `tpo/manage-student` | `GET/DELETE /student*`, `PATCH /student/:id/verify` | Duplicate |
| TPO | `TpoApplications` | `tpo/applications` | `GET /application/institution` | Duplicate |
