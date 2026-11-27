# S0-10 — Cross-Platform Baseline Report

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-10 | **Owners:** Dev 1 + Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Backend ↔ Web Contract Baseline
- **Base URL & HTTP Client:** `client/src/utils/customFetch.js` (`76` importers) uses `/api` via Vite proxy / `VITE_API_URL`; backend `app.js` mounts routes at `/api/*` (`30` mounts + `4` direct). **Status: PASS (static contract aligned).**
- **Auth & Error Contract:** Backend `authMiddleware.js` + `errorHandlerMiddleware.js` return `401 {"msg":"authentication invalid"}` (`SEC-01`, `SEC-02`) and `400 {"msg":"Validation failed: ..."}` (`API-03`). `customFetch.js` expects `{ msg }` and handles `401`. **Status: PASS (error format verified).**
- **CORS & Cookies:** `app.js` configures `credentials: true` with `allowedOrigins`. **Status: PASS (static).**

## 2. Backend ↔ Flutter Contract Baseline
- **Base URL & HTTP Clients:** `flutter_student_app/lib/services/api_service.dart` (Dio) + `job_finder_service.dart` (raw `http` — `FL-008` split client). **Status: FAIL (`BASE-INT-001`: dual HTTP clients + `usesCleartextTraffic`).**
- **Broken / Mismatched Contracts (Carry-Forward from S0-07):**
  - `FL-005` (`_joinInterview` URL mismatch in `interview_list_screen.dart`).
  - `FL-003` (`AuthService` role gate / `401` interceptor gap in `FEAT-020`).

## 3. Shared Business Rules (Web ↔ Flutter ↔ Backend)
- **Payments (`FEAT-016`):** Client-supplied Razorpay `amount` (`AUD-007`) and `exam_payment.user_id` unique bug (`DB-002`) remain unfixed baseline blockers (`NOT_EXECUTED` live payment per non-destructive rule).
- **File Uploads (`FEAT-018`):** `fileUploadMiddleware.js` active; `DELETE /:filename` ownership check missing (`AUD-011`).
