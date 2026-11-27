# S0-01 — API Inventory

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Total Route Files:** 28 (`27` mounted in `server/src/app.js`, `1` unmounted: `session.route.js`)  
**Global Prefix Middleware (`/api/`):** `generalLimiter`, `requireIdempotency`

---

## 1. System & Health Endpoints (`app.js`)
| Method | Endpoint | Auth | RBAC | Status / Notes |
|---|---|---|---|---|
| `GET` | `/api/test` | Public | None | Active health check |
| `POST` | `/api/ct-report` | Public | None | Logs CT report body |
| `POST` | `/api/csp-report` | Public | None | Logs CSP violation body |
| `GET` | `/api/recruitment-subscription/plans/active` | Public | None | Active plans (also duplicated in `subscription.route.js`) |

---

## 2. Auth, Login & User (`modules/auth/*`, `modules/session/*`)
| Method | Endpoint | Controller | Auth | RBAC | Validation / Issues |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | `auth.controller#register` | **Public** | **None (CRITICAL)** | Validates `email`/`password`, controller reads `admin_password`; creates Admin |
| `POST` | `/api/auth/login` | `auth.controller#login` | Public | None | Validates `email`/`password`, controller queries `admin_email` (BROKEN) |
| `GET` | `/api/auth/logout` | `auth.controller#logout` | Public | None | Clears `token` cookie |
| `POST` | `/api/auth/forgot-password` | `auth.controller#forgotPassword` | Public | None | Uses `req.headers.origin` for reset link |
| `POST` | `/api/auth/reset-password` | `auth.controller#resetPassword` | Public | None | SHA-256 token lookup, min length 6 |
| `POST` | `/api/login/` | `login.controller#login` | Public | None | Multi-collection login; missing `*_status` active check |
| `GET` | `/api/login/logout` | `login.controller#logout` | Public | None | Clears `token` cookie (also mounted at `/api/logout`) |
| `GET` | `/api/login/current-user` | `login.controller#getCurrentUser` | `authenticateUser` | Any | Duplicate of `GET /api/users/current-user` |
| `GET` | `/api/users/current-user` | `user.controller#getCurrentUser` | `authenticateUser` | Any | Duplicate |
| `PATCH` | `/api/users/update-profile` | `user.controller#updateUserProfile` | `authenticateUser` | Any | Mass assignment risk (`req.body` spread) |
| `GET/DELETE/PATCH/POST` | `/api/sessions/*` (6 endpoints) | `session.controller` | `enhancedAuthenticateUser` | Any | **UNMOUNTED / DEAD ROUTER** |

---

## 3. Academic Hierarchy (`university`, `college`, `degree`, `degreeMaster`, `branch`, `tpo`, `dropdown`)
| Method | Endpoint | Auth | RBAC | Issues |
|---|---|---|---|---|
| `GET/POST` | `/api/university/` | **None** | **None (CRITICAL)** | Unauthenticated read & create |
| `GET/PATCH/DELETE` | `/api/university/:id` | **None** | **None (CRITICAL)** | Unauthenticated read, mass-assignment update, delete |
| `PATCH` | `/api/university/:id/status/:status` | **None** | **None (CRITICAL)** | Anyone can approve/reject universities |
| `GET` | `/api/college/my-colleges` | `authenticateUser` | None | Filters by `college_university_id: req.user.userId` |
| `GET/POST` | `/api/college/` | **None** | None | Public list (exposes emails) & registration |
| `GET/PATCH/DELETE` | `/api/college/:id` | `GET`: None; `PATCH/DELETE`: Auth | `DELETE`: `Admin`; `PATCH`: controller | `PATCH` allows mass assignment of `college_verified` |
| `PATCH` | `/api/college/:id/status/:status` | `authenticateUser` | `Admin` | Active |
| `GET/POST/PATCH/DELETE` | `/api/degreeMaster/` & `/:id` | **None** | **None (CRITICAL)** | Completely unauthenticated CRUD |
| `GET/POST/PATCH/DELETE` | `/api/degree/` & `/:id` | `authenticateUser` | **None (HIGH)** | Any role can create/update/delete any college's degrees |
| `GET/POST/PATCH/DELETE` | `/api/branch/` & `/:id` | `authenticateUser` | **None (HIGH)** | Any role can create/update/delete any college's branches |
| `GET/POST/PATCH/DELETE` | `/api/tpo/` & `/:id` | `authenticateUser` | **None (HIGH)** | Any role can create/update/delete any TPO |
| `GET` | `/api/dropdown/*` (7 endpoints) | **None** | Public | `universities`, `colleges`, `degrees`, `branches`, `degree-masters`, `unique-degrees`, `colleges-by-degree` |

---

