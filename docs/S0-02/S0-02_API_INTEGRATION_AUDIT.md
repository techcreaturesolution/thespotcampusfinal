# S0-02 — API Integration Audit

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Reference:** `docs/S0-01/S0-01_API_INVENTORY.md`  
**Total API Call Sites:** 215 `customFetch` calls across `client/src/`

---

## 1. HTTP Client & Auth Configuration (`client/src/utils/customFetch.js`)

- **Base URL:** `"/api"` in `DEV` (proxied by Vite to `VITE_API_BASE_URL` or `http://localhost:5006/api`); `VITE_API_BASE_URL` in production (with localhost fallback to `${window.location.origin}/api`).
- **Credentials:** `withCredentials: true` (sends `httpOnly` cookie).
- **Token Handling:** Request interceptor also reads `localStorage.getItem("token")` and sets `Authorization: Bearer <token>`. Response interceptor persists `response.data.token` into `localStorage`.
- **Idempotency:** Auto-attaches `Idempotency-Key` on `POST`/`PUT`/`PATCH`/`DELETE` using a 3-second signature cache.

---

## 2. Frontend ↔ Backend Integration Mismatches & Risks

| Finding ID | Category | Severity | Frontend File | Backend Endpoint (S0-01) | Issue / Mismatch | Recommendation | Status |
|---|---|---|---|---|---|---|---|
| `FE-002` | Security/Auth | Critical | `client/src/utils/customFetch.js#L56-L106` | `POST /api/login` | Stores JWT in `localStorage` and sends `Bearer` header despite `httpOnly` cookie auth. | Rely exclusively on `httpOnly` cookies for web SPA; remove `localStorage` token storage. | Open |
| `FE-003` | API/Payment | Critical | `student/pages/Plans.jsx#L43`, `company/pages/RecruitmentSubscription.jsx` | `POST /api/payment` | `Plans.jsx` sends client `amount: plan.price` to `/payment` (matching backend `AUD-007` flaw). | Send `plan_id` only; let backend compute authoritative price. | Open |
| `FE-004` | Auth/UX | High | `client/src/utils/customFetch.js#L105-L107` | All protected APIs | On `401 Unauthorized`, clears `localStorage` token but does NOT redirect to `/sign-in` or clear React state. | Trigger global logout / redirect to `/sign-in` on `401`. | Open |
| `FE-006` | API/Proctoring | High | `student/pages/ExamPaper.jsx#L534,560`, `ExamResult.jsx#L49` | `POST /api/paper/:id`, `POST /api/rounds/job/:jobId/advance` | `ExamPaper.jsx` sends client-computed `proctoring` scores; `ExamResult.jsx` calls `/rounds/job/:jobId/advance` from student exam result flow (relies on backend `AUD-005` missing RBAC!). | Remove `/rounds/.../advance` call from student exam flow; compute proctoring server-side. | Open |
| `FE-007` | API/Security | High | `common/pages/Profile.jsx#L147`, `SignUpStudent.jsx#L61` | `PATCH /api/users/update-profile`, `POST /api/register` | Frontend relies on unvalidated/mass-assignment endpoints (`AUD-004`, `AUD-008`). | Align payloads with strict server-side field whitelists. | Open |
| `FE-013` | API/Dead Code | Medium | `company/pages/RecruitmentSubscription.jsx` | `/api/recruitment-subscription/*` | Page integrates with company subscription endpoints, but is unrouted in `App.jsx` (feature bypassed on backend too). | Remove or archive dead subscription page if company plans are retired. | Open |

---

## 3. Backend Endpoints Without Frontend Integration (from S0-01)
- `POST /api/auth/register` & `POST /api/auth/login` (legacy admin endpoints; `SignIn.jsx` uses `POST /api/login`).
- `GET/DELETE/PATCH/POST /api/sessions/*` (unmounted on backend, unused on frontend).
- `POST /api/upload/*` & `DELETE /api/upload/:filename` (frontend uploads via entity-specific `multipart/form-data` endpoints instead).
- `POST /api/aiexam/*` (AI exam payment endpoints are not called by `CreateExamFromJDModal.jsx`).
- `GET /api/recruitment-subscription/plans` & `/all` are used by Admin, while `POST /api/recruitment-subscription/order` & `/verify` are only in unrouted `RecruitmentSubscription.jsx`.
