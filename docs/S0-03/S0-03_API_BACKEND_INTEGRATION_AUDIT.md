# S0-03 — API & Backend Integration Audit

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Cross-References:** `docs/S0-01/S0-01_API_INVENTORY.md`, `docs/S0-02/S0-02_API_INTEGRATION_AUDIT.md`  
**Total API Integrations:** 38 distinct backend endpoints across 55 call sites

---

## 1. Integration Mismatches & Risks

| Finding ID | Category | Severity | Flutter File | Backend Endpoint | Issue / Mismatch | Recommendation | Status |
|---|---|---|---|---|---|---|---|
| `FL-002` | API/Payment | Critical | `screens/plans_screen.dart#L128-L132` | `POST /api/payment` | Sends client `'amount': plan['price']` instead of `plan_id` only (matches `AUD-007` & `FE-003`). | Send `plan_id` only once backend derives price from `RecruitmentPlan`. | Open |
| `FL-003` | Security/Auth | Critical | `services/auth_service.dart#L66-L73` | `POST /api/login` | Sends `'role': 'Student'` (ignored by backend) and never checks `response.data['role'] == 'Student'`. | Reject non-Student roles on mobile login until multi-role mobile support is intended. | Open |
| `FL-004` | Auth/HTTP | High | `services/api_service.dart#L43-L49` | All protected APIs | `onError` does not clear `FlutterSecureStorage` or trigger `AuthService.logout()` on `401`. | Add `401` callback to log user out and navigate to `/login`. | Open |
| `FL-005` | API/Interviews | High | `screens/interview_list_screen.dart#L53-L57` | `GET /api/interviews/student` | `_joinInterview` builds URL from `AppConstants.baseUrl.replaceAll('/api', '')` (API server host, NOT web client host) and opens unauthenticated external browser. | Use a dedicated `WEB_CLIENT_URL` or implement native WebRTC/WebView with auth. | Open |
| `FL-006` | API/Proctoring | High | `screens/exam_screen.dart#L557-L604` | `POST /api/paper/:id`, `/auto-submit` | Sends client-computed `trustScore` & `totalViolations` (`AUD-015`); `socket_io_client` unused so no live proctoring events are emitted. | Compute trust score server-side; integrate `socket_io_client` for live proctoring. | Open |
| `FL-007` | API/Security | High | `screens/profile_screen.dart#L770`, `register_screen.dart` | `PATCH /users/update-profile`, `POST /register` | Relies on mass-assignment / unauthenticated backend endpoints (`AUD-004`, `AUD-008`). | Align with hardened backend field whitelists. | Open |
| `FL-008` | Architecture/HTTP | High | `auth_service.dart`, `api_service.dart`, `job_finder_service.dart`, `pdf_viewer_screen.dart` | Multiple | 3 separate HTTP client implementations + `package:http` without timeouts in `JobFinderService`. | Consolidate all HTTP calls onto `ApiService` (`Dio`). | Open |

---

## 2. Web vs. Flutter Feature Comparison (Student Role)

| Feature | Web (`client/`) | Flutter (`flutter_student_app/`) | Notes |
|---|---|---|---|
| Student Auth, Profile, Registration | Yes | Yes | Flutter lacks Reset Password deep-link screen |
| Job Openings, Job Finder, Applications | Yes | Yes | Parity achieved |
| AI CV Builder & PDF Download | Yes | Yes | Parity achieved (`WebView` preview + `flutter_file_dialog`) |
| Preparation (Mock Tests, PYQs, Subjects, Daily, Bookmarks, PDFs, Analytics) | Yes | Yes | Parity achieved |
| Proctored MCQ Exam | Yes (Web + Socket.IO) | Yes (Native Camera + MLKit Face Detection) | Flutter has superior native MLKit face detection, but lacks Socket.IO live stream & **Exam Result screen (`FL-019`)** |
| Video Interview | Yes (WebRTC + Socket.IO) | Partial (List only; launches broken external URL) | Missing native/in-app video interview |
| Push / Local Notifications | No | No (`flutter_local_notifications` unused) | Incomplete integration |
| Non-Student Roles (Admin, Company, College, University, TPO) | Yes | Intentionally Web-Only | `flutter_student_app` is Student-only |
