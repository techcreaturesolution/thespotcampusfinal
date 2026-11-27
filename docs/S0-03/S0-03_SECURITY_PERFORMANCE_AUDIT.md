# S0-03 — Mobile Security & Performance Audit

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Scope:** Token/local storage security, network security, platform security, performance, memory management, and testing readiness.

---

## 1. Security Findings

| Finding ID | Category | Severity | File Path | Description | Evidence | Impact | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|
| `FL-001` | Security/Network | Critical | `android/app/src/main/AndroidManifest.xml#L8`, `ios/Runner/Info.plist#L7-L11` | Cleartext HTTP traffic allowed globally | `android:usesCleartextTraffic="true"`; `NSAllowsArbitraryLoads: true` | Exposes JWTs, proctoring snapshots, and PII to MITM attacks on public Wi-Fi. | Disable cleartext traffic in release builds; enforce HTTPS (`https://`) in `.env`. | Open |
| `FL-002` | Security/Payment | Critical | `lib/screens/plans_screen.dart#L128-L132` | Client-controlled order amount | Sends `'amount': plan['price']` to `/payment` | Matches backend `AUD-007` vulnerability. | Send `plan_id` only; compute price server-side. | Open |
| `FL-003` | Security/Auth | Critical | `lib/services/auth_service.dart#L66-L100` | No Student role enforcement on login | Backend `/login` ignores `'role': 'Student'`; Flutter doesn't check `response.data['role']` | Non-Student users (Admin/Company/TPO) can log into the Student mobile app. | Verify `response.data['role'] == 'Student'` before persisting session. | Open |
| `FL-004` | Security/Auth | High | `lib/services/api_service.dart#L43-L49` | No `401` auto-logout | `onError` only logs in `kDebugMode` | Expired/revoked tokens remain in `FlutterSecureStorage` until manual logout. | Clear `FlutterSecureStorage` and trigger `AuthService.logout()` on `401`. | Open |
| `FL-015` | Config/Security | Medium | `pubspec.yaml#L46`, `lib/utils/constants.dart#L9` | `.env` bundled as app asset; `localhost` HTTP fallback | `assets: - .env`; fallback `http://localhost:5006/api` | Bundled assets can be extracted from APK/IPA; never store secrets in `.env` asset. | Use `--dart-define` for build-time config; keep `.env` secret-free (currently only `BASE_URL`). | Open |

*(Positive note: JWTs are stored in `FlutterSecureStorage` rather than `SharedPreferences`, and `flutter_student_app/.env` currently contains only `BASE_URL`.)*

---

## 2. Performance, Dependencies & Testing Findings

| Finding ID | Category | Severity | File Path | Description | Evidence | Impact | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|
| `FL-009` | Testing | High | `flutter_student_app/` | Zero automated tests | No `test/` directory exists; only `flutter_test` in `pubspec.yaml` | No regression safety net for auth, proctoring, or payments. | Add unit tests (`AuthService`, `ApiService`) and widget/integration tests. | Open |
| `FL-010` | Performance | Medium | `home_screen.dart` (1,630L), `market_job_finder_screen.dart` (1,405L), `exam_screen.dart` (1,394L), `resume_builder_screen.dart` (1,207L), `register_screen.dart` (937L), `profile_screen.dart` (935L) | Monolithic oversized screens | 6 screens exceed 930–1,630 lines | Large `setState` rebuild scopes and high maintenance overhead. | Extract feature widgets and ViewModels/Controllers. | Open |
| `FL-011` | Dead Code | Medium | `pubspec.yaml#L23-L24` | Unused heavy packages | `socket_io_client` & `flutter_local_notifications` have 0 imports in `lib/` | Increases binary size & native dependency surface unnecessarily. | Either integrate them (live proctoring/notifications) or remove them. | Open |
| `FL-013` | Architecture | Medium | `lib/models/`, `lib/screens/` | Missing typed data models | Only `market_job_models.dart` exists; all other screens use raw `Map<String, dynamic>` | Runtime null/type errors when backend payloads change. | Introduce typed Dart models for `Student`, `Job`, `Application`, `Exam`. | Open |
| `FL-014` | Storage/Offline | Medium | `lib/screens/home_screen.dart#L79` | No offline API caching | `SharedPreferences` only stores streak state; no offline queue or cache | App is unusable without live connectivity. | Add lightweight read caching for profile/jobs/materials if offline support is desired. | Open |
| `FL-018` | State/Perf | Low | `lib/screens/exam_screen.dart` | Mixed `ValueNotifier` & large `StatefulWidget` | `exam_screen.dart` properly disposes `CameraController`/`FaceDetector`/`Timer`, but `home_screen.dart` mixes 6 parallel API calls in UI state | Harder to test and maintain. | Move API orchestration into service/provider methods. | Open |
| `FL-021` | Repo Hygiene | Low | `flutter_student_app/` | Untracked zip archives | `flutter_student_app.zip`, `App.zip` present in git status | Bloats repo working tree. | Remove zip archives and ignore `*.zip` if needed. | Open |
