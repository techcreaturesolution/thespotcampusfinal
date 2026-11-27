# Security Remediation Report

**Project:** The Spot Campus (`thespotcampusfinal`) | **Branch:** `s0-11-remediation`

---

- **Auth & Registration (`AUD-001, 013`):** Guarded `/api/auth/register` with `authenticateUser, authorizePermissions("Admin")`; isolated `/api/register` to `POST` `createStudent` only; added `isAccountInactive` check in `login.controller.js`.
- **RBAC (`AUD-002, 003, 005, 006, 009, 010`):** Applied `authorizePermissions` across `dashboard.route.js`, `payment.route.js`, `contact.route.js`, `cvTemplate.route.js`, `university.route.js`, `college.route.js`, and `round.route.js`.
- **Payments (`AUD-007`):** Replaced client `amount` with server-side `RecruitmentPlan.price` / `AI_EXAM_PRICE` and added `crypto.timingSafeEqual` + idempotency.
- **Upload & Exam (`AUD-011, 015`):** Enforced ownership + `path.basename` on `DELETE /api/upload/:filename` and removed client `req.body.proctoring.trustScore` overwrite in `paper.controller.js`.
