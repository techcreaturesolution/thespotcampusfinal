# S0-06 — Architecture Risks & Recommendations

**Owners:** Dev 1 + Dev 2 (Joint) | **Consolidated from:** `S0-01` (`AUD-*`), `S0-02` (`FE-*`), `S0-03` (`FL-*`), `S0-04` (`DB-*`), `S0-05` (`API-ISSUE-*`)

---

## 1. Immediate Architecture Risks & Recommendations (Pre-Feature Development)

| Priority | Domain | Current Problem & Evidence | Recommended Approach | Risks of Changing |
|---|---|---|---|---|
| **P0 (Critical)** | Security / RBAC | Unauthenticated `/api/auth/register`, `/api/university`, `/api/degreeMaster`, `/api/register` (`GET`), `/api/contact` (`GET/DEL`), zero RBAC on `/api/rounds/*`, `/api/stats/admin-report`, `GET /api/payment` (`AUD-001..006`, `API-ISSUE-001..005`). | Lock down all public admin/PII routes with `authenticateUser` + `authorizePermissions(...)` and job/student ownership checks. | May break unauthenticated scripts or misaligned frontend calls if not tested together. |
| **P0 (Critical)** | Payments | Client-controlled `amount` in `payment.controller.js#L20`, `Plans.jsx#L43`, `plans_screen.dart#L129` (`AUD-007`, `FE-003`, `FL-002`). | Derive `amount` server-side from `RecruitmentPlan` by `plan_id`. | Requires coordinated Web & Flutter payload update (`plan_id`). |
| **P0 (Critical)** | Mass Assignment & Auth | `req.body` spread into `findByIdAndUpdate` (`AUD-008`), `login.controller.js` ignores `*_status` (`AUD-014`), Web stores JWT in `localStorage` (`FE-002`), Flutter lacks Student role check (`FL-003`), Android/iOS allow cleartext HTTP (`FL-001`, `FL-022`). | Whitelist updatable fields per role; enforce `*_status === "1"`; move Web to `httpOnly` cookie-only + CSRF; enforce HTTPS & Student role in Flutter. | Web CORS/SameSite must be aligned for `httpOnly` cookies. |
| **P1 (High)** | Database Integrity | `exam_payment.user_id` `unique: true` (`DB-002`), dangling `tbl_user` refs (`DB-001`), `tbl_paper.exam_id` as `String` (`DB-005`), no transactions (`DB-006`). | Fix `exampayment` index, resolve `tbl_user` refs, wrap multi-doc deletes in MongoDB sessions, add unique/FK indexes (`DB-003`, `DB-004`, `DB-008`). | Index creation on existing collections requires pre-deduplication. |
| **P1 (High)** | Client Stability | Web lacks `<RoleGuard>` (`FE-001`) and `<ErrorBoundary>` (`FE-009`); Flutter has 3 HTTP clients (`FL-008`) & broken `_joinInterview` URL (`FL-005`). | Add `<RoleGuard>` + `<ErrorBoundary>` in `App.jsx`; unify Flutter HTTP on `ApiService`; fix interview web URL. | Low risk; pure client hardening. |

---

## 2. Long-Term Architecture Improvements (Roadmap Phase)

1. **Automated Test Harness (`AUD-032`, `FE-017`, `FL-009`):** Add Vitest + Supertest (Backend), Vitest + RTL (Web), and `flutter_test` unit/widget tests before S0-07 / feature work.
2. **Backend Service Layer & Transactions:** Extract business logic out of controllers into `services/` (following `jobFinder/services/` pattern) and standardize error handling through `errorHandlerMiddleware.js`.
3. **Frontend Modularization & Pagination:** Split 1,000+ line monoliths (`ResumeBuilder.jsx`, `VideoInterview.jsx`, `home_screen.dart`, `exam_screen.dart`), consolidate duplicate `ManageStudent`/`ManageJob` pages (`FE-012`), and add pagination to `DataTable.jsx` & list APIs (`AUD-028`, `FE-011`).
4. **Versioned Migration Runner & API Versioning:** Introduce idempotent DB migrations (`DB-007`) and `/api/v1` prefix (`API-ISSUE-016`) ahead of the College-to-Institute migration.
