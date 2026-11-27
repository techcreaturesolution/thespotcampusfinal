# S0-01 — Backend Architecture Audit Report

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Audit Phase:** Step 0 — S0-01 Backend Codebase Audit (Audit Only)  
**Date:** 2026-11-26  
**Branch Audited:** `ravi` (with uncommitted local modifications in `server/src/` noted; no files modified)

---

## 1. Backend Architecture Overview

The backend is a **modular monolith** built on **Node.js (ES Modules)** and **Express.js**, backed by **MongoDB (Mongoose ODM)** and **Socket.IO** for real-time exam proctoring and WebRTC video interview signaling.

- **Entry Point:** `server/server.js` loads `dotenv` (`src/config/env.js`), registers `express-async-errors`, connects to MongoDB via `connectToMongoDB()` (`src/config/db.js`), and starts the HTTP + Socket.IO server exported from `src/app.js`.
- **Application Assembly (`server/src/app.js`):** Configures `helmet`, `express-mongo-sanitize`, `cors`, `morgan` (dev only), static `/uploads` serving (`src/config/uploads.js`), `cookie-parser`, JSON/URL-encoded body parsers (`10mb` limit), XSS `<script>` sanitization (`sanitizeInput`), rate limiters (`generalLimiter`, `authLimiter`, `paymentLimiter`), idempotency middleware (`requireIdempotency`), direct router mounting (28 route files across 17 feature modules), 404 fallback, upload cleanup (`cleanupUploadOnError`), and centralized error handling (`errorHandlerMiddleware`).
- **Layering Pattern:** `Route -> Middleware (Auth / Upload / Validation) -> Controller -> Mongoose Model`. There is **no dedicated service or repository layer** in core modules (business logic and DB queries live inside controllers), except `modules/jobFinder/`, which has a structured `services/` and `utils/` sub-architecture.

---

## 2. Technology Stack

| Layer | Technology | Version / Details | Source |
|---|---|---|---|
| Runtime | Node.js (ESM `"type": "module"`) | `v22.23.5` | `server/package.json` |
| Web Framework | Express.js | `^4.18.2` | `server/package.json` |
| Database & ODM | MongoDB + Mongoose | `mongoose ^7.0.5` | `server/package.json` |
| Real-time | Socket.IO | `^4.7.5` | `server/src/config/socket.js` |
| Authentication | JWT (`jsonwebtoken`) + HTTP-only cookies | `^9.0.0`, `bcryptjs ^2.4.3` | `server/src/utils/tokenUtils.js` |
| Validation | `express-validator` + `zod` (in `jobFinder`) | `^7.0.1`, `^3.23.8` | `server/package.json` |
| Security Middleware | `helmet`, `cors`, `express-mongo-sanitize`, `express-rate-limit` | `helmet ^7.0.0`, `rate-limit ^6.8.0` | `server/src/app.js` |
| File Storage | Local `uploads/` + `multer` + `cloudinary` | `multer ^1.4.5-lts.1`, `cloudinary ^1.37.3` | `server/src/config/uploads.js` |
| AI Integration | OpenAI API (`gpt-4o-mini`) | `openai ^4.100.0` | `server/src/utils/generateMCQs.js` |
| Payments | Razorpay | `razorpay ^2.9.5` | `server/src/modules/subscription/` |
| PDF & Scraping | `puppeteer`, `puppeteer-core`, `@sparticuz/chromium`, `cheerio`, `xlsx` | `puppeteer ^22.15.0` | `server/package.json` |
| Email | `nodemailer` (SMTP / Gmail) | `^9.0.3` | `server/src/utils/sendEmail.js` |
| API Docs / Tests / Cache | None configured | No Swagger/OpenAPI, no Jest/Vitest, no Redis | — |

---

## 3. Folder Structure

