# S0-03 — Flutter Architecture Audit Report

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Audit Phase:** Step 0 — S0-03 Flutter Application Audit (Audit Only)  
**Target Directory:** `flutter_student_app/`  
**Date:** 2026-11-26  
**Branch:** `ravi` (no application files modified)

---

## 1. Technology Stack & SDK Versions

| Category | Technology | Actual Version | Source |
|---|---|---|---|
| Flutter SDK | Flutter (stable) | `3.41.9` | `flutter --version` |
| Dart SDK | Dart (stable) | `3.11.5` (`sdk: '>=3.0.0 <4.0.0'`) | `dart --version`, `pubspec.yaml` |
| State Management | `provider` (`ChangeNotifierProvider`) + `StatefulWidget` | `^6.1.2` | `main.dart`, `pubspec.yaml` |
| Navigation | `MaterialApp` named `routes` + `onGenerateRoute` | Built-in | `main.dart` |
| HTTP Clients | `dio` (`^5.7.0`) + `http` (`^1.2.0`) | `5.7.0`, `1.2.0` | `api_service.dart`, `job_finder_service.dart` |
| Secure Storage | `flutter_secure_storage` | `^9.0.0` | `auth_service.dart`, `api_service.dart` |
| Local Preferences | `shared_preferences` | `^2.2.3` | `home_screen.dart` |
| Proctoring & ML | `camera` (`^0.11.0`), `google_mlkit_face_detection` (`^0.13.2`) | `0.11.0`, `0.13.2` | `exam_screen.dart` |
| Payments | `razorpay_flutter` | `^1.4.5` | `plans_screen.dart` |
| WebView & PDF | `webview_flutter` (`^4.14.0`), `flutter_pdfview` (`^1.3.2`), `flutter_file_dialog` (`^3.0.3`) | `4.14.0`, `1.3.2`, `3.0.3` | `resume_preview_screen.dart`, `pdf_viewer_screen.dart` |
| UI & Config | `google_fonts` (`^6.1.0`), `shimmer` (`^3.0.0`), `cached_network_image` (`^3.3.1`), `flutter_dotenv` (`^6.0.1`) | `6.1.0`, `3.0.0`, `3.3.1`, `6.0.1` | `pubspec.yaml` |
| Unused Dependencies | `socket_io_client` (`^2.0.3+1`), `flutter_local_notifications` (`^17.0.0`) | `2.0.3+1`, `17.0.0` | Declared in `pubspec.yaml`, **0 imports in `lib/`** |
| Testing | `flutter_test` (devDependency only) | — | **No `test/` directory exists** |

---

## 2. Project Structure (`flutter_student_app/lib/`) — 38 Files

```text
lib/
├── main.dart                           # App entry, dotenv load, MultiProvider, MaterialApp, 26 routes
├── utils/
│   └── constants.dart                  # AppConstants (baseUrl, storage keys), AppColors, AppStyles
├── models/
│   └── market_job_models.dart          # Typed models ONLY for Market Job Finder
├── services/ (4)
│   ├── auth_service.dart               # ChangeNotifier + own Dio instance (login, register, checkAuth, logout)
│   ├── api_service.dart                # Dio client with FlutterSecureStorage token interceptor
│   ├── job_finder_service.dart         # Uses package:http directly (no timeouts, separate token read)
│   └── resume_service.dart             # Wrapper around ApiService for CV/resume endpoints
├── widgets/ (2)
│   ├── glass_container.dart            # Reusable glassmorphism container
│   └── premium_paywall.dart            # Reusable subscription paywall screen/widget
└── screens/ (27)
    ├── (13 root screens)               # Splash, Login, Register, ForgotPassword, Home, JobList, JobDetail, Exam, MyApplications, Profile, InterviewList, Plans, ResumeBuilder, ResumePreview, Bookmarks
    ├── job_finder/ (3 files)           # MarketJobFinderScreen, MarketJobDetailScreen, job_finder_constants.dart
    └── preparation/ (11 screens)       # PreparationDashboard, MockTests, TakeTest, TestResult, SubjectPractice, Practice, DailyChallenge, Performance, ReadingMaterial, PreviousPapers, PdfViewer
```

---

## 3. Architecture, State, Storage & Auth Summary

- **State Management:** `MultiProvider` registers `ChangeNotifierProvider(create: (_) => AuthService())` and `Provider(create: (_) => ApiService())`. Individual screens use local `StatefulWidget` state and `Provider.of<ApiService>(context, listen: false)` (or `context.read<ApiService>()`).
- **Authentication & Storage:** `AuthService` stores JWT in `FlutterSecureStorage` (`auth_token`) from either `response.data['token']` or `Set-Cookie` header, and `ApiService` attaches both `Cookie: token=<jwt>` and `Authorization: Bearer <jwt>` on every request.
- **Architectural Gaps:**
  - `AuthService` does not verify `role == "Student"` on login (`FL-003`).
  - `ApiService` does not auto-logout on `401` (`FL-004`).
  - Three separate HTTP clients exist (`AuthService` Dio, `ApiService` Dio, `JobFinderService` `http`) (`FL-008`).
  - No offline cache/sync layer (`SharedPreferences` is only used for daily streak state in `home_screen.dart`) (`FL-014`).
