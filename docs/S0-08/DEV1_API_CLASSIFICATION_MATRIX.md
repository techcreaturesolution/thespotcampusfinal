# S0-08 — Dev 1 API Classification Matrix

**Owner:** Dev 1 | **Baseline:** `217` mounted (`216` unique) + `6` unmounted = `223` routes (`S0-05`)

---

## 1. API Endpoint Classification Summary

| Category | Endpoint Scope | Classification | Justification & Required Changes |
|---|---|---|---|
| **Dropdowns & Health** (`GET /api/dropdown/*`, `GET /api/test`) | 8 | **REUSE** | Read-only, working contracts; reuse across Web & Flutter. |
| **Preparation** (`/api/preparation/*`) | 32 | **REUSE** | Properly guarded with `authenticateUser` + `requireStudentSubscription` + `Admin` RBAC. |
| **Auth & Users** (`/api/login`, `/api/users/*`, `/api/auth/*`) | 13 | **ENHANCEMENT** | Fix `*_status` check (`API-ISSUE-011`), whitelist `update-profile` (`API-ISSUE-007`), secure `auth/register` (`API-ISSUE-001`), remove duplicate `/api/logout` mount & broken `/api/auth/login`. |
| **Academic & Institutions** (`/api/university`, `/college`, `/degree`, `/degreeMaster`, `/branch`, `/tpo`) | 33 | **ENHANCEMENT** | Add `authenticateUser` + `authorizePermissions` on writes/status (`API-ISSUE-002`, `008`). |
| **Students, CV & Companies** (`/api/student`, `/register`, `/cv-templates`, `/company`) | 28 | **ENHANCEMENT** | Separate `POST /api/register` from `StudentRouter` (`API-ISSUE-003`), guard `/cv-templates/admin` (`API-ISSUE-008`), remove `GET` DB write (`API-ISSUE-017`). |
| **Jobs, Apps, Exams, Papers, Rounds, Interviews** | 50 | **ENHANCEMENT** | Add RBAC/ownership on `/rounds/*` (`API-ISSUE-004`), `/jobs` POST, `/application/:id`, `/interviews`, server-side `trustScore` (`API-ISSUE-009`). |
| **Payments, Dashboard, Contact, Upload, JobFinder** | 53 | **ENHANCEMENT** | Server-side Razorpay `amount` (`API-ISSUE-006`), `Admin` guard on `/stats/admin-report`, `/transactions`, `GET /payment`, `contact` (`API-ISSUE-005`), `DELETE /upload/:filename` ownership (`API-ISSUE-008`). |
| **Unmounted Sessions** (`/api/sessions/*`) | 6 | **ENHANCEMENT** (Decision Needed) | Decide whether to mount or remove dead `session.route.js` (`API-ISSUE-014`). |
| **New APIs (Notifications / Institute)** | Planned | **NEW** | Only add `/api/notifications/*` and `/api/institute/*` when those `NEW` features are approved. |
