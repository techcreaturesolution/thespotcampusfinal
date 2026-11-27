# S0-09 — Shared File Register (`24` Shared + `4` Protected)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Shared Files (`24` Total — One Accountable Primary Owner Each)

| # | File Path | Primary Owner | Secondary Consumer | Risk | Change Rule |
|---:|---|---|---|---|---|
| 1 | `server/src/app.js` | Dev 1 | Dev 2 | Critical | Dev 1 edits; notify Dev 2 on CORS/cookie changes |
| 2 | `server/src/config/routes.js` | Dev 1 | Dev 2 | Critical | Dev 1 edits; freeze/version mount paths |
| 3 | `server/src/config/env.js` | Dev 1 | Dev 2 | High | Dev 1 edits; document new env keys |
| 4 | `server/src/config/db.js` | Dev 1 | Dev 2 (Indirect) | High | Dev 1 edits; schema/connection owner |
| 5 | `server/src/config/socket.js` | Dev 1 | Dev 2 (`VideoInterview.jsx`) | High | Dev 1 edits; coordinate event names with Dev 2 |
| 6 | `server/src/config/uploads.js` | Dev 1 | Dev 2 | Medium | Dev 1 edits; keep URL format stable |
| 7 | `server/src/middleware/authMiddleware.js` | Dev 1 | Dev 2 | Critical | Dev 1 edits; notify Dev 2 on 401/403 changes |
| 8 | `server/src/middleware/errorHandlerMiddleware.js` | Dev 1 | Dev 2 | High | Dev 1 edits; preserve `{ msg }` error key |
| 9 | `server/src/middleware/fileUploadMiddleware.js` | Dev 1 | Dev 2 | High | Dev 1 edits; keep multipart field names stable |
| 10 | `server/src/utils/constants.js` | Dev 1 | Dev 2 | High | Dev 1 edits; sync role/status enums with Dev 2 |
| 11 | `server/src/modules/auth/auth.route.js` | Dev 1 | Dev 2 | Critical | Dev 1 edits; approve payload before Dev 2 changes |
| 12 | `server/src/modules/subscription/payment.route.js` | Dev 1 | Dev 2 | Critical | Dev 1 edits; server-side amount authoritative |
| 13 | `client/src/utils/customFetch.js` | Dev 2 | Dev 1 (Contract) | Critical | Dev 2 edits; aligns with `authMiddleware` |
| 14 | `client/src/App.jsx` | Dev 2 | Dev 1 (Routes) | High | Dev 2 edits; central `<RoleGuard>` boundary |
| 15 | `client/src/common/pages/DashboardLayout.jsx` | Dev 2 | Dev 1 (Auth) | Critical | Dev 2 edits; consumes `/auth/current-user` |
| 16 | `client/src/common/components/DataTable.jsx` | Dev 2 | Dev 2 (15 pages) | Medium | Dev 2 edits; keep props backward-compatible |
| 17 | `client/src/common/components/PageHeader.jsx` | Dev 2 | Dev 2 (46 pages) | Low | Dev 2 edits; keep props stable |
| 18 | `client/src/common/components/DashboardCard.jsx` | Dev 2 | Dev 2 (6 pages) | Low | Dev 2 edits; keep props stable |
| 19 | `flutter_student_app/lib/services/api_service.dart` | Dev 2 | Dev 1 (Contract) | Critical | Dev 2 edits; aligns with backend JWT/401 |
| 20 | `flutter_student_app/lib/services/auth_service.dart` | Dev 2 | Dev 1 (Contract) | Critical | Dev 2 edits; Student role gate |
| 21 | `flutter_student_app/lib/utils/constants.dart` | Dev 2 | Dev 1 (Base URL) | High | Dev 2 edits; env-driven base URL |
| 22 | `flutter_student_app/lib/main.dart` | Dev 2 | Dev 2 (28 screens) | High | Dev 2 edits; route table stability |
| 23 | `README.md` | Dev 1 (Lead) | Both | Low | Joint review before updating setup docs |
| 24 | `.gitignore` | Dev 1 (Lead) | Both | Medium | Joint review before changing ignore rules |

---

## 2. Protected Files (`4` Total — No Feature-Branch Modification Without Explicit Approval)
1. `server/.env` (Backend secrets, MongoDB URI, JWT & Razorpay keys)
2. `client/.env` (Web build env vars)
3. `flutter_student_app/.env` (Flutter env vars)
4. `.agents/AGENTS.md` (Workspace AI governance rules)
