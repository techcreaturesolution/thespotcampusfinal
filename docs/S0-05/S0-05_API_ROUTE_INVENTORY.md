# S0-05 — Complete API Route Inventory

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Task:** S0-05 — Existing API Contract Mapping (Mapping Only — No API Modification)  
**Date:** 2026-11-26  
**Branch:** `ravi`

---

## 1. Summary Counts (Verified from `server/src/app.js` & `*.route.js`)

- **Mounted Route Groups (`app.use`):** **30** (27 `.route.js` files; 3 routers mounted twice)
- **Direct `app.js` Endpoints:** **4**
- **Total Mounted Endpoints:** **217** (`GET: 99`, `POST: 79`, `PUT: 0`, `PATCH: 25`, `DELETE: 14`)
- **Unique Method + Path Combinations:** **216** (`GET /api/recruitment-subscription/plans/active` is defined in both `app.js` and `subscription.route.js`)
- **Unmounted Endpoints:** **6** (`server/src/modules/session/session.route.js`)
- **Public Endpoints:** **37** | **Protected (`authenticateUser`) Endpoints:** **180**

---

## 2. Mounted Route Groups (`server/src/app.js`)

| Group | Mount Prefix | Route File | Mount Auth | Endpoints | Notes |
|---|---|---|---|---|---|
| System | `/api/test`, `/api/ct-report`, `/api/csp-report` | `app.js` | Public | 3 | Health & browser report endpoints |
| Auth | `/api/auth` | `auth/auth.route.js` | Public (+ `authLimiter`) | 5 | `register`, `login`, `logout`, `forgot-password`, `reset-password` |
| Login (x2) | `/api/login`, `/api/logout` | `auth/login.route.js` | Mixed (+ `authLimiter` on `/api/login`) | 6 (3x2) | Duplicate mount (`API-ISSUE-014`) |
| Users | `/api/users` | `auth/user.route.js` | `authenticateUser` | 2 | `current-user`, `update-profile` |
| University | `/api/university` | `university/university.route.js` | **Public** | 6 | Unauthenticated CRUD (`API-ISSUE-002`) |
| College | `/api/college` | `college/college.route.js` | Mixed (route-level) | 7 | `my-colleges`, CRUD, status |
| TPO | `/api/tpo` | `tpo/tpo.route.js` | `authenticateUser` | 5 | CRUD |
| Degree | `/api/degree` | `degree/degree.route.js` | `authenticateUser` | 5 | CRUD |
| DegreeMaster | `/api/degreeMaster` | `degree/degreemaster.route.js` | **Public** | 5 | Unauthenticated CRUD (`API-ISSUE-002`) |
| Branch | `/api/branch` | `branch/branch.route.js` | `authenticateUser` | 5 | CRUD |
| Dropdown | `/api/dropdown` | `dropdown/dropdown.route.js` | Public | 7 | Registration & job targeting lookups |
| Company | `/api/company` | `company/company.route.js` | Mixed (route-level) | 6 | CRUD + status |
| Student (x2) | `/api/student`, `/api/register` | `student/student.route.js` | `/student`: Auth; `/register`: **Mixed** | 16 (8x2) | `/register` exposes `GET /` & `GET /:id` (`API-ISSUE-003`) |
| CV Templates | `/api/cv-templates` | `student/cvTemplate.route.js` | `authenticateUser` | 6 | `GET /`, `compile`, `download-pdf`, `admin/*` |
| Jobs | `/api/jobs` | `job/job.route.js` | `authenticateUser` | 8 | CRUD + `/college`, `/student`, `/:id/approve` |
| Applications | `/api/application` | `application/application.route.js` | `authenticateUser` | 8 | `/student`, `/company`, `/institution`, `/:id/resume`, `/:id` CRUD |
| Exam | `/api/exam` | `exam/exam.route.js` | `authenticateUser` | 7 | `GET /`, `from-jd`, `/:id`, `/detail/:id`, `/:id/proctoring` |
| Paper | `/api/paper` | `exam/paper.route.js` | `authenticateUser` | 8 | `/:id` CRUD + `session`, `violation`, `snapshot`, `auto-submit`, `proctoring` |
| Rounds | `/api/rounds` | `interview/round.route.js` | `authenticateUser` | 9 | Job rounds & candidate round management |
| Interviews | `/api/interviews` | `interview/interview.route.js` | `authenticateUser` | 11 | Schedule, bulk, room, start/end/cancel |
| Dashboard | `/api/stats` | `dashboard/dashboard.route.js` | `authenticateUser` | 3 | `/`, `/admin-report`, `/transactions` |
| Payment (x2) | `/api/payment`, `/api/order` | `subscription/payment.route.js` | `authenticateUser` (+ `paymentLimiter`) | 10 (5x2) | Duplicate mount (`API-ISSUE-014`) |
| ExamPayment | `/api/aiexam` | `subscription/exampayment.route.js` | `authenticateUser` | 3 | `/`, `/verify`, `/verify/:id` |
| Subscription | `/api/recruitment-subscription` | `subscription/subscription.route.js` | `authenticateUser` (+1 public `app.get`) | 11 | Plans + company subscriptions |
| Preparation | `/api/preparation` | `preparation/preparation.route.js` | `authenticateUser` + `requireStudentSubscription` | 32 | Subjects, questions, mock tests, daily, bookmarks, PDFs, progress |
| Upload | `/api/upload` | `upload/upload.route.js` | Mixed (route-level Auth) | 11 | Single/multi/mixed uploads + `DELETE /:filename` |
| Contact | `/api/contact` | `contact/contact.route.js` | **Public** | 3 | `GET /`, `POST /`, `DELETE /:id` |
| JobFinder | `/api/job-finder` | `jobFinder/jobFinder.route.js` | `authenticateUser` | 21 | 8 student + 13 admin endpoints |

---

## 3. Unmounted Routes (`server/src/modules/session/session.route.js` — 6 Endpoints)

| Method | Intended Path | Handler | Middleware | Status |
|---|---|---|---|---|
| `GET` | `/api/sessions` | `getUserSessions` | `enhancedAuthenticateUser`, `trackSessionActivity`, `validateSession` | Unmounted / Unreachable |
| `GET` | `/api/sessions/current` | `getSessionInfo` | `enhancedAuthenticateUser`, `trackSessionActivity` | Unmounted / Unreachable |
| `DELETE` | `/api/sessions/:sessionId` | `terminateSession` | `enhancedAuthenticateUser`, `trackSessionActivity`, `validateSession` | Unmounted / Unreachable |
| `DELETE` | `/api/sessions` | `terminateAllOtherSessions` | `enhancedAuthenticateUser`, `trackSessionActivity`, `validateSession` | Unmounted / Unreachable |
| `PATCH` | `/api/sessions/settings` | `updateSessionSettings` | `enhancedAuthenticateUser`, `trackSessionActivity` | Unmounted / Unreachable |
| `POST` | `/api/sessions/refresh` | `refreshToken` | `enhancedAuthenticateUser`, `concurrentSessionControl` | Unmounted / Unreachable |