## 4. Students, Resume, CV Templates & Companies
| Method | Endpoint | Auth | RBAC | Issues |
|---|---|---|---|---|
| `GET/POST` | `/api/student/` & `/api/register/` | `student`: Auth; `register`: **None** | **None (CRITICAL)** | `/api/register` exposes `GET /` (all students) & `GET /:id`; `POST` has mass assignment |
| `PATCH` | `/api/student/:id/verify` | `authenticateUser` | Controller (`TPO`, `College`) | Active |
| `GET/POST` | `/api/student/resume/me` | `authenticateUser` | Self (`req.user.userId`) | Active |
| `POST` | `/api/student/resume/ai-summaries` | `authenticateUser` | Self (`req.user.userId`) | OpenAI summary generation |
| `GET/PATCH/DELETE` | `/api/student/:id` | `GET`: `/register/:id` Public! `PATCH/DELETE`: Auth | Controller | `Company`/`University` can bypass `updateStudent` ownership check |
| `GET/POST/DELETE/PATCH` | `/api/cv-templates/*` (5 endpoints) | `authenticateUser` | **None (HIGH)** | `/admin` & `/admin/:id` missing `Admin` role check; `GET /` mutates DB |
| `GET/POST` | `/api/company/` | **None** | None | Public list & registration |
| `GET/PATCH/DELETE` | `/api/company/:id` | `GET`: None; `PATCH/DELETE`: Auth | `DELETE`: `Admin`; `PATCH`: controller | `PATCH` allows mass assignment of `company_verified` |
| `PATCH` | `/api/company/:id/status/:status` | `authenticateUser` | `Admin` | Active |

---

## 5. Jobs, Applications, Exams, Proctoring, Rounds & Interviews
| Method | Endpoint | Auth | RBAC | Issues |
|---|---|---|---|---|
| `GET/POST` | `/api/jobs/` | `authenticateUser` | **None on POST** | Any role can create job |
| `GET` | `/api/jobs/college`, `/api/jobs/student` | `authenticateUser` | Controller | `/student` crashes if non-student calls it |
| `PATCH` | `/api/jobs/:id/approve` | `authenticateUser` | Controller (`TPO`) | Active |
| `GET/PATCH/DELETE` | `/api/jobs/:id` | `authenticateUser` | `PATCH/DELETE`: Controller | Ownership checked in controller |
| `GET/POST/PATCH/DELETE` | `/api/application/:id` | `authenticateUser` | `PATCH/DELETE`: Controller; `GET`: **None** | `GET /:id` leaks all applicants for any job; `POST` race condition |
| `GET` | `/api/application/student`, `/company`, `/institution` | `authenticateUser` | Controller | Active |
| `GET` | `/api/application/:id/resume` | `authenticateUser` | **None (HIGH)** | IDOR: any user can read any applicant's resume |
| `GET/POST/PATCH/DELETE` | `/api/exam/*` (6 endpoints) | `authenticateUser` | `PATCH/DELETE`: Controller | `GET /:id` & `/detail/:id` leak answers to non-Student roles |
| `POST/GET/DELETE` | `/api/paper/*` (8 endpoints) | `authenticateUser` | Controller | `POST /:id` trusts client `trustScore` & `totalViolations` |
| `GET/POST/PATCH` | `/api/rounds/*` (9 endpoints) | `authenticateUser` | **None (CRITICAL)** | Any student can advance/select themselves or edit scores |
| `GET/POST/PATCH` | `/api/interviews/*` (10 endpoints) | `authenticateUser` | **None on schedule/get** | Missing `Company` role check on schedule & ownership check on `GET /:id`, `/room/:roomId` |

---

## 6. Dashboard, Payments, Subscriptions, Preparation, Upload, Contact, JobFinder
| Module | Endpoint Count | Auth | RBAC | Issues |
|---|---|---|---|---|
| `dashboard` (`/api/stats/*`) | 3 (`GET /`, `/admin-report`, `/transactions`) | `authenticateUser` | **None (CRITICAL)** | Any user can access `/admin-report` and `/transactions` |
| `payment` (`/api/payment/*`, `/api/order/*`) | 5 (`POST /`, `GET /`, `/verify`, `/check`, `/my-payments`) | `authenticateUser` | **None (CRITICAL)** | Trusts `req.body.amount`; `GET /` exposes all payments |
| `exampayment` (`/api/aiexam/*`) | 3 (`POST /`, `/verify`, `GET /verify/:id`) | `authenticateUser` | **None** | Trusts `req.body.amount`; `GET /verify/:id` IDOR |
| `subscription` (`/api/recruitment-subscription/*`) | 10 | `authenticateUser` | `authorizePermissions("Admin"/"Company")` | `checkSubscription` returns mock free plan for `Company` |
| `preparation` (`/api/preparation/*`) | 32 | `authenticateUser` + `requireStudentSubscription` | `authorizePermissions("Admin")` on write | Well-structured RBAC & answer sanitization |
| `upload` (`/api/upload/*`) | 11 | `authenticateUser` | **None on DELETE** | `DELETE /:filename` has no ownership check (IDOR) |
| `contact` (`/api/contact/*`) | 3 (`GET /`, `POST /`, `DELETE /:id`) | **None** | **None (CRITICAL)** | Unauthenticated read & delete of contact PII |
| `jobFinder` (`/api/job-finder/*`) | 21 (incl. 2 duplicate paths) | `authenticateUser` | `authorizePermissions("Admin")` on `/admin/*` | Duplicate `/job/:id` & `/jobs/:id` routes |

**Total Discovered Endpoints (Reconciled with S0-05):** **217 mounted endpoint registrations** (**216 unique** `METHOD + path` combinations across **30 `app.use` mounts** covering **27 `.route.js` files** + **4 direct `app.js` routes**), plus **6 unmounted** routes in `session.route.js` (`223` total defined). *(Initial S0-01 draft noted `~158` before expanding the 3 double-mounted routers `/api/order`, `/api/register`, `/api/logout` and sub-routes; exact machine-verified list is in `docs/S0-05/S0-05_API_CONTRACT_DICTIONARY.md` `API-001`–`API-217`.)*
