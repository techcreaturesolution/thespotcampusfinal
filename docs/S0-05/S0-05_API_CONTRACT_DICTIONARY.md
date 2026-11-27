# S0-05 — Complete API Contract Dictionary

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Scope:** Canonical endpoint contract reference (`API-001` to `API-217` grouped by module; derived strictly from verified source code).

---

## 1. Authentication & User (`API-001` – `API-013`)

| API ID | Method & Endpoint | Auth | RBAC | Request Contract | Response Contract |
|---|---|---|---|---|---|
| `API-001` | `POST /api/auth/register` | Public | **None** | `registerValidation` (`firstName`, `lastName`, `email`, `password`) vs controller `req.body.admin_password` | `201 { msg }` / `500 { error }` |
| `API-002` | `POST /api/auth/login` | Public | None | `loginValidation` (`email`, `password`) vs controller `admin_email`, `admin_password` (Broken) | `200 { msg, token, admin }` / `401` |
| `API-003` | `GET /api/auth/logout` | Public | None | None | `200 { msg }` + clears `token` cookie |
| `API-004` | `POST /api/auth/forgot-password` | Public | None | `{ email }` | `200 { msg }` (generic anti-enumeration) |
| `API-005` | `POST /api/auth/reset-password` | Public | None | `{ token, password }` (`min 6`) | `200 { msg }` / `400` / `404` |
| `API-006` | `POST /api/login` *(dup `/api/logout`)* | Public | None | `{ email, password }` | `200 { msg, token, user, role }` + `httpOnly` cookie / `401` |
| `API-007` | `GET /api/login/logout` *(dup `/api/logout/logout`)* | Public | None | None | `200 { msg }` + clears `token` cookie |
| `API-008` | `GET /api/login/current-user` *(dup `/api/users/current-user`)* | Auth | Any | Bearer or Cookie `token` | `200 { user, role }` / `404` |
| `API-009` | `PATCH /api/users/update-profile` | Auth | Self | `multipart/form-data` (`profile_image` + `req.body` fields) | `200 { msg, user, role }` |

---

## 2. Academic Hierarchy & Dropdowns (`API-010` – `API-047`)

- **University (`/api/university`, 6 endpoints):** `GET /`, `POST /` (`university_logo`), `GET /:id`, `PATCH /:id` (`university_logo`), `DELETE /:id`, `PATCH /:id/status/:status` — **All Public**; returns `{ universitys }` / `{ university }`.
- **College (`/api/college`, 7 endpoints):** `GET /my-colleges` (Auth, University), `GET /` (Public, optional University filter), `POST /` (Public, `college_logo`), `GET /:id` (Public), `PATCH /:id` (Auth, College/Admin), `DELETE /:id` (Admin), `PATCH /:id/status/:status` (Admin).
- **TPO (`/api/tpo`, 5 endpoints):** `GET /`, `POST /` (`tpo_image`), `GET /:id`, `PATCH /:id`, `DELETE /:id` — Auth required; **No role check**.
- **Degree (`/api/degree`, 5) & Branch (`/api/branch`, 5):** `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` — Auth required; **No role check**.
- **DegreeMaster (`/api/degreeMaster`, 5):** `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` — **All Public**.
- **Dropdown (`/api/dropdown`, 7):** `GET /universities`, `/colleges?university_id=`, `/degrees?college_id=`, `/branches?degree_id=&college_id=`, `/degree-masters`, `/unique-degrees`, `/colleges-by-degree?degree_name=` — Public read-only.

---

## 3. Company, Student, CV Templates (`API-048` – `API-075`)

- **Company (`/api/company`, 6):** `GET /` (Public), `POST /` (Public, `company_logo`), `GET /:id` (Public), `PATCH /:id` (Auth, Company/Admin), `DELETE /:id` (Admin), `PATCH /:id/status/:status` (Admin).
- **Student (`/api/student` & `/api/register`, 8x2=16):** `GET /` (Auth on `/student`, **Public on `/register`**), `POST /` (`profileImage` + `studentValidation`), `PATCH /:id/verify` (`{ isVerifiedByTPO }`, TPO/College), `GET/POST /resume/me` (`resume` file or JSON), `POST /resume/ai-summaries`, `GET/PATCH/DELETE /:id`.
- **CV Templates (`/api/cv-templates`, 6):** `GET /` (Auth, mutates DB on read), `POST /compile` (Auth), `GET /download-pdf` (Auth, returns PDF bytes), `POST /admin` (`thumbnail`), `PATCH /admin/:id`, `DELETE /admin/:id` (Auth, **missing Admin guard**).

---

## 4. Jobs, Applications, Exams, Papers, Rounds, Interviews (`API-076` – `API-125`)

