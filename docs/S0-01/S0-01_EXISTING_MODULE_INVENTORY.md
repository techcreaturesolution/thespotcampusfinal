# S0-01 — Existing Module Inventory

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Total Backend Modules Audited:** 17 modules under `server/src/modules/`

---

## 1. Module Classification Matrix

| # | Module | Location | Classification | Reusable Components | Key Gaps / Issues |
|---|---|---|---|---|---|
| 1 | `auth` | `modules/auth/` | **Partially Implemented** | `login.controller.js`, `passwordReset.model.js`, `user.controller.js` | `/api/auth/register` & `/login` broken/unprotected; duplicate `getCurrentUser`; mass assignment in `updateUserProfile` |
| 2 | `session` | `modules/session/` | **Broken / Dead** | `session.controller.js` | `session.route.js` is never mounted in `app.js`; `sessionSecurityMiddleware.js` is unused |
| 3 | `university` | `modules/university/` | **Partially Implemented** | `tbl_university` model | Zero authentication/RBAC on all endpoints; N+1 query in `getAllUniversitys` |
| 4 | `college` | `modules/college/` | **Partially Implemented** | `tbl_college` model, `getMyColleges` | N+1 query in `getAllColleges`; mass assignment in `updateCollege` |
| 5 | `degree` | `modules/degree/` | **Partially Implemented** | `tbl_degree`, `tbl_degree_master` | `degreeMaster` unauthenticated; `degree` missing role/ownership checks |
| 6 | `branch` | `modules/branch/` | **Partially Implemented** | `tbl_branch` | Missing role/ownership checks on create/update/delete |
| 7 | `tpo` | `modules/tpo/` | **Partially Implemented** | `tbl_tpo` | Missing role/ownership checks on create/update/delete |
| 8 | `company` | `modules/company/` | **Partially Implemented** | `tbl_company` | Mass assignment in `updateCompany`; non-transactional cascade delete |
| 9 | `student` | `modules/student/` | **Partially Implemented** | `tbl_student`, `tbl_resume`, `tbl_cv_template`, `compileHtmlTemplate` | `/api/register` exposes all students; `updateStudent` RBAC flaw; `cv-templates/admin` missing `Admin` guard; `GET` mutates DB |
| 10 | `dropdown` | `modules/dropdown/` | **Fully Implemented** | Public dropdown endpoints for registration | Read-only helper; works as expected |
| 11 | `job` | `modules/job/` | **Partially Implemented** | `tbl_jobpost`, `approveJobForCollege` | `createJob` missing role check; `getJobs` crashes if non-student; non-transactional delete |
| 12 | `application` | `modules/application/` | **Partially Implemented** | `tbl_application`, `getCompanyApplications` (PII sanitization) | `GET /:id` and `GET /:id/resume` missing ownership checks; duplicate application race condition |
| 13 | `exam` | `modules/exam/` | **Partially Implemented** | `tbl_exam`, `tbl_paper`, `generateMCQs.js`, `socket.js` | `createPaper` trusts client `trustScore`; `getExam` leaks answers to non-Student roles; `exam_id` typed as `String` |
| 14 | `interview` | `modules/interview/` | **Partially Implemented** | `tbl_interview`, `tbl_candidate_round`, WebRTC signaling (`socket.js`) | `round` endpoints have zero RBAC; `interview` schedule/read missing ownership checks |
| 15 | `preparation` | `modules/preparation/` | **Fully Implemented** | 7 sub-modules (`subject`, `question`, `mocktest`, `dailychallenge`, `bookmark`, `pdfmaterial`, `progress`), `sanitizeQuestionsForStudent` | Well-structured RBAC (`Admin` on writes, `requireStudentSubscription` on student access); minor duplicate indexes |
| 16 | `subscription` | `modules/subscription/` | **Partially Implemented** | `RecruitmentPlan`, `RecruitmentSubscription`, `tbl_payment` | `payment` & `exampayment` trust client `amount`; `exam_payment.user_id` `unique: true` bug; hardcoded free company bypass in `checkSubscription` |
| 17 | `jobFinder` | `modules/jobFinder/` | **Partially Implemented** | `services/` architecture (aggregator, dedupe, llm, crawler, autoImport), `zod` validation | 5 models reference non-existent `tbl_user`; top-level `updateMany` on import; duplicate route paths |
| — | `dashboard` | `modules/dashboard/` | **Partially Implemented** | Role-scoped `getDashboardStats` | `getAdminReport` & `getAllTransactions` missing `Admin` role check |
| — | `contact` | `modules/contact/` | **Partially Implemented** | `tbl_contact`, `contactValidation` | `GET /` & `DELETE /:id` unauthenticated |
| — | `upload` | `modules/upload/` | **Partially Implemented** | `fileUploadMiddleware.js` (magic-byte checks) | `DELETE /:filename` IDOR (no ownership check) |
| — | `idempotency` | `modules/idempotency/` | **Fully Implemented** | `requireIdempotency`, `tbl_idempotency_key` (TTL 24h) | Solid anti-duplicate guard for `/api/` |

---

## 2. Reusable Modules & Shared Utilities

- **Middleware:** `authenticateUser`, `authorizePermissions`, `requireStudentSubscription` (`middleware/authMiddleware.js`), `requireIdempotency` (`modules/idempotency/idempotencyMiddleware.js`), `validateUploadedFile` & `cleanupUploadOnError` (`middleware/fileUploadMiddleware.js`), `errorHandlerMiddleware` (`middleware/errorHandlerMiddleware.js`).
- **Utilities:** `hashPassword`/`comparePassword` (`utils/passwordUtils.js`), `createJWT`/`verifyJWT` (`utils/tokenUtils.js`), `isEmailExists` (`utils/emailCheck.js`), `generateFromJobDescription` (`utils/generateMCQs.js`), `generatePdfFromHtml` (`utils/pdfGenerator.js`), `sendEmail`/`sendPasswordResetEmail` (`utils/sendEmail.js`).
- **Real-time:** `setupSocketIO` (`config/socket.js`) for proctoring events and WebRTC interview signaling.
