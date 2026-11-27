# S0-01 — Security Audit Report

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Scope:** Defensive code & dependency review of `server/` (zero exploitation performed; zero secrets exposed).

---

## 1. Findings Summary

| Severity | Count |
|---|---|
| Critical | 9 |
| High | 12 |
| Medium | 6 |
| Low | 0 |
| **Total Security Findings** | **27** |

*(Additional non-security Database/Performance/Code Quality findings are tracked in `S0-01_DATABASE_AUDIT.md` and `S0-01_TECHNICAL_DEBT.md`.)*

---

## 2. Critical Findings

| Finding ID | Category | Severity | File Path | Description | Evidence | Impact | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|
| `AUD-001` | Security/Auth | Critical | `server/src/modules/auth/auth.route.js#L7`, `auth.controller.js#L14` | Unauthenticated Admin registration | `POST /api/auth/register` has no auth middleware and creates `tbl_admin` from `req.body` | Anyone on the internet can attempt to register an Admin account. | Disable public admin registration or protect with existing Admin auth + setup secret. | Open |
| `AUD-002` | Security/Auth | Critical | `server/src/app.js#L167`, `university.route.js#L14-L20` | Unauthenticated University CRUD & approval | `/api/university` mounted without `authenticateUser`; no route/controller auth | Anyone can create, modify, delete, or approve universities. | Protect write/status endpoints with `authenticateUser` and `authorizePermissions("Admin")`. | Open |
| `AUD-003` | Security/Auth | Critical | `server/src/app.js#L185`, `degreemaster.route.js#L12-L13` | Unauthenticated DegreeMaster CRUD | `/api/degreeMaster` mounted without `authenticateUser` | Anyone can modify or delete master degree definitions. | Add `authenticateUser` and `authorizePermissions("Admin")` to write routes. | Open |
| `AUD-004` | Security/Auth | Critical | `server/src/app.js#L188`, `student.route.js#L27-L44`, `student.controller.js#L42` | Unauthenticated Student PII dump & registration bypass | `StudentRouter` mounted at `/api/register` without `authenticateUser`; `createStudent` passes `req.body` directly | Anyone can `GET /api/register/` to dump all student PII, or `POST` with `isVerifiedByTPO: true`. | Separate public registration route from authenticated `/api/student`; whitelist registration fields. | Open |
| `AUD-005` | Security/RBAC | Critical | `server/src/modules/interview/round.route.js`, `round.controller.js` | Zero authorization on Recruitment Rounds | `advanceCandidates`, `updateCandidateRound`, `addRoundsToJob`, `updateRoundStatus` have no role/ownership checks | Any Student can advance/select themselves or modify scores. | Enforce `authorizePermissions("Company", "Admin")` and job ownership checks. | Open |
| `AUD-006` | Security/RBAC | Critical | `dashboard.route.js#L7-L8`, `payment.route.js#L12` | Missing Admin RBAC on financial & admin reports | `GET /api/stats/admin-report`, `GET /api/stats/transactions`, `GET /api/payment/` lack `authorizePermissions("Admin")` | Any authenticated user can view platform revenue, user emails, and payment logs. | Add `authorizePermissions("Admin")` to all three endpoints. | Open |
| `AUD-007` | Security/Payment | Critical | `payment.controller.js#L20`, `exampayment.controller.js#L13` | Client-controlled Razorpay order amount | `const { amount } = req.body;` passed directly to `razorpay.orders.create({ amount: amount * 100 })` | Attacker can pay `₹1` for any subscription or AI exam. | Look up authoritative price from `RecruitmentPlan` or server config; never trust client `amount`. | Open |
| `AUD-008` | Security/Mass Assignment | Critical | `user.controller.js#L104`, `student.controller.js#L116`, `college.controller.js#L96`, `company.controller.js#L80` | Mass assignment on profile & entity updates | `req.body` passed directly to `findByIdAndUpdate` | Users can self-approve (`company_verified: "Approved"`, `isVerifiedByTPO: true`) or overwrite password hashes. | Explicitly whitelist updatable fields per role. | Open |
| `AUD-009` | Security/Auth | Critical | `server/src/app.js#L166`, `contact.route.js#L11-L12` | Unauthenticated Contact PII read & delete | `/api/contact` has no auth on `GET /` or `DELETE /:id` | Anyone can read all contact form submissions or delete them. | Protect `GET /` and `DELETE /:id` with `authenticateUser` + `authorizePermissions("Admin")`. | Open |

---

## 3. High Findings

