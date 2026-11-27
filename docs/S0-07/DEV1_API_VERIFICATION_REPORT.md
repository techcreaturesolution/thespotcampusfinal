# S0-07 — Dev 1 API Verification Report

**Owner:** Dev 1 | **Baseline:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)  
**Recalculated Counts (Verified):** `30` `app.use` mounts (`27` `.route.js` files) + `4` direct `app.js` routes = **217 mounted endpoints** (**216 unique** `METHOD + path`), **6 unmounted** (`session.route.js`), **37 public**, **180 protected**, **182 without route-level `authorizePermissions`**.

---

## 1. API Verification Summary by Category

| Category | Count | Primary Status | Key Verified Findings |
|---|---|---|---|
| Public Auth / Legacy (`POST /api/auth/login`, `/register`) | 2 | `NOT_WORKING` | `loginValidation` (`email`/`password`) mismatches controller (`admin_email`/`admin_password`); `register` allows unauthenticated Admin creation (`API-ISSUE-001`, `API-ISSUE-010`). |
| Unmounted Session Routes (`/api/sessions/*`) | 6 | `UNUSED` | `session.route.js` is never mounted in `app.js` (`API-ISSUE-014`). |
| Duplicate Mounts (`/api/logout`, `/api/order`, `/api/register`) | 16 | `PARTIALLY_WORKING` | `/api/register` exposes `GET /` student PII (`API-ISSUE-003`); `POST /api/logout` triggers `login` (`API-ISSUE-014`). |
| Unprotected Admin/PII Routes (`/api/university`, `/degreeMaster`, `/contact`, `/rounds`, `/stats/admin-report`, `/stats/transactions`, `GET /payment`) | 30 | `PARTIALLY_WORKING` | Routes execute statically but lack auth/RBAC (`API-ISSUE-002`, `004`, `005`). |
| Payment / Proctoring Tampering Routes (`POST /payment`, `/aiexam`, `/paper/:id`) | 4 | `PARTIALLY_WORKING` | Accept client-controlled `amount` (`API-ISSUE-006`) or `trustScore` (`API-ISSUE-009`). |
| Remaining Active Routes (`/api/preparation/*`, `/api/dropdown/*`, `/api/job-finder/*`, etc.) | 159 | `BLOCKED` (L4) | Statically valid & syntax-checked; live HTTP runtime execution `BLOCKED` (no live server/DB test session). |
