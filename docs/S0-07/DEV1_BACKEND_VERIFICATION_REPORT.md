# S0-07 — Dev 1 Backend Verification Report

**Owner:** Dev 1 | **Baseline:** Branch `ravi`, Commit `66220d594954ba077cf1d4a709eba3a084a74abc`  
**Verification Layers Executed:** Layer 1 (Static), Layer 2 (`node --check server/src/**/*.js`: 0 syntax errors), Layer 3 (0 tests exist). Layer 4–5 runtime execution **BLOCKED** (no live DB mutation / external paid calls permitted).

---

## 1. Domain & Support Modules Verification (17 Domain + 4 Support = 21 Modules)

| # | Module | Primary Status | Layer 1–2 Result | Verified Evidence & Defect Summary |
|---|---|---|---|---|
| 1 | `auth` | `PARTIALLY_WORKING` | Pass | `login.controller.js` works statically, but ignores `*_status === "1"` (`AUD-014`); `auth.route.js` `/login` & `/register` are **`NOT_WORKING`** due to field mismatch (`AUD-017`) and unauthenticated Admin creation (`AUD-001`). |
| 2 | `university` | `PARTIALLY_WORKING` | Pass | CRUD wired, but **0 authentication/RBAC** on all 6 routes (`AUD-002`) + N+1 query (`AUD-027`). |
| 3 | `college` | `PARTIALLY_WORKING` | Pass | `getMyColleges` & status RBAC work; `updateCollege` allows mass assignment (`AUD-008`) + N+1 query (`AUD-027`). |
| 4 | `degree` | `PARTIALLY_WORKING` | Pass | `degree.route.js` lacks RBAC on writes (`AUD-010`); `degreemaster.route.js` is completely unauthenticated (`AUD-003`). |
| 5 | `branch` | `PARTIALLY_WORKING` | Pass | `branch.route.js` lacks RBAC/ownership on create/update/delete (`AUD-010`). |
| 6 | `tpo` | `PARTIALLY_WORKING` | Pass | `tpo.route.js` lacks RBAC on create/update/delete (`AUD-010`); `updateTPO` mass assignment. |
| 7 | `student` | `PARTIALLY_WORKING` | Pass | `/api/register` exposes `GET /` student PII (`AUD-004`); `updateStudent` bypasses check for `Company`/`University` (`AUD-013`). |
| 8 | `company` | `PARTIALLY_WORKING` | Pass | `updateCompany` mass assignment (`AUD-008`); `deleteCompany` non-transactional (`AUD-030`). |
| 9 | `job` | `PARTIALLY_WORKING` | Pass | `createJob` missing role check; `getJobs` crashes if non-student calls; non-transactional delete (`AUD-030`). |
| 10 | `application` | `PARTIALLY_WORKING` | Pass | `GET /:id` & `/:id/resume` missing ownership checks (`AUD-012`); non-unique index race condition (`DB-004`). |
| 11 | `interview` | `PARTIALLY_WORKING` | Pass | Schedule/read endpoints missing role & ownership checks (`AUD-012`). |
| 12 | `round` | `PARTIALLY_WORKING` | Pass | All 9 `/api/rounds/*` endpoints have **0 RBAC/ownership checks** (`AUD-005`). |
| 13 | `exam` | `PARTIALLY_WORKING` | Pass | `getExam` leaks `isCorrect` to non-Student roles (`AUD-016`); OpenAI runtime `BLOCKED` (cost/key). |
| 14 | `paper` | `PARTIALLY_WORKING` | Pass | `createPaper` trusts client `trustScore` (`AUD-015`); `exam_id` typed as `String` (`DB-005`). |
| 15 | `subscription` | `PARTIALLY_WORKING` | Pass | `payment` & `exampayment` trust client `amount` (`AUD-007`); `exam_payment.user_id` unique bug (`DB-002`); Razorpay runtime `BLOCKED`. |
| 16 | `preparation` | `BLOCKED` (L4) | Pass | Cleanest static/RBAC implementation (32 endpoints, `Admin` + `requireStudentSubscription`); runtime DB execution `BLOCKED` (no live test session). |
| 17 | `jobFinder` | `PARTIALLY_WORKING` | Pass | Clean `zod` + `services/` architecture, but 5 models ref missing `tbl_user` (`DB-001`) + top-level `updateMany` (`AUD-037`). |
| 18 | `dashboard` | `PARTIALLY_WORKING` | Pass | `getAdminReport` & `getAllTransactions` lack `Admin` role check (`AUD-006`). |
| 19 | `contact` | `PARTIALLY_WORKING` | Pass | `GET /` & `DELETE /:id` are completely unauthenticated (`AUD-009`). |
| 20 | `upload` | `PARTIALLY_WORKING` | Pass | `DELETE /:filename` has arbitrary file deletion IDOR (`AUD-011`). |
| 21 | `idempotency` | `BLOCKED` (L4) | Pass | `requireIdempotency` wired globally on `/api/`; runtime TTL/race verification `BLOCKED` without live DB. |
| — | `session` (Dead) | `UNUSED` | Pass | `session.route.js` (6 routes) & `sessionSecurityMiddleware.js` are unmounted in `app.js` (`AUD-029`). |