| Finding ID | Category | Severity | File Path | Description | Evidence | Impact | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|
| `AUD-010` | Security/RBAC | High | `tpo.route.js`, `degree.route.js`, `branch.route.js`, `cvTemplate.route.js` | Missing RBAC on admin/institution CRUD | No `authorizePermissions` on TPO, Degree, Branch, or `/cv-templates/admin` | Any authenticated user can create/modify/delete TPOs, degrees, branches, or CV templates. | Enforce `Admin` / `College` role & ownership checks. | Open |
| `AUD-011` | Security/IDOR | High | `server/src/modules/upload/upload.route.js#L245-L293` | Arbitrary file deletion & Windows path check gap | `DELETE /:filename` has no ownership check and only checks `/` not `\` | Any authenticated user can delete other users' uploaded files. | Track file ownership in DB or restrict deletion to Admin/owner; sanitize `path.basename`. | Open |
| `AUD-012` | Security/IDOR | High | `application.controller.js#L11,320`, `interview.controller.js#L226,246`, `exampayment.controller.js#L64` | Missing ownership checks on read endpoints | `GET /application/:id`, `/:id/resume`, `/interviews/:id`, `/room/:roomId`, `/aiexam/verify/:id` | Authenticated users can access other companies'/students' applications, resumes, and interviews. | Verify `req.user` is the owning company, applicant student, or Admin. | Open |
| `AUD-013` | Security/RBAC | High | `server/src/modules/student/student.controller.js#L94-L105` | `updateStudent` logic flaw bypasses ownership for `Company`/`University` | `else if (role !== "Student" && role !== "Admin")` only checks `College` and `TPO` | `Company` and `University` roles can update any student record. | Deny all roles except `Admin`, self `Student`, and owning `College`/`TPO`. | Open |
| `AUD-014` | Security/Auth | High | `server/src/modules/auth/login.controller.js#L26-L93` | Deactivated accounts not blocked at login | Checks `isVerifiedByTPO` / `*_verified`, but never checks `*_status === STATUS.ACTIVE` | Deactivated students, companies, colleges, universities, and TPOs can still log in. | Check `*_status === STATUS.ACTIVE` for all roles on login. | Open |
| `AUD-015` | Security/Proctoring | High | `server/src/modules/exam/paper.controller.js#L124-L126` | Client-supplied proctoring scores trusted on submit | `paper.proctoring.trustScore = req.body.proctoring.trustScore ?? ...` | Cheating students can submit `trustScore: 100, totalViolations: 0`. | Compute `trustScore` and `totalViolations` strictly server-side from recorded events. | Open |
| `AUD-016` | Security/Exam | High | `server/src/modules/exam/exam.controller.js#L159,183` | Exam answer keys only stripped for `Student` role | `if (req.user && req.user.role === "Student") { sanitize... }` | Non-owning Companies, TPOs, or Colleges can fetch `isCorrect` flags for any exam. | Strip `isCorrect` for everyone except Admin and the owning Company. | Open |
| `AUD-017` | Security/Auth | High | `server/src/modules/auth/auth.route.js`, `auth.controller.js` | Validation/controller field mismatch | `loginValidation` checks `email`/`password`; `login` reads `admin_email`/`admin_password` | `POST /api/auth/login` and `/register` are broken/inconsistent. | Align field names or deprecate legacy `/api/auth/login`. | Open |
| `AUD-018` | Security/Deps | High | `server/package.json` | 29 production dependency vulnerabilities | `npm audit --omit=dev --json`: 4 critical, 23 high, 2 moderate | Known CVEs in transitive/direct packages (`@puppeteer/browsers`, etc.). | Run `npm audit fix` and review breaking upgrades in a dedicated PR. | Open |
| `AUD-021` | Security/Network | High | `server/src/utils/sendEmail.js#L36`, `auth.controller.js#L144` | Disabled SMTP TLS verification & Origin header trust | `tls: { rejectUnauthorized: false }`; `origin = req.headers.origin` | MITM risk on SMTP; password reset link host poisoning if Origin is spoofed. | Enable TLS verification in production; use allowlisted `CLIENT_URL` for reset links. | Open |

*(Note: `AUD-019` and `AUD-020` are High Database findings documented in `S0-01_DATABASE_AUDIT.md`.)*

---

## 4. Medium Security Findings

| Finding ID | Category | Severity | File Path | Description | Recommendation | Status |
|---|---|---|---|---|---|---|
| `AUD-031` | Security/JWT | Medium | `login.controller.js#L121`, `sessionSecurityMiddleware.js#L12` | JWT returned in JSON body + random fallback `SESSION_SECRET` | Rely on `httpOnly` cookie for web; require explicit `SESSION_SECRET` if sessions enabled. | Open |

*(Additional Medium findings `AUD-022`–`AUD-030`, `AUD-032` are tracked in `S0-01_DATABASE_AUDIT.md` and `S0-01_TECHNICAL_DEBT.md`.)*
