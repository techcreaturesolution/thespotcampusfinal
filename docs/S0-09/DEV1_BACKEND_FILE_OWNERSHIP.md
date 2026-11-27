# Dev 1 — Backend File Ownership

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-09 | **Owner:** Dev 1  
**Baseline:** Branch `ravi` | **Commit:** `66220d594954ba077cf1d4a709eba3a084a74abc`

---

## 1. Backend Ownership Summary
- **Total Server Files (excl. `server/.cache/` & `server.zip`):** **158** (`152` JS files in `server/src/`, `1` `server/server.js`, `5` root config/manifest files).
- **Dev 1 Exclusive Files:** **145**
- **Shared Files (Dev 1 Primary Owner):** **12**
- **Protected Files:** **1** (`server/.env`)
- **Non-Source Artifacts Excluded from Ownership:** `server/.cache/` (`139` Puppeteer cache files), `server/server.zip` (`1` archive).

> **Strict Boundary:** Dev 2 MUST NOT independently modify any file under `server/`. All backend API, schema, middleware, and config changes go through Dev 1.

---

## 2. Directory-by-Directory Ownership

| Directory / File | Count | Ownership | Dev 2 Access | Notes |
|---|---:|---|---|---|
| `server/server.js` | 1 | **Dev 1 Exclusive** | Read-Only | Entry point, DB connect, Socket.IO boot |
| `server/src/app.js` | 1 | **Shared (Dev 1 Primary)** | Read-Only | Express app, CORS, helmet, morgan, error handler |
| `server/src/config/*` (excl. `rateLimiter.js`) | 5 | **Shared (Dev 1 Primary)** | Read-Only | `routes.js`, `env.js`, `db.js`, `socket.js`, `uploads.js` |
| `server/src/config/rateLimiter.js` | 1 | **Dev 1 Exclusive** | Read-Only | Rate limit rules (`FEAT-007`) |
| `server/src/errors/customErrors.js` | 1 | **Dev 1 Exclusive** | Read-Only | Imported by `21` backend files |
| `server/src/middleware/authMiddleware.js` | 1 | **Shared (Dev 1 Primary)** | Read-Only | Authoritative JWT + RBAC (`authorizePermissions`) |
| `server/src/middleware/errorHandlerMiddleware.js` | 1 | **Shared (Dev 1 Primary)** | Read-Only | Global JSON error shape `{ msg, ... }` |
| `server/src/middleware/fileUploadMiddleware.js` | 1 | **Shared (Dev 1 Primary)** | Read-Only | Authoritative Multer/Cloudinary upload pipeline |
| `server/src/middleware/multerMiddleware.js`, `sessionSecurityMiddleware.js`, `validationMiddleware.js` | 3 | **Dev 1 Exclusive** | Read-Only | Note: `multerMiddleware.js` deprecated in `FEAT-018` |
| `server/src/utils/constants.js` | 1 | **Shared (Dev 1 Primary)** | Read-Only | Shared enums, roles, statuses |
| `server/src/utils/*` (remaining 7 files) | 7 | **Dev 1 Exclusive** | Read-Only | `cvTemplates.js`, `emailCheck.js`, `generateMCQs.js`, `passwordUtils.js`, `pdfGenerator.js`, `sendEmail.js`, `tokenUtils.js` |
| `server/src/scripts/seed.js` | 1 | **Dev 1 Exclusive** | Read-Only | Admin & initial seed script |
| `server/src/modules/auth/auth.route.js`, `subscription/payment.route.js` | 2 | **Shared (Dev 1 Primary)** | Read-Only | Auth & Razorpay API contracts |
| `server/src/modules/**` (remaining 127 files across 22 modules) | 127 | **Dev 1 Exclusive** | Read-Only | Models, controllers, services, routes, validators |
| `server/package.json`, `package-lock.json`, `install-chrome.js`, `.puppeteerrc.cjs` | 4 | **Dev 1 Exclusive** | Read-Only | Backend manifests & Puppeteer setup |
| `server/.env` | 1 | **Protected** | No Access | Secrets & DB URI; never commit or expose |

---

## 3. Backend Module Ownership (22 Modules — `129` Files)
- **Domain Modules (17):** `application`, `auth`, `branch`, `college`, `company`, `contact`, `dashboard`, `degree`, `exam`, `interview`, `job`, `jobFinder`, `preparation` (5 sub-entities), `student`, `subscription`, `tpo`, `university`.
- **Support Modules (4):** `dropdown`, `idempotency`, `payment` (inside `subscription`), `upload`.
- **Dead / Unmounted Module (1):** `session` (unmounted; Dev 1 Exclusive cleanup candidate).