- **Jobs (`/api/jobs`, 8):** `GET /` (Company), `POST /` (`jobValidation`), `GET /college` (TPO/College/University), `GET /student?search=&job_type=&sort=`, `PATCH /:id/approve` (`{ approved }`, TPO), `GET/PATCH/DELETE /:id`.
- **Applications (`/api/application`, 8):** `GET /student`, `GET /company` (sanitizes student email/contact), `GET /institution` (College/TPO), `GET /:id/resume` (returns compiled CV HTML/CSS), `GET /:id` (by `job_id`), `POST /:id` (requires active `tbl_payment` + compiled `tbl_resume`), `PATCH /:id`, `DELETE /:id`.
- **Exam (`/api/exam`, 7):** `GET /`, `POST /from-jd` (`{ job_id, title, noOfQuestion, hard, medium, easy, timeLimit, proctoring }`), `GET /:id` (by `job_id`), `GET /detail/:id`, `PATCH /:id`, `DELETE /:id`, `PATCH /:id/proctoring`.
- **Paper (`/api/paper`, 8):** `POST /:id` (`{ answers, proctoring }`), `GET /:id` (by `job_id`), `DELETE /:id`, `POST /session/:examId` (`{ browserInfo }`), `POST /:paperId/violation` (`{ type, details }`), `POST /:paperId/snapshot` (`{ imageUrl, faceDetected, multipleFaces }`), `POST /:paperId/auto-submit`, `GET /:paperId/proctoring`.
- **Rounds (`/api/rounds`, 9):** `GET/POST /job/:id/rounds`, `PATCH /job/:jobId/round/:roundId/status`, `GET /job/:jobId/round/:roundNumber/candidates`, `POST /job/:jobId/advance` (`{ student_ids, current_round, action }`), `POST /job/:jobId/initialize`, `GET /job/:jobId/progress`, `PATCH /candidate/:id`, `GET /student/job/:jobId` — **All missing role/ownership checks**.
- **Interviews (`/api/interviews`, 11):** `POST /`, `GET /`, `POST /bulk`, `GET /job/:jobId`, `GET /student`, `GET /room/:roomId`, `GET/PATCH /:id`, `PATCH /:id/start`, `PATCH /:id/end`, `PATCH /:id/cancel`.

---

## 5. Dashboard, Payments, Subscriptions, Preparation, Upload, Contact, JobFinder (`API-126` – `API-217`)