```text
server/
├── server.js                      # Process entry point & graceful SIGINT shutdown
├── package.json                   # Dependencies & scripts (start, dev, seed, postinstall)
├── install-chrome.js              # Puppeteer Chrome installer
├── .puppeteerrc.cjs               # Puppeteer cache configuration
└── src/
    ├── app.js                     # Express app, middleware pipeline, Socket.IO, route mounts
    ├── config/
    │   ├── db.js                  # MongoDB connection with DNS override & retry logic
    │   ├── env.js                 # dotenv loader
    │   ├── rateLimiter.js         # IP-cleaned rate limiters (general, auth, refresh, payment)
    │   ├── routes.js              # UNUSED duplicate route registration helper (setupRoutes)
    │   ├── socket.js              # Socket.IO proctoring & WebRTC interview signaling
    │   └── uploads.js             # Static /uploads serving with security headers
    ├── errors/
    │   └── customErrors.js        # NotFoundError, BadRequestError, UnauthenticatedError, UnauthorizedError
    ├── middleware/
    │   ├── authMiddleware.js      # authenticateUser, authorizePermissions, enhancedAuthenticateUser, requireStudentSubscription
    │   ├── errorHandlerMiddleware.js # Mongoose/Multer error mapping + redacted server_errors.log
    │   ├── fileUploadMiddleware.js   # Field-specific multer configs + magic-byte image validation
    │   ├── multerMiddleware.js       # Legacy generic multer config
    │   ├── sessionSecurityMiddleware.js # UNUSED express-session + connect-mongo + express-brute
    │   └── validationMiddleware.js   # express-validator chains + sanitizeInput
    ├── modules/                   # 17 domain modules (routes, controllers, models)
    │   ├── application/
    │   ├── auth/                  # admin.model, passwordReset.model, auth/login/user controllers
    │   ├── branch/
    │   ├── college/
    │   ├── company/
    │   ├── contact/
    │   ├── dashboard/
    │   ├── degree/                # degree + degreemaster
    │   ├── dropdown/
    │   ├── exam/                  # exam + paper (proctoring)
    │   ├── idempotency/           # Idempotency-Key Mongo-backed middleware
    │   ├── interview/             # interview + round (multi-round pipeline)
    │   ├── job/
    │   ├── jobFinder/             # AI/aggregated external job finder (6 models, 20+ services)
    │   ├── preparation/           # bookmark, dailychallenge, mocktest, pdfmaterial, progress, question, subject
    │   ├── session/               # UNMOUNTED session management routes & controller
    │   ├── student/               # student, resume, cvTemplate
    │   ├── subscription/          # payment (student), exampayment (AI exam), subscription (company plans)
    │   ├── tpo/
    │   ├── university/
    │   └── upload/
    ├── scripts/
    │   └── seed.js                # Database seeding script
    └── utils/                     # constants, cvTemplates, emailCheck, generateMCQs, passwordUtils, pdfGenerator, sendEmail, tokenUtils
```

---

## 4. Authentication & Authorization Architecture

- **Multi-Collection Identity:** There is **no unified `tbl_user` collection**. Instead, 6 separate collections store user accounts with role-prefixed email/password fields: `tbl_admin`, `tbl_student`, `tbl_company`, `tbl_college`, `tbl_university`, and `tbl_tpo`.
- **Login Flow:** `POST /api/login` (`login.controller.js`) sequentially queries all 6 collections, checks verification flags (`isVerifiedByTPO` for Student; `*_verified === "Approved"` for Company/College/University), verifies bcrypt hash, issues an HS256 JWT (`{ userId, role, jti, sessionId, tokenType: "access" }`), sets an `httpOnly` cookie (`token`), and also returns `{ token, user, role }` in JSON.
- **Auth Middleware:** `authenticateUser` (`authMiddleware.js`) extracts Bearer token or `req.cookies.token`, verifies JWT, and attaches `req.user = { userId, role }`.
- **Authorization Gaps:** `authorizePermissions(...roles)` exists in `authMiddleware.js`, but is only applied on a subset of routes (`college`, `company`, `subscription`, `preparation`, `jobFinder/admin/*`). Numerous administrative, academic, and recruitment endpoints lack route-level and controller-level role checks (detailed in `S0-01_SECURITY_AUDIT.md`).

---

## 5. External Integrations & Cross-Reference Gaps

- **External Integrations:** OpenAI (`gpt-4o-mini`), Razorpay (orders + HMAC-SHA256 verification), Cloudinary (media storage), Nodemailer (SMTP), Puppeteer/Chromium (PDF generation & crawling), and JobFinder external sources (SerpAPI, Google CSE/Maps, OSM Overpass, Adzuna, Careerjet, Jooble, JSearch, Apify LinkedIn).
- **Cross-Reference Note:** Project governance documents referenced in the audit brief (Step 0A Role & Permission Matrix, 16-Step Roadmap, College-to-Institute Migration Plan, Gap Analysis) are **not present** in the repository. Findings are therefore verified directly against the codebase and `README.md`.
