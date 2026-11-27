# S0-08 — Dev 2 Flutter Classification Matrix

**Owner:** Dev 2 | **Baseline:** `38` `.dart` files, `28` `*_screen.dart` screens (`27` in `main.dart` + `1` `MaterialPageRoute`), `4` services, `2` widgets

---

## 1. Flutter Screen, Service & Widget Classification

| Area / Screens | Existing Implementation | Classification | Platform Availability | Required Scope / Justification |
|---|---|---|---|---|
| **Splash, ForgotPassword, Register** | `splash_screen.dart`, `forgot_password_screen.dart`, `register_screen.dart` | **REUSE** | Both (Reset via Web) | Works statically; align `register_screen.dart` with hardened `/register`. |
| **Jobs, Applications, Bookmarks, CV Builder** | `home_screen.dart`, `job_list_screen.dart`, `job_detail_screen.dart`, `my_applications_screen.dart`, `resume_builder_screen.dart`, `resume_preview_screen.dart`, `bookmarks_screen.dart` | **REUSE** (split large files later) | Both | Functional UI; refactor 1,200–1,630L files incrementally (`FL-010`). |
| **Preparation Suite (`11` screens)** | `screens/preparation/*` + `PremiumPaywall` | **REUSE** | Both | Complete parity with Web Student preparation. |
| **Market Job Finder (`2` screens)** | `market_job_finder_screen.dart`, `market_job_detail_screen.dart` | **ENHANCEMENT** | Both | Migrate `JobFinderService` from `package:http` onto `ApiService` (`FL-008`). |
| **Auth & Core Networking** (`AuthService`, `ApiService`, `AndroidManifest.xml`, `Info.plist`) | `services/auth_service.dart`, `api_service.dart` | **ENHANCEMENT** | Mobile | Enforce `role == 'Student'` (`FL-003`), add `401` logout (`FL-004`), disable cleartext HTTP (`FL-001`, `FL-022`), unify `Dio` (`FL-008`). |
| **Proctored Exam & Plans** (`ExamScreen`, `PlansScreen`) | `exam_screen.dart`, `plans_screen.dart` | **ENHANCEMENT** | Both (Native MLKit on Mobile) | Remove client `amount` (`FL-002`) & client `trustScore` (`FL-006`); add `ExamResult` view (`FL-019`). |
| **Interviews** (`InterviewListScreen`) | `interview_list_screen.dart#L54` | **ENHANCEMENT** | Web (full WebRTC) / Mobile (broken link) | Fix `_joinInterview` to use `WEB_CLIENT_URL` instead of API `baseUrl` (`FL-005`). |
| **Notifications & Automated Tests** | `flutter_local_notifications` unused; no `test/` | **NEW** | Planned Mobile/Web | Implement Push/Local Notifications (`FL-011`) and `flutter_test` unit/widget suites (`FL-009`). |
