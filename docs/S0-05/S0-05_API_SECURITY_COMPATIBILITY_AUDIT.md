# S0-05 — API Security & Compatibility Audit

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Total API Findings (`API-ISSUE-001` to `API-ISSUE-018`):** 18 (6 Critical, 6 High, 4 Medium, 2 Low)

---

## 1. API Security & Contract Findings Register

| Finding ID | API ID(s) | Category | Severity | File Path | Description | Impact | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|
| `API-ISSUE-001` | `API-001` | Security | Critical | `auth/auth.route.js#L7` | Unauthenticated `POST /api/auth/register` creates Admin | Anyone can register an Admin account | Disable or protect with Admin auth | Open |
| `API-ISSUE-002` | `API-010`–`015`, `API-033`–`037`, `API-201`–`203` | Security | Critical | `app.js`, `university.route.js`, `degreemaster.route.js`, `contact.route.js` | Unauthenticated CRUD/status on University, DegreeMaster, Contact (`GET`/`DELETE`) | Public tampering & PII leak | Add `authenticateUser` + `authorizePermissions("Admin")` | Open |
| `API-ISSUE-003` | `API-054`–`069` | Security | Critical | `app.js#L188`, `student.route.js` | `/api/register` mounts full `StudentRouter` without auth | Public `GET /api/register` dumps all students; mass-assignment `POST` | Isolate public registration route; whitelist fields | Open |
| `API-ISSUE-004` | `API-106`–`114` | Security | Critical | `interview/round.route.js`, `round.controller.js` | Zero RBAC/ownership on all 9 `/api/rounds/*` endpoints | Students can select themselves or alter scores | Enforce `Company`/`Admin` + job ownership | Open |
| `API-ISSUE-005` | `API-127`, `API-128`, `API-130`, `API-135` | Security | Critical | `dashboard.route.js`, `payment.route.js` | Missing `Admin` role guard on `/stats/admin-report`, `/stats/transactions`, `GET /payment/`, `GET /order/` | All users can read platform revenue & payment PII | Add `authorizePermissions("Admin")` | Open |
| `API-ISSUE-006` | `API-129`, `API-134`, `API-139` | Security | Critical | `payment.controller.js`, `exampayment.controller.js` | Client-controlled `amount` in Razorpay order creation | ₹1 payment bypass | Derive `amount` server-side from `RecruitmentPlan` | Open |
| `API-ISSUE-007` | `API-009`, `API-020`, `API-052`, `API-068` | Security | High | `user.controller.js`, `student.controller.js`, `college.controller.js`, `company.controller.js` | Mass assignment + `Company`/`University` bypass in `updateStudent` | Self-approval & unauthorized student edits | Whitelist fields; fix `updateStudent` role check | Open |
| `API-ISSUE-008` | Multiple | Security | High | `tpo`, `degree`, `branch`, `cvTemplate`, `upload`, `application`, `interview`, `exampayment` | Missing RBAC/ownership on institutional CRUD, `DELETE /upload/:filename`, `GET /application/:id`, `/:id/resume`, `GET /interviews/:id`, `/room/:roomId`, `/aiexam/verify/:id` | IDOR & unauthorized mutations | Add role + ownership checks | Open |
| `API-ISSUE-009` | `API-092`, `094`, `098`, `105` | Security | High | `exam.controller.js`, `paper.controller.js` | `POST /paper/:id` trusts client `trustScore`; `GET /exam/:id` leaks `isCorrect` to non-Student roles | Exam cheating & answer key exposure | Compute `trustScore` server-side; restrict `isCorrect` to Admin/owner | Open |
| `API-ISSUE-010` | `API-001`, `API-002` | Contract | High | `auth/auth.route.js`, `auth.controller.js` | Validation (`email`/`password`) mismatches controller (`admin_email`/`admin_password`) | `/api/auth/login` & `/register` broken | Align fields or remove legacy endpoints | Open |
| `API-ISSUE-011` | `API-006` | Security | High | `auth/login.controller.js`, Flutter `auth_service.dart` | Ignores `*_status === "1"` on login; Flutter doesn't verify `role === "Student"` | Deactivated users can log in; non-students can use Student app | Check `*_status` on backend & `role` in Flutter | Open |
| `API-ISSUE-012` | `API-119` | Integration | High | `flutter_student_app/lib/screens/interview_list_screen.dart#L54` | `_joinInterview` strips `/api` from `baseUrl` instead of using web client URL | Broken video interview link on mobile | Configure `WEB_CLIENT_URL` or native WebRTC | Open |
| `API-ISSUE-013` | Multiple | Contract | Medium | `student`, `college`, `company`, `job`, `application`, `dashboard` | Missing pagination on core list endpoints | Unbounded payloads | Standardize `page`/`limit` pagination | Open |
| `API-ISSUE-014` | Multiple | Contract | Medium | `app.js`, `session.route.js` | Duplicate mounts (`/order`=`/payment`, `/student`=`/register`, `/login`=`/logout`), duplicate `plans/active`, 6 unmounted `/sessions/*` | Confusing API surface | Remove duplicate mounts; decide on `/sessions` | Open |
| `API-ISSUE-015` | All | Contract | Medium | Controllers | Inconsistent response/error envelopes (`{msg}` vs `{error}` vs `{success, data}`) & raw 500 error leaks | Fragile client error handling | Standardize error middleware & response format | Open |
| `API-ISSUE-016` | All | Versioning | Medium | `app.js` | Zero API versioning (`/api/v1` absent) | Breaking changes hit Web & Flutter simultaneously | Plan `/api/v1` prefix for future breaking changes | Open |
| `API-ISSUE-017` | `API-070` | Quality | Low | `cvTemplate.controller.js#L118` | `GET /api/cv-templates` mutates DB (`t.save()`) | Unexpected write on GET | Move to migration script | Open |
| `API-ISSUE-018` | `API-199`–`202` | Contract | Low | `jobFinder.route.js#L45-48` | Duplicate `/job/:id` & `/jobs/:id` aliases | Minor route redundancy | Consolidate to `/jobs/:id` | Open |
