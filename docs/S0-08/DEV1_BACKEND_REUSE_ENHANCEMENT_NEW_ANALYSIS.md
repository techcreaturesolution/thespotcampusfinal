# S0-08 — Dev 1 Backend Reuse, Enhancement & New Analysis

**Owner:** Dev 1 | **Baseline:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)  
**Documentation Gap:** External Step 0A Role & Permission Matrix, 16-Step Roadmap, and Approved Feature Spec documents are not committed in the repository. Analysis is grounded in `S0-01`–`S0-07` and actual `server/src/` code.

---

## 1. Backend Module-by-Module Classification (22 Modules)

| # | Module | S0-07 Status | Classification | Reuse / Enhancement / New Justification |
|---|---|---|---|---|
| 1 | `dropdown` | `BLOCKED` (L4) / L1 Pass | **REUSE** | 7 read-only cascading endpoints (`/api/dropdown/*`) work cleanly; reuse for Web & Flutter forms. |
| 2 | `idempotency` | `BLOCKED` (L4) / L1 Pass | **REUSE** | `requireIdempotency` + `tbl_idempotency_keys` (24h TTL) globally wired on `/api/`. |
| 3 | `preparation` | `BLOCKED` (L4) / L1 Pass | **REUSE** | 32 endpoints across 7 sub-modules with `Admin` RBAC & `requireStudentSubscription`; only minor duplicate index cleanup (`DB-015`). |
| 4 | `auth` / `login` / `user` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Reuse `login.controller.js` & `authMiddleware.js`, but fix `*_status` check (`AUD-014`), mass assignment (`AUD-008`), `POST /api/auth/register` (`AUD-001`), and broken `/api/auth/login` (`AUD-017`). |
| 5 | `university` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Add `authenticateUser` + `authorizePermissions("Admin")` (`AUD-002`), pagination, and `$lookup` to remove N+1 (`AUD-027`). |
| 6 | `college` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Whitelist `updateCollege` fields (`AUD-008`), fix N+1 (`AUD-027`), prepare College-to-Institute boundary. |
| 7 | `degree` & `degreemaster` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Protect `degreeMaster` (`AUD-003`) and `degree` writes (`AUD-010`) with `Admin`/`College` RBAC. |
| 8 | `branch` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Add `College`/`Admin` RBAC & ownership checks (`AUD-010`). |
| 9 | `tpo` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Add `College`/`Admin` RBAC on create/update/delete (`AUD-010`) and whitelist fields. |
| 10 | `student` & `resume` & `cvTemplate` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Isolate `POST /api/register` from `StudentRouter` (`AUD-004`), fix `updateStudent` bypass (`AUD-013`), guard `/cv-templates/admin` (`AUD-010`), move `GET` DB mutation (`AUD-036`). |
| 11 | `company` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Whitelist `updateCompany` fields (`AUD-008`), wrap `deleteCompany` in transaction (`AUD-030`). |
| 12 | `job` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Add `Company`/`Admin` RBAC on `POST /api/jobs`, guard `getJobs` for non-students, add transactions (`AUD-030`). |
| 13 | `application` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Add ownership checks on `GET /:id` & `/:id/resume` (`AUD-012`), enforce unique `{student_id, job_id}` (`DB-004`). |
| 14 | `round` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Add `Company`/`Admin` + job ownership checks on all 9 `/api/rounds/*` endpoints (`AUD-005`). |
| 15 | `interview` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Add `Company` RBAC on schedule/bulk & ownership checks on `GET /:id` & `/room/:roomId` (`AUD-012`). |
| 16 | `exam` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Restrict `isCorrect` stripping to `Admin` & owning `Company` (`AUD-016`), cap `noOfQuestion`. |
| 17 | `paper` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Compute `trustScore` & `totalViolations` server-side (`AUD-015`), migrate `exam_id` to `ObjectId` (`DB-005`). |
| 18 | `subscription` / `payment` / `exampayment` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Derive Razorpay `amount` server-side (`AUD-007`), fix `exam_payment.user_id` unique bug (`DB-002`), guard `GET /payment` (`AUD-006`). |
| 19 | `jobFinder` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Fix 5 models' `tbl_user` refs (`DB-001`), remove top-level `updateMany` (`AUD-037`), dedupe `/job/:id` aliases. |
| 20 | `dashboard` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Add `authorizePermissions("Admin")` to `/admin-report` & `/transactions` (`AUD-006`), paginate transactions. |
| 21 | `contact` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Keep `POST /` public; guard `GET /` & `DELETE /:id` with `Admin` (`AUD-009`). |
| 22 | `upload` | `PARTIALLY_WORKING` | **ENHANCEMENT** | Add ownership check & Windows `\` sanitization to `DELETE /:filename` (`AUD-011`); consolidate `multerMiddleware.js`. |
| — | `session` (Dead) | `UNUSED` | **ENHANCEMENT** (or Deprecate) | Currently unmounted (`AUD-029`); either wire into `/api/sessions` after review or remove dead code. |
| — | **Automated Tests, Migrations, Notifications, Institute** | `NOT_IMPLEMENTED` | **NEW** | Genuinely absent in `server/` (`AUD-032`, `DB-007`, `S0-04`). |
