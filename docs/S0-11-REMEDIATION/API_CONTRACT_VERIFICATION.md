# API Contract Verification Report

**Project:** The Spot Campus (`thespotcampusfinal`) | **Branch:** `s0-11-remediation`

---

- **`/api/register` vs `/api/auth/register`:** Isolated `POST /api/register` (`createStudent` only) in `server/src/app.js`; guarded `POST /api/auth/register` with `Admin` RBAC (`401`/`403` verified).
- **Interview URL (`FL-005`):** Updated `interview_list_screen.dart` `_joinInterview` to target the Web frontend `/dashboard/video-interview/:roomId` instead of raw API server URL.
- **Named Export Contract (`server/src/app.js`):** Preserved `{ app, server, io }` named exports cleanly across `server.js` and Vitest `security.regression.test.js`.
- **Legacy Compatibility:** Preserved `/api/login`, `/api/college/*`, and `/api/university` signup `POST /`.
