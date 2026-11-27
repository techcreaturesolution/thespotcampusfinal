# S0-07 — API Verification Matrix

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** `217` Mounted + `6` Unmounted = `223` Routes

| Route Group | Endpoints | Status | Verification Evidence |
|---|---|---|---|
| `POST /api/auth/login`, `/register` | 2 | `NOT_WORKING` | Validation/controller mismatch (`API-ISSUE-010`) + unauthenticated Admin registration (`API-ISSUE-001`) |
| `/api/sessions/*` (`session.route.js`) | 6 | `UNUSED` | Never mounted in `server/src/app.js` (`API-ISSUE-014`) |
| `/api/university/*`, `/api/degreeMaster/*`, `/api/contact` (`GET`/`DEL`), `/api/register` (`GET`), `/api/rounds/*`, `/api/stats/admin-report`, `/transactions`, `GET /api/payment/` | 30 | `PARTIALLY_WORKING` | Routes execute statically, but lack auth/RBAC (`API-ISSUE-002..005`) |
| Duplicate Mounts (`/api/logout`, `/api/order`, `/api/register` remaining) | 16 | `PARTIALLY_WORKING` | Duplicate mounts in `app.js#L169-192` (`API-ISSUE-014`) |
| `POST /api/payment`, `POST /api/aiexam`, `POST /api/paper/:id` | 4 | `PARTIALLY_WORKING` | Client-controlled `amount` (`API-ISSUE-006`) or `trustScore` (`API-ISSUE-009`) |
| Remaining Active Routes (`/api/preparation/*`, `/api/dropdown/*`, `/api/job-finder/*`, `/api/jobs/*`, `/api/college/*`, `/api/company/*`, etc.) | 165 | `BLOCKED` (L4) | Statically verified (`node --check` 0 errors); live HTTP runtime `BLOCKED` |
