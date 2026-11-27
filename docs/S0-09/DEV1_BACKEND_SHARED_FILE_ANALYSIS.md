# Dev 1 — Backend Shared File Analysis

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-09 | **Owner:** Dev 1  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Detailed Shared File Register (Dev 1 Primary Owner — 12 Files)

| File Path | File Purpose | Primary Owner | Consumers | Shared By | Modification Permission | Approval Required | Dependencies | Risk | Change Impact |
|---|---|---|---|---|---|---|---|---|---|
| `server/src/app.js` | Express app, CORS, helmet, error middleware | Dev 1 | Server, Web, Flutter | Dev 1 + Dev 2 | Dev 1 only | Yes (Dev 1 + Dev 2 notify) | `routes.js`, `env.js`, `errorHandlerMiddleware.js` | **Critical** | CORS/cookie/header changes break all clients |
| `server/src/config/routes.js` | Central API route mounts (`30` mounts + `4` direct) | Dev 1 | All 22 modules, Web, Flutter | Dev 1 + Dev 2 | Dev 1 only | Yes (Contract sync) | All `*.route.js` | **Critical** | Changing mount path breaks Web & Flutter URLs |
| `server/src/config/env.js` | Environment variable validation & defaults | Dev 1 | Backend, DevOps | Dev 1 + Dev 2 | Dev 1 only | Yes | `server/.env` | **High** | Missing/renamed env vars crash boot or JWT/Razorpay |
| `server/src/config/db.js` | MongoDB Mongoose connection | Dev 1 | All 39 models | Dev 1 | Dev 1 only | Yes | `env.js` | **High** | Connection/pool changes affect all DB ops |
| `server/src/config/socket.js` | Socket.IO server & interview room events | Dev 1 | `VideoInterview.jsx` (Web) | Dev 1 + Dev 2 | Dev 1 only | Yes | `server.js`, `VideoInterview.jsx` | **High** | Event name/payload changes break live interviews |
| `server/src/config/uploads.js` | Upload directory/Cloudinary URL config | Dev 1 | `upload`, `student`, `company` | Dev 1 + Dev 2 | Dev 1 only | Yes | `fileUploadMiddleware.js` | **Medium** | Path/URL changes break image/PDF rendering |
| `server/src/middleware/authMiddleware.js` | Authoritative JWT verify & `authorizePermissions` | Dev 1 | `12+` routes, Web, Flutter | Dev 1 + Dev 2 | Dev 1 only | Yes (Critical security) | `tokenUtils.js`, `customErrors.js` | **Critical** | Auth/401/403 behavior affects every protected flow |
| `server/src/middleware/errorHandlerMiddleware.js` | Global HTTP status & `{ msg }` error formatter | Dev 1 | All routes, `customFetch.js`, `ApiService` | Dev 1 + Dev 2 | Dev 1 only | Yes | `customErrors.js` | **High** | Changing `{ msg }` key breaks client error toasts |
| `server/src/middleware/fileUploadMiddleware.js` | Authoritative Multer/Cloudinary middleware | Dev 1 | `upload`, `student`, `preparation` | Dev 1 + Dev 2 | Dev 1 only | Yes | `uploads.js` | **High** | Field name/size/MIME changes break form uploads |
| `server/src/utils/constants.js` | Shared enums, role names, status constants | Dev 1 | `10` backend files, Web/Flutter enums | Dev 1 + Dev 2 | Dev 1 only | Yes (Notify Dev 2) | Models, controllers | **High** | Enum mismatch breaks role/status checks on clients |
| `server/src/modules/auth/auth.route.js` | Auth, password reset, `/api/register` | Dev 1 | `SignIn`, `ForgotPassword`, `AuthService` | Dev 1 + Dev 2 | Dev 1 only | Yes | `auth.controller.js`, `rateLimiter.js` | **Critical** | Login/reset contract change locks out users |
| `server/src/modules/subscription/payment.route.js` | Razorpay order creation & verification | Dev 1 | `Plans.jsx`, `plans_screen.dart` | Dev 1 + Dev 2 | Dev 1 only | Yes | `payment.controller.js`, `authMiddleware.js` | **Critical** | Payment payload change breaks checkout |
