# S0-09 — Master File Ownership Matrix

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## Master Ownership Table (Core Directories & Key Files — `328` Files Covered)

| File Path / Pattern | Feature IDs | Primary Owner | Secondary Consumer | File Type | Modification Permission | Dependency Level | Risk | Integration Notes |
|---|---|---|---|---|---|---|---|---|
| `server/server.js` | All Backend | Dev 1 | Dev 2 (Runtime) | Backend | Allowed (Dev 1) | Blocking | High | Socket.IO & DB boot |
| `server/src/app.js` | All | Dev 1 | Dev 2 (Web/Flutter) | Shared | Approval Required | Blocking | Critical | CORS, Helmet, Error MW |
| `server/src/config/routes.js` | `FEAT-001`–`021` | Dev 1 | Dev 2 | Shared | Approval Required | Blocking | Critical | `30` mounts + `4` direct |
| `server/src/config/env.js`, `db.js`, `socket.js`, `uploads.js` | All | Dev 1 | Dev 2 | Shared | Approval Required | Blocking | High | Notify Dev 2 on URL/event change |
| `server/src/middleware/authMiddleware.js` | `FEAT-007`–`018` | Dev 1 | Dev 2 | Shared | Approval Required | Blocking | Critical | Authoritative JWT + RBAC |
| `server/src/middleware/errorHandlerMiddleware.js` | All | Dev 1 | Dev 2 | Shared | Approval Required | Required | High | `{ msg }` error contract |
| `server/src/middleware/fileUploadMiddleware.js` | `FEAT-018` | Dev 1 | Dev 2 | Shared | Approval Required | Required | High | Multer/Cloudinary contract |
| `server/src/utils/constants.js` | `FEAT-007`–`021` | Dev 1 | Dev 2 | Shared | Approval Required | Required | High | Role/status enums |
| `server/src/modules/auth/auth.route.js` | `FEAT-005, 007, 011` | Dev 1 | Dev 2 | Shared | Approval Required | Blocking | Critical | Auth & `/api/register` |
| `server/src/modules/subscription/payment.route.js` | `FEAT-016` | Dev 1 | Dev 2 | Shared | Approval Required | Blocking | Critical | Razorpay order/verify |
| `server/src/modules/**/*.model.js` (`38` files) | `FEAT-001`–`025` | Dev 1 | None (API only) | Backend | Allowed (Dev 1) | Blocking | Critical | Dev 1 exclusive DB ownership |
| `server/src/modules/**` (other `89` files) | `FEAT-001`–`021` | Dev 1 | Dev 2 (API) | Backend | Allowed (Dev 1) | Required | High | Controllers, services, routes |
| `server/src/errors/*`, `scripts/*`, `utils/*` (excl. `constants.js`), `rateLimiter.js`, root configs | `FEAT-001`–`023` | Dev 1 | None | Backend | Allowed (Dev 1) | Required | Medium | `18` exclusive backend files |
| `client/src/utils/customFetch.js` | All Web | Dev 2 | Dev 1 (Contract) | Shared | Approval Required | Blocking | Critical | `76` importers; 401/CSRF |
| `client/src/App.jsx` | All Web | Dev 2 | None | Shared | Approval Required | Blocking | High | `67` routes + `<RoleGuard>` |
| `client/src/common/pages/DashboardLayout.jsx` | All Web | Dev 2 | Dev 1 (Auth) | Shared | Approval Required | Blocking | Critical | Auth context & sidebar |
| `client/src/common/components/DataTable.jsx`, `PageHeader.jsx`, `DashboardCard.jsx` | `FEAT-019` | Dev 2 | None | Shared | Approval Required | Required | Medium | Shared UI primitives |
| `client/src/{admin,college,company,student,tpo,university,common}/**` (`101` excl. files) | `FEAT-003`–`019` | Dev 2 | None | Web | Allowed (Dev 2) | Required | Medium | Exclusive Web UI pages/modals |
| `client/` root configs (`7` files) | `FEAT-019, 022` | Dev 2 | None | Web | Allowed (Dev 2) | Required | Medium | Vite, Tailwind, ESLint |
| `flutter_student_app/lib/services/api_service.dart` | All Flutter | Dev 2 | Dev 1 (Contract) | Shared | Approval Required | Blocking | Critical | `27` importers; Dio client |
| `flutter_student_app/lib/services/auth_service.dart` | `FEAT-007, 020` | Dev 2 | Dev 1 (Contract) | Shared | Approval Required | Blocking | Critical | `10` importers; Student gate |
| `flutter_student_app/lib/utils/constants.dart`, `lib/main.dart` | All Flutter | Dev 2 | Dev 1 (URL) | Shared | Approval Required | Blocking | High | Base URL & `27` routes |
| `flutter_student_app/lib/{screens,widgets,models,services/*}` + `test/` + configs (`47` files) | `FEAT-003`–`020` | Dev 2 | None | Flutter | Allowed (Dev 2) | Required | Medium | Exclusive Flutter UI/platform |
| `README.md`, `.gitignore` | Repo | Dev 1 (Lead) | Both | Shared | Approval Required | Optional | Low | Joint repo governance |
| `server/.env`, `client/.env`, `flutter_student_app/.env`, `.agents/AGENTS.md` | All | Protected | Both (Read) | Protected | Restricted | Blocking | Critical | Never commit secrets/modify rules |