- **Dashboard (`/api/stats`, 3):** `GET /` (role-scoped), `GET /admin-report` (**missing Admin guard**), `GET /transactions` (**missing Admin guard**).
- **Student Payment (`/api/payment` & `/api/order`, 5x2=10):** `POST /` (`{ amount, plan_name, description }`), `GET /` (**missing Admin guard**), `POST /verify` (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`), `GET /check`, `GET /my-payments`.
- **Exam Payment (`/api/aiexam`, 3):** `POST /`, `POST /verify`, `GET /verify/:id`.
- **Recruitment Subscription (`/api/recruitment-subscription`, 11):** `GET /plans/active`, `GET/POST /plans` (Admin), `PATCH/DELETE /plans/:id` (Admin), `GET /all` (Admin), `POST /order` & `/verify` & `GET /my` (Company), `GET /check` & `/check/:id`.
- **Preparation (`/api/preparation`, 32):** Auth + `requireStudentSubscription`; `Admin` on all create/update/delete/import endpoints; Student read/attempt/bookmark/progress endpoints.
- **Upload (`/api/upload`, 11):** `POST` single/multi/mixed endpoints (`profile-image`, `avatar`, `resume`, `cv`, `company-logo`, `document`, `exam-file`, `multiple-documents`, `multiple-images`, `mixed`), `DELETE /:filename` (no ownership check).
- **Contact (`/api/contact`, 3):** `GET /` (Public!), `POST /` (`contactValidation`), `DELETE /:id` (Public!).
- **JobFinder (`/api/job-finder`, 21):** 8 Student endpoints (`/meta`, `/search`, `/searches`, `/searches/:id`, `/job/:id`, `/jobs/:id`, `/job/:id/apply`, `/jobs/:id/apply`) + 13 `Admin` endpoints (`/admin/*`).

---

## 6. Complete Endpoint-by-Endpoint Index (API-001 to API-217)

| API ID | Method | Effective URL | Route File | Handler | Auth | Route RBAC |
|---|---|---|---|---|---|---|
| `API-001` | `GET` | `/api/test` | `app.js` | `res` | Public | None |
| `API-002` | `POST` | `/api/ct-report` | `app.js` | `res` | Public | None |
| `API-003` | `POST` | `/api/csp-report` | `app.js` | `res` | Public | None |
| `API-004` | `GET` | `/api/job-finder/meta` | `modules/modules/jobFinder/jobFinder.route.js` | `getMeta` | Yes | Controller/None |
| `API-005` | `POST` | `/api/job-finder/search` | `modules/modules/jobFinder/jobFinder.route.js` | `startSearch` | Yes | Controller/None |
| `API-006` | `GET` | `/api/job-finder/searches` | `modules/modules/jobFinder/jobFinder.route.js` | `getSearches` | Yes | Controller/None |
| `API-007` | `GET` | `/api/job-finder/searches/:id` | `modules/modules/jobFinder/jobFinder.route.js` | `getSearchById` | Yes | Controller/None |
| `API-008` | `GET` | `/api/job-finder/job/:id` | `modules/modules/jobFinder/jobFinder.route.js` | `getJobDetails` | Yes | Controller/None |
| `API-009` | `GET` | `/api/job-finder/jobs/:id` | `modules/modules/jobFinder/jobFinder.route.js` | `getJobDetails` | Yes | Controller/None |
| `API-010` | `POST` | `/api/job-finder/job/:id/apply` | `modules/modules/jobFinder/jobFinder.route.js` | `applyJob` | Yes | Controller/None |
| `API-011` | `POST` | `/api/job-finder/jobs/:id/apply` | `modules/modules/jobFinder/jobFinder.route.js` | `applyJob` | Yes | Controller/None |
| `API-012` | `GET` | `/api/job-finder/admin/overview` | `modules/modules/jobFinder/jobFinder.route.js` | `getAdminOverview` | Yes | Admin |
| `API-013` | `GET` | `/api/job-finder/admin/jobs` | `modules/modules/jobFinder/jobFinder.route.js` | `getAdminJobs` | Yes | Admin |
| `API-014` | `POST` | `/api/job-finder/admin/jobs` | `modules/modules/jobFinder/jobFinder.route.js` | `createAdminJob` | Yes | Admin |
| `API-015` | `PATCH` | `/api/job-finder/admin/jobs/:id` | `modules/modules/jobFinder/jobFinder.route.js` | `updateAdminJob` | Yes | Admin |
| `API-016` | `DELETE` | `/api/job-finder/admin/jobs/:id` | `modules/modules/jobFinder/jobFinder.route.js` | `deleteAdminJob` | Yes | Admin |
| `API-017` | `POST` | `/api/job-finder/admin/extract` | `modules/modules/jobFinder/jobFinder.route.js` | `extractJobAi` | Yes | Admin |
| `API-018` | `GET` | `/api/job-finder/admin/rules` | `modules/modules/jobFinder/jobFinder.route.js` | `getAdminRules` | Yes | Admin |
| `API-019` | `POST` | `/api/job-finder/admin/rules` | `modules/modules/jobFinder/jobFinder.route.js` | `createAdminRule` | Yes | Admin |
| `API-020` | `POST` | `/api/job-finder/admin/rules/:id/run` | `modules/modules/jobFinder/jobFinder.route.js` | `runAdminRuleNow` | Yes | Admin |
| `API-021` | `DELETE` | `/api/job-finder/admin/rules/:id` | `modules/modules/jobFinder/jobFinder.route.js` | `deleteAdminRule` | Yes | Admin |
| `API-022` | `GET` | `/api/job-finder/admin/settings` | `modules/modules/jobFinder/jobFinder.route.js` | `getAdminSettings` | Yes | Admin |
| `API-023` | `PATCH` | `/api/job-finder/admin/settings` | `modules/modules/jobFinder/jobFinder.route.js` | `patchAdminSettings` | Yes | Admin |
| `API-024` | `POST` | `/api/job-finder/admin/cleanup` | `modules/modules/jobFinder/jobFinder.route.js` | `triggerCleanupNow` | Yes | Admin |
| `API-025` | `GET` | `/api/jobs` | `modules/modules/job/job.route.js` | `getAllJobs` | Yes | Controller/None |
| `API-026` | `POST` | `/api/jobs` | `modules/modules/job/job.route.js` | `createJob` | Yes | Controller/None |
| `API-027` | `GET` | `/api/jobs/college` | `modules/modules/job/job.route.js` | `getAllJobsClg` | Yes | Controller/None |
| `API-028` | `GET` | `/api/jobs/student` | `modules/modules/job/job.route.js` | `getJobs` | Yes | Controller/None |
| `API-029` | `PATCH` | `/api/jobs/:id/approve` | `modules/modules/job/job.route.js` | `approveJobForCollege` | Yes | Controller/None |
| `API-030` | `GET` | `/api/stats` | `modules/modules/dashboard/dashboard.route.js` | `getDashboardStats` | Yes | Controller/None |
| `API-031` | `GET` | `/api/stats/admin-report` | `modules/modules/dashboard/dashboard.route.js` | `getAdminReport` | Yes | Controller/None |
| `API-032` | `GET` | `/api/stats/transactions` | `modules/modules/dashboard/dashboard.route.js` | `getAllTransactions` | Yes | Controller/None |
| `API-033` | `GET` | `/api/contact` | `modules/modules/contact/contact.route.js` | `getAllContacts` | Public | Controller/None |
| `API-034` | `POST` | `/api/contact` | `modules/modules/contact/contact.route.js` | `createContact` | Public | Controller/None |
| `API-035` | `DELETE` | `/api/contact/:id` | `modules/modules/contact/contact.route.js` | `mongoIdValidation('id'` | Public | Controller/None |
| `API-036` | `GET` | `/api/university` | `modules/modules/university/university.route.js` | `getAllUniversitys` | Public | Controller/None |
| `API-037` | `POST` | `/api/university` | `modules/modules/university/university.route.js` | `upload.single("university_logo"` | Public | Controller/None |
| `API-038` | `PATCH` | `/api/university/:id/status/:status` | `modules/modules/university/university.route.js` | `updateStatus` | Public | Controller/None |
| `API-039` | `GET` | `/api/dropdown/universities` | `modules/modules/dropdown/dropdown.route.js` | `getUniversities` | Public | Controller/None |
| `API-040` | `GET` | `/api/dropdown/colleges` | `modules/modules/dropdown/dropdown.route.js` | `getColleges` | Public | Controller/None |
| `API-041` | `GET` | `/api/dropdown/degrees` | `modules/modules/dropdown/dropdown.route.js` | `getDegrees` | Public | Controller/None |
| `API-042` | `GET` | `/api/dropdown/branches` | `modules/modules/dropdown/dropdown.route.js` | `getBranches` | Public | Controller/None |
| `API-043` | `GET` | `/api/dropdown/degree-masters` | `modules/modules/dropdown/dropdown.route.js` | `getDegreeMasters` | Public | Controller/None |
| `API-044` | `GET` | `/api/dropdown/unique-degrees` | `modules/modules/dropdown/dropdown.route.js` | `getUniqueDegrees` | Public | Controller/None |
| `API-045` | `GET` | `/api/dropdown/colleges-by-degree` | `modules/modules/dropdown/dropdown.route.js` | `getCollegesByDegree` | Public | Controller/None |
| `API-046` | `POST` | `/api/order` | `modules/modules/subscription/payment.route.js` | `createOrder` | Yes | Controller/None |
| `API-047` | `GET` | `/api/order` | `modules/modules/subscription/payment.route.js` | `getAllPayments` | Yes | Controller/None |
| `API-048` | `POST` | `/api/order/verify` | `modules/modules/subscription/payment.route.js` | `verifyPayment` | Yes | Controller/None |
| `API-049` | `GET` | `/api/order/check` | `modules/modules/subscription/payment.route.js` | `checkStudentSubscription` | Yes | Controller/None |
| `API-050` | `GET` | `/api/order/my-payments` | `modules/modules/subscription/payment.route.js` | `getUserPayments` | Yes | Controller/None |
| `API-051` | `POST` | `/api/payment` | `modules/modules/subscription/payment.route.js` | `createOrder` | Yes | Controller/None |
| `API-052` | `GET` | `/api/payment` | `modules/modules/subscription/payment.route.js` | `getAllPayments` | Yes | Controller/None |
| `API-053` | `POST` | `/api/payment/verify` | `modules/modules/subscription/payment.route.js` | `verifyPayment` | Yes | Controller/None |
| `API-054` | `GET` | `/api/payment/check` | `modules/modules/subscription/payment.route.js` | `checkStudentSubscription` | Yes | Controller/None |
| `API-055` | `GET` | `/api/payment/my-payments` | `modules/modules/subscription/payment.route.js` | `getUserPayments` | Yes | Controller/None |
| `API-056` | `POST` | `/api/aiexam` | `modules/modules/subscription/exampayment.route.js` | `createExamOrder` | Yes | Controller/None |
| `API-057` | `POST` | `/api/aiexam/verify` | `modules/modules/subscription/exampayment.route.js` | `verifyExamPayment` | Yes | Controller/None |
| `API-058` | `GET` | `/api/aiexam/verify/:id` | `modules/modules/subscription/exampayment.route.js` | `verifyExamAccess` | Yes | Controller/None |
| `API-059` | `GET` | `/api/exam` | `modules/modules/exam/exam.route.js` | `getAllExams` | Yes | Controller/None |
| `API-060` | `POST` | `/api/exam/from-jd` | `modules/modules/exam/exam.route.js` | `createExamFromJD` | Yes | Controller/None |
| `API-061` | `GET` | `/api/exam/detail/:id` | `modules/modules/exam/exam.route.js` | `getExamById` | Yes | Controller/None |
| `API-062` | `PATCH` | `/api/exam/:id/proctoring` | `modules/modules/exam/exam.route.js` | `updateProctoringSettings` | Yes | Controller/None |
| `API-063` | `POST` | `/api/paper/:id` | `modules/modules/exam/paper.route.js` | `createPaper` | Yes | Controller/None |
| `API-064` | `GET` | `/api/paper/:id` | `modules/modules/exam/paper.route.js` | `getAllPaper` | Yes | Controller/None |
| `API-065` | `DELETE` | `/api/paper/:id` | `modules/modules/exam/paper.route.js` | `deletePaper` | Yes | Controller/None |
| `API-066` | `POST` | `/api/paper/session/:examId` | `modules/modules/exam/paper.route.js` | `startExamSession` | Yes | Controller/None |
| `API-067` | `POST` | `/api/paper/:paperId/violation` | `modules/modules/exam/paper.route.js` | `recordViolation` | Yes | Controller/None |
| `API-068` | `POST` | `/api/paper/:paperId/snapshot` | `modules/modules/exam/paper.route.js` | `saveCameraSnapshot` | Yes | Controller/None |
| `API-069` | `POST` | `/api/paper/:paperId/auto-submit` | `modules/modules/exam/paper.route.js` | `autoSubmitPaper` | Yes | Controller/None |
| `API-070` | `GET` | `/api/paper/:paperId/proctoring` | `modules/modules/exam/paper.route.js` | `getPaperWithProctoring` | Yes | Controller/None |
| `API-071` | `GET` | `/api/rounds/job/:id/rounds` | `modules/modules/interview/round.route.js` | `getJobRounds` | Yes | Controller/None |
| `API-072` | `POST` | `/api/rounds/job/:id/rounds` | `modules/modules/interview/round.route.js` | `addRoundsToJob` | Yes | Controller/None |
| `API-073` | `PATCH` | `/api/rounds/job/:jobId/round/:roundId/status` | `modules/modules/interview/round.route.js` | `updateRoundStatus` | Yes | Controller/None |
| `API-074` | `GET` | `/api/rounds/job/:jobId/round/:roundNumber/candidates` | `modules/modules/interview/round.route.js` | `getRoundCandidates` | Yes | Controller/None |
| `API-075` | `POST` | `/api/rounds/job/:jobId/advance` | `modules/modules/interview/round.route.js` | `advanceCandidates` | Yes | Controller/None |
| `API-076` | `POST` | `/api/rounds/job/:jobId/initialize` | `modules/modules/interview/round.route.js` | `initializeFirstRound` | Yes | Controller/None |
| `API-077` | `GET` | `/api/rounds/job/:jobId/progress` | `modules/modules/interview/round.route.js` | `getRoundProgress` | Yes | Controller/None |
| `API-078` | `PATCH` | `/api/rounds/candidate/:id` | `modules/modules/interview/round.route.js` | `updateCandidateRound` | Yes | Controller/None |
| `API-079` | `GET` | `/api/rounds/student/job/:jobId` | `modules/modules/interview/round.route.js` | `getStudentRoundStatus` | Yes | Controller/None |
| `API-080` | `POST` | `/api/interviews` | `modules/modules/interview/interview.route.js` | `scheduleInterview` | Yes | Controller/None |
| `API-081` | `GET` | `/api/interviews` | `modules/modules/interview/interview.route.js` | `getAllCompanyInterviews` | Yes | Controller/None |
| `API-082` | `POST` | `/api/interviews/bulk` | `modules/modules/interview/interview.route.js` | `bulkScheduleInterviews` | Yes | Controller/None |
| `API-083` | `GET` | `/api/interviews/job/:jobId` | `modules/modules/interview/interview.route.js` | `getJobInterviews` | Yes | Controller/None |
| `API-084` | `GET` | `/api/interviews/student` | `modules/modules/interview/interview.route.js` | `getStudentInterviews` | Yes | Controller/None |
| `API-085` | `GET` | `/api/interviews/room/:roomId` | `modules/modules/interview/interview.route.js` | `getInterviewByRoom` | Yes | Controller/None |
| `API-086` | `GET` | `/api/interviews/:id` | `modules/modules/interview/interview.route.js` | `getInterview` | Yes | Controller/None |
| `API-087` | `PATCH` | `/api/interviews/:id` | `modules/modules/interview/interview.route.js` | `updateInterview` | Yes | Controller/None |
| `API-088` | `PATCH` | `/api/interviews/:id/start` | `modules/modules/interview/interview.route.js` | `startInterview` | Yes | Controller/None |
| `API-089` | `PATCH` | `/api/interviews/:id/end` | `modules/modules/interview/interview.route.js` | `endInterview` | Yes | Controller/None |
| `API-090` | `PATCH` | `/api/interviews/:id/cancel` | `modules/modules/interview/interview.route.js` | `cancelInterview` | Yes | Controller/None |
| `API-091` | `GET` | `/api/recruitment-subscription/plans/active` | `app.js` | `getActivePlans` | Public | None |
| `API-092` | `GET` | `/api/recruitment-subscription/plans/active` | `modules/modules/subscription/subscription.route.js` | `getActivePlans` | Yes | Controller/None |
| `API-093` | `GET` | `/api/recruitment-subscription/all` | `modules/modules/subscription/subscription.route.js` | `authorizePermissions("Admin"` | Yes | Controller/None |
| `API-094` | `POST` | `/api/recruitment-subscription/order` | `modules/modules/subscription/subscription.route.js` | `authorizePermissions("Company"` | Yes | Controller/None |
| `API-095` | `POST` | `/api/recruitment-subscription/verify` | `modules/modules/subscription/subscription.route.js` | `authorizePermissions("Company"` | Yes | Controller/None |
| `API-096` | `GET` | `/api/recruitment-subscription/check` | `modules/modules/subscription/subscription.route.js` | `checkSubscription` | Yes | Controller/None |
| `API-097` | `GET` | `/api/recruitment-subscription/check/:id` | `modules/modules/subscription/subscription.route.js` | `checkSubscription` | Yes | Controller/None |
| `API-098` | `GET` | `/api/recruitment-subscription/my` | `modules/modules/subscription/subscription.route.js` | `authorizePermissions("Company"` | Yes | Controller/None |
| `API-099` | `GET` | `/api/preparation/subjects/active` | `modules/modules/preparation/preparation.route.js` | `getActiveSubjects` | Yes + Sub | Controller/None |
| `API-100` | `GET` | `/api/preparation/subjects` | `modules/modules/preparation/preparation.route.js` | `getAllSubjects` | Yes + Sub | Controller/None |
| `API-101` | `POST` | `/api/preparation/subjects` | `modules/modules/preparation/preparation.route.js` | `createSubject` | Yes + Sub | Admin |
| `API-102` | `PATCH` | `/api/preparation/subjects/:id` | `modules/modules/preparation/preparation.route.js` | `updateSubject` | Yes + Sub | Admin |
| `API-103` | `DELETE` | `/api/preparation/subjects/:id` | `modules/modules/preparation/preparation.route.js` | `deleteSubject` | Yes + Sub | Admin |
| `API-104` | `GET` | `/api/preparation/subjects/categories` | `modules/modules/preparation/preparation.route.js` | `getCategories` | Yes + Sub | Controller/None |
| `API-105` | `POST` | `/api/preparation/subjects/categories` | `modules/modules/preparation/preparation.route.js` | `createCategory` | Yes + Sub | Admin |
| `API-106` | `DELETE` | `/api/preparation/subjects/categories/:id` | `modules/modules/preparation/preparation.route.js` | `deleteCategory` | Yes + Sub | Admin |
| `API-107` | `GET` | `/api/preparation/questions` | `modules/modules/preparation/preparation.route.js` | `getAllQuestions` | Yes + Sub | Controller/None |
| `API-108` | `GET` | `/api/preparation/questions/practice/:subjectId` | `modules/modules/preparation/preparation.route.js` | `getPracticeQuestions` | Yes + Sub | Controller/None |
| `API-109` | `GET` | `/api/preparation/questions/previous-year` | `modules/modules/preparation/preparation.route.js` | `getPreviousYearQuestions` | Yes + Sub | Controller/None |
| `API-110` | `GET` | `/api/preparation/questions/previous-year/categories` | `modules/modules/preparation/preparation.route.js` | `getPreviousYearCategories` | Yes + Sub | Controller/None |
| `API-111` | `GET` | `/api/preparation/questions/previous-year/subjects` | `modules/modules/preparation/preparation.route.js` | `getPreviousYearSubjects` | Yes + Sub | Controller/None |
| `API-112` | `POST` | `/api/preparation/questions` | `modules/modules/preparation/preparation.route.js` | `createQuestion` | Yes + Sub | Admin |
| `API-113` | `POST` | `/api/preparation/questions/bulk` | `modules/modules/preparation/preparation.route.js` | `bulkUploadQuestions` | Yes + Sub | Admin |
| `API-114` | `POST` | `/api/preparation/questions/bulk-delete` | `modules/modules/preparation/preparation.route.js` | `bulkDeleteQuestions` | Yes + Sub | Admin |
| `API-115` | `POST` | `/api/preparation/questions/import` | `modules/modules/preparation/preparation.route.js` | `importQuestions` | Yes + Sub | Admin |
| `API-116` | `PATCH` | `/api/preparation/questions/:id` | `modules/modules/preparation/preparation.route.js` | `updateQuestion` | Yes + Sub | Admin |
| `API-117` | `DELETE` | `/api/preparation/questions/:id` | `modules/modules/preparation/preparation.route.js` | `deleteQuestion` | Yes + Sub | Admin |
| `API-118` | `GET` | `/api/preparation/mock-tests` | `modules/modules/preparation/preparation.route.js` | `getAllMockTests` | Yes + Sub | Controller/None |
| `API-119` | `GET` | `/api/preparation/mock-tests/active` | `modules/modules/preparation/preparation.route.js` | `getActiveMockTests` | Yes + Sub | Controller/None |
| `API-120` | `POST` | `/api/preparation/mock-tests` | `modules/modules/preparation/preparation.route.js` | `createMockTest` | Yes + Sub | Admin |
| `API-121` | `PATCH` | `/api/preparation/mock-tests/:id` | `modules/modules/preparation/preparation.route.js` | `updateMockTest` | Yes + Sub | Admin |
| `API-122` | `DELETE` | `/api/preparation/mock-tests/:id` | `modules/modules/preparation/preparation.route.js` | `deleteMockTest` | Yes + Sub | Admin |
| `API-123` | `POST` | `/api/preparation/mock-tests/:id/start` | `modules/modules/preparation/preparation.route.js` | `startMockTest` | Yes + Sub | Controller/None |
| `API-124` | `POST` | `/api/preparation/mock-tests/save/:attemptId` | `modules/modules/preparation/preparation.route.js` | `saveAttemptProgress` | Yes + Sub | Controller/None |
| `API-125` | `POST` | `/api/preparation/mock-tests/submit/:attemptId` | `modules/modules/preparation/preparation.route.js` | `submitMockTest` | Yes + Sub | Controller/None |
| `API-126` | `GET` | `/api/preparation/mock-tests/result/:attemptId` | `modules/modules/preparation/preparation.route.js` | `getTestResult` | Yes + Sub | Controller/None |
| `API-127` | `GET` | `/api/preparation/mock-tests/my-attempts` | `modules/modules/preparation/preparation.route.js` | `getMyAttempts` | Yes + Sub | Controller/None |
| `API-128` | `GET` | `/api/preparation/daily-challenge` | `modules/modules/preparation/preparation.route.js` | `getTodayChallenge` | Yes + Sub | Controller/None |
| `API-129` | `POST` | `/api/preparation/daily-challenge/submit` | `modules/modules/preparation/preparation.route.js` | `submitDailyChallenge` | Yes + Sub | Controller/None |
| `API-130` | `POST` | `/api/preparation/daily-challenge/create` | `modules/modules/preparation/preparation.route.js` | `createDailyChallenge` | Yes + Sub | Admin |
| `API-131` | `POST` | `/api/preparation/bookmarks/toggle` | `modules/modules/preparation/preparation.route.js` | `toggleBookmark` | Yes + Sub | Controller/None |
| `API-132` | `GET` | `/api/preparation/bookmarks` | `modules/modules/preparation/preparation.route.js` | `getBookmarks` | Yes + Sub | Controller/None |
| `API-133` | `GET` | `/api/preparation/bookmarks/check/:item_id` | `modules/modules/preparation/preparation.route.js` | `checkBookmark` | Yes + Sub | Controller/None |
| `API-134` | `GET` | `/api/preparation/pdfs` | `modules/modules/preparation/preparation.route.js` | `getAllPdfMaterials` | Yes + Sub | Controller/None |
| `API-135` | `GET` | `/api/preparation/pdfs/active` | `modules/modules/preparation/preparation.route.js` | `getActivePdfs` | Yes + Sub | Controller/None |
| `API-136` | `POST` | `/api/preparation/pdfs` | `modules/modules/preparation/preparation.route.js` | `createPdfMaterial` | Yes + Sub | Admin |
| `API-137` | `PATCH` | `/api/preparation/pdfs/:id` | `modules/modules/preparation/preparation.route.js` | `updatePdfMaterial` | Yes + Sub | Admin |
| `API-138` | `DELETE` | `/api/preparation/pdfs/:id` | `modules/modules/preparation/preparation.route.js` | `deletePdfMaterial` | Yes + Sub | Admin |
| `API-139` | `POST` | `/api/preparation/pdfs/reading-progress` | `modules/modules/preparation/preparation.route.js` | `updateReadingProgress` | Yes + Sub | Controller/None |
| `API-140` | `GET` | `/api/preparation/progress` | `modules/modules/preparation/preparation.route.js` | `getStudentProgress` | Yes + Sub | Controller/None |
| `API-141` | `GET` | `/api/preparation/progress/subjects` | `modules/modules/preparation/preparation.route.js` | `getSubjectAnalysis` | Yes + Sub | Controller/None |
| `API-142` | `GET` | `/api/preparation/progress/graphs` | `modules/modules/preparation/preparation.route.js` | `getProgressGraphs` | Yes + Sub | Controller/None |
| `API-143` | `GET` | `/api/preparation/progress/activity` | `modules/modules/preparation/preparation.route.js` | `getRecentActivity` | Yes + Sub | Controller/None |
| `API-144` | `POST` | `/api/preparation/progress/practice/update` | `modules/modules/preparation/preparation.route.js` | `updatePracticeProgress` | Yes + Sub | Controller/None |
| `API-145` | `POST` | `/api/upload/profile-image` | `modules/modules/upload/upload.route.js` | `res) => {     if (!req.file) {     ` | Yes | Controller/None |
| `API-146` | `POST` | `/api/upload/avatar` | `modules/modules/upload/upload.route.js` | `res) => {     if (!req.file) {     ` | Yes | Controller/None |
| `API-147` | `POST` | `/api/upload/resume` | `modules/modules/upload/upload.route.js` | `res) => {     if (!req.file) {     ` | Yes | Controller/None |
| `API-148` | `POST` | `/api/upload/cv` | `modules/modules/upload/upload.route.js` | `res) => {     if (!req.file) {     ` | Yes | Controller/None |
| `API-149` | `POST` | `/api/upload/company-logo` | `modules/modules/upload/upload.route.js` | `res) => {     if (!req.file) {     ` | Yes | Controller/None |
| `API-150` | `POST` | `/api/upload/document` | `modules/modules/upload/upload.route.js` | `res) => {     if (!req.file) {     ` | Yes | Controller/None |
| `API-151` | `POST` | `/api/upload/exam-file` | `modules/modules/upload/upload.route.js` | `res) => {     if (!req.file) {     ` | Yes | Controller/None |
| `API-152` | `POST` | `/api/upload/multiple-documents` | `modules/modules/upload/upload.route.js` | `res) => {     if (!req.files || req` | Yes | Controller/None |
| `API-153` | `POST` | `/api/upload/multiple-images` | `modules/modules/upload/upload.route.js` | `res) => {     if (!req.files || req` | Yes | Controller/None |
| `API-154` | `POST` | `/api/upload/mixed` | `modules/modules/upload/upload.route.js` | `res) => {     if (!req.files) {    ` | Yes | Controller/None |
| `API-155` | `GET` | `/api/company` | `modules/modules/company/company.route.js` | `getAllCompanys` | Public | Controller/None |
| `API-156` | `POST` | `/api/company` | `modules/modules/company/company.route.js` | `upload.single("company_logo"` | Public | Controller/None |
| `API-157` | `PATCH` | `/api/company/:id/status/:status` | `modules/modules/company/company.route.js` | `authorizePermissions("Admin"` | Yes | Controller/None |
| `API-158` | `GET` | `/api/application/student` | `modules/modules/application/application.route.js` | `getStudentApplications` | Yes | Controller/None |
| `API-159` | `GET` | `/api/application/company` | `modules/modules/application/application.route.js` | `getCompanyApplications` | Yes | Controller/None |
| `API-160` | `GET` | `/api/application/institution` | `modules/modules/application/application.route.js` | `getInstitutionApplications` | Yes | Controller/None |
| `API-161` | `GET` | `/api/application/:id/resume` | `modules/modules/application/application.route.js` | `getApplicationResume` | Yes | Controller/None |
| `API-162` | `GET` | `/api/application/:id` | `modules/modules/application/application.route.js` | `getAllApplications` | Yes | Controller/None |
| `API-163` | `POST` | `/api/application/:id` | `modules/modules/application/application.route.js` | `createApplication` | Yes | Controller/None |
| `API-164` | `PATCH` | `/api/application/:id` | `modules/modules/application/application.route.js` | `updateApplication` | Yes | Controller/None |
| `API-165` | `DELETE` | `/api/application/:id` | `modules/modules/application/application.route.js` | `deleteApplication` | Yes | Controller/None |
| `API-166` | `GET` | `/api/college/my-colleges` | `modules/modules/college/college.route.js` | `getMyColleges` | Yes | Controller/None |
| `API-167` | `GET` | `/api/college` | `modules/modules/college/college.route.js` | `getAllColleges` | Public | Controller/None |
| `API-168` | `POST` | `/api/college` | `modules/modules/college/college.route.js` | `upload.single("college_logo"` | Public | Controller/None |
| `API-169` | `PATCH` | `/api/college/:id/status/:status` | `modules/modules/college/college.route.js` | `authorizePermissions("Admin"` | Yes | Controller/None |
| `API-170` | `GET` | `/api/branch` | `modules/modules/branch/branch.route.js` | `getAllBranches` | Yes | Controller/None |
| `API-171` | `POST` | `/api/branch` | `modules/modules/branch/branch.route.js` | `createBranch` | Yes | Controller/None |
| `API-172` | `GET` | `/api/branch/:id` | `modules/modules/branch/branch.route.js` | `getBranch` | Yes | Controller/None |
| `API-173` | `PATCH` | `/api/branch/:id` | `modules/modules/branch/branch.route.js` | `updateBranch` | Yes | Controller/None |
| `API-174` | `DELETE` | `/api/branch/:id` | `modules/modules/branch/branch.route.js` | `deleteBranch` | Yes | Controller/None |
| `API-175` | `GET` | `/api/degree` | `modules/modules/degree/degree.route.js` | `getAllDegrees` | Yes | Controller/None |
| `API-176` | `POST` | `/api/degree` | `modules/modules/degree/degree.route.js` | `createDegree` | Yes | Controller/None |
| `API-177` | `GET` | `/api/degree/:id` | `modules/modules/degree/degree.route.js` | `getDegree` | Yes | Controller/None |
| `API-178` | `PATCH` | `/api/degree/:id` | `modules/modules/degree/degree.route.js` | `updateDegree` | Yes | Controller/None |
| `API-179` | `DELETE` | `/api/degree/:id` | `modules/modules/degree/degree.route.js` | `deleteDegree` | Yes | Controller/None |
| `API-180` | `GET` | `/api/degreeMaster` | `modules/modules/degree/degreemaster.route.js` | `getAllDegreeMasters` | Public | Controller/None |
| `API-181` | `POST` | `/api/degreeMaster` | `modules/modules/degree/degreemaster.route.js` | `createDegreeMaster` | Public | Controller/None |
| `API-182` | `GET` | `/api/degreeMaster/:id` | `modules/modules/degree/degreemaster.route.js` | `getDegreeMaster` | Public | Controller/None |
| `API-183` | `PATCH` | `/api/degreeMaster/:id` | `modules/modules/degree/degreemaster.route.js` | `updateDegreeMaster` | Public | Controller/None |
| `API-184` | `DELETE` | `/api/degreeMaster/:id` | `modules/modules/degree/degreemaster.route.js` | `deleteDegreeMaster` | Public | Controller/None |
| `API-185` | `GET` | `/api/student` | `modules/modules/student/student.route.js` | `getAllStudents` | Yes | Controller/None |
| `API-186` | `POST` | `/api/student` | `modules/modules/student/student.route.js` | `createStudent` | Yes | Controller/None |
| `API-187` | `GET` | `/api/student/resume/me` | `modules/modules/student/student.route.js` | `getResume` | Yes | Controller/None |
| `API-188` | `POST` | `/api/student/resume/me` | `modules/modules/student/student.route.js` | `saveResume` | Yes | Controller/None |
| `API-189` | `PATCH` | `/api/student/:id/verify` | `modules/modules/student/student.route.js` | `verifyStudent` | Yes | Controller/None |
| `API-190` | `POST` | `/api/student/resume/ai-summaries` | `modules/modules/student/student.route.js` | `generateAiSummaries` | Yes | Controller/None |
| `API-191` | `GET` | `/api/cv-templates` | `modules/modules/student/cvTemplate.route.js` | `getAllTemplates` | Yes | Controller/None |
| `API-192` | `POST` | `/api/cv-templates/compile` | `modules/modules/student/cvTemplate.route.js` | `compileResumeWithAi` | Yes | Controller/None |
| `API-193` | `GET` | `/api/cv-templates/download-pdf` | `modules/modules/student/cvTemplate.route.js` | `downloadResumePdf` | Yes | Controller/None |
| `API-194` | `POST` | `/api/cv-templates/admin` | `modules/modules/student/cvTemplate.route.js` | `upload.single("thumbnail"` | Yes | Controller/None |
| `API-195` | `DELETE` | `/api/cv-templates/admin/:id` | `modules/modules/student/cvTemplate.route.js` | `deleteTemplate` | Yes | Controller/None |
| `API-196` | `PATCH` | `/api/cv-templates/admin/:id` | `modules/modules/student/cvTemplate.route.js` | `upload.single("thumbnail"` | Yes | Controller/None |
| `API-197` | `GET` | `/api/register` | `modules/modules/student/student.route.js` | `getAllStudents` | Public | Controller/None |
| `API-198` | `POST` | `/api/register` | `modules/modules/student/student.route.js` | `createStudent` | Public | Controller/None |
| `API-199` | `GET` | `/api/register/resume/me` | `modules/modules/student/student.route.js` | `getResume` | Yes | Controller/None |
| `API-200` | `POST` | `/api/register/resume/me` | `modules/modules/student/student.route.js` | `saveResume` | Yes | Controller/None |
| `API-201` | `PATCH` | `/api/register/:id/verify` | `modules/modules/student/student.route.js` | `verifyStudent` | Yes | Controller/None |
| `API-202` | `POST` | `/api/register/resume/ai-summaries` | `modules/modules/student/student.route.js` | `generateAiSummaries` | Yes | Controller/None |
| `API-203` | `GET` | `/api/tpo` | `modules/modules/tpo/tpo.route.js` | `getAllTPOs` | Yes | Controller/None |
| `API-204` | `POST` | `/api/tpo` | `modules/modules/tpo/tpo.route.js` | `upload.single("tpo_image"` | Yes | Controller/None |
| `API-205` | `POST` | `/api/auth/register` | `modules/modules/auth/auth.route.js` | `register` | Public | Controller/None |
| `API-206` | `POST` | `/api/auth/login` | `modules/modules/auth/auth.route.js` | `login` | Public | Controller/None |
| `API-207` | `GET` | `/api/auth/logout` | `modules/modules/auth/auth.route.js` | `logout` | Public | Controller/None |
| `API-208` | `POST` | `/api/auth/forgot-password` | `modules/modules/auth/auth.route.js` | `forgotPassword` | Public | Controller/None |
| `API-209` | `POST` | `/api/auth/reset-password` | `modules/modules/auth/auth.route.js` | `resetPassword` | Public | Controller/None |
| `API-210` | `POST` | `/api/login` | `modules/modules/auth/login.route.js` | `login` | Public | Controller/None |
| `API-211` | `GET` | `/api/login/logout` | `modules/modules/auth/login.route.js` | `logout` | Public | Controller/None |
| `API-212` | `GET` | `/api/login/current-user` | `modules/modules/auth/login.route.js` | `getCurrentUser` | Yes | Controller/None |
| `API-213` | `POST` | `/api/logout` | `modules/modules/auth/login.route.js` | `login` | Public | Controller/None |
| `API-214` | `GET` | `/api/logout/logout` | `modules/modules/auth/login.route.js` | `logout` | Public | Controller/None |
| `API-215` | `GET` | `/api/logout/current-user` | `modules/modules/auth/login.route.js` | `getCurrentUser` | Yes | Controller/None |
| `API-216` | `GET` | `/api/users/current-user` | `modules/modules/auth/user.route.js` | `getCurrentUser` | Yes | Controller/None |
| `API-217` | `PATCH` | `/api/users/update-profile` | `modules/modules/auth/user.route.js` | `upload.single("profile_image"` | Yes | Controller/None |
