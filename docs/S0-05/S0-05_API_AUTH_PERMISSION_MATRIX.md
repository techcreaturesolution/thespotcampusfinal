# S0-05 — Authentication & Permission Matrix

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Auth Middleware:** `authenticateUser` (180 endpoints), `requireStudentSubscription` (32 `/api/preparation/*` endpoints), `authorizePermissions(...roles)` (35 endpoints at route level).

---

## 1. Consolidated Auth & Permission Matrix

| Module / Route Group | Auth (`authenticateUser`) | Route-Level RBAC | Controller-Level RBAC / Ownership | Gap / Risk |
|---|---|---|---|---|
| `POST /api/auth/register` | **No** | None | None | **Critical (`API-ISSUE-001`)**: Public Admin creation |
| `POST /api/login` | No | None | Checks `isVerifiedByTPO` / `*_verified === "Approved"` | **High (`API-ISSUE-011`)**: Ignores `*_status === "1"` |
| `PATCH /api/users/update-profile` | Yes | None | Self (`req.user.userId`) | **High (`API-ISSUE-007`)**: Mass assignment |
| `/api/university/*` (6) | **No** | None | None | **Critical (`API-ISSUE-002`)**: Public CRUD & approval |
| `/api/degreeMaster/*` (5) | **No** | None | None | **Critical (`API-ISSUE-002`)**: Public CRUD |
| `/api/contact` (`GET`, `DELETE`) | **No** | None | None | **Critical (`API-ISSUE-002`)**: Public PII read/delete |
| `/api/register` (`GET /`, `GET /:id`) | **No** | None | None | **Critical (`API-ISSUE-003`)**: Public Student PII dump |
| `/api/college/*` | Mixed | `Admin` on `DELETE`, `status` | `College`/`Admin` on `PATCH /:id` | Mass assignment on `PATCH /:id` |
| `/api/company/*` | Mixed | `Admin` on `DELETE`, `status` | `Company`/`Admin` on `PATCH /:id` | Mass assignment on `PATCH /:id` |
| `/api/tpo/*`, `/api/degree/*`, `/api/branch/*` | Yes | **None** | `GET` scoped; writes **unprotected** | **High (`API-ISSUE-008`)**: Any role can write/delete |
| `/api/cv-templates/admin*` | Yes | **None** | None | **High (`API-ISSUE-008`)**: Missing `Admin` guard |
| `/api/jobs/*` | Yes | **None** | `PATCH`/`DELETE` Company/Admin; `approve` TPO | `POST /api/jobs` open to any role |
| `/api/application/*` | Yes | **None** | `PATCH`/`DELETE` scoped; `GET /:id` & `/:id/resume` **unprotected** | **High (`API-ISSUE-008`)**: IDOR on applicant list & resume |
| `/api/exam/*` & `/api/paper/*` | Yes | **None** | `PATCH`/`DELETE` exam & `GET` paper scoped | `GET /exam/:id` leaks answers to non-Student roles |
| `/api/rounds/*` (9) | Yes | **None** | **None** | **Critical (`API-ISSUE-004`)**: Any Student can self-select |
| `/api/interviews/*` (11) | Yes | **None** | Partial (`job`, `student`) | `POST /`, `/bulk`, `GET /:id`, `/room/:roomId` unprotected |
| `/api/stats/admin-report`, `/transactions` | Yes | **None** | **None** | **Critical (`API-ISSUE-005`)**: Revenue/PII exposed to all roles |
| `GET /api/payment/`, `GET /api/order/` | Yes | **None** | **None** | **Critical (`API-ISSUE-005`)**: All student payments exposed |
| `/api/recruitment-subscription/*` | Yes | `Admin` / `Company` | Scoped | `checkSubscription` returns mock plan for `Company` |
| `/api/preparation/*` (32) | Yes + Sub | `Admin` on all writes | Student-scoped reads/attempts | Properly enforced |
| `/api/job-finder/*` (21) | Yes | `Admin` on `/admin/*` | Owner-scoped searches | Properly enforced |
| `DELETE /api/upload/:filename` | Yes | **None** | **None** | **High (`API-ISSUE-008`)**: Arbitrary file deletion |
