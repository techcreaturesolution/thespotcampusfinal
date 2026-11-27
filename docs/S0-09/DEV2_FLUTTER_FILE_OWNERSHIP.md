# Dev 2 — Flutter File Ownership

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-09 | **Owner:** Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Flutter Ownership Summary
- **Total Core Flutter Files (`lib/`, `test/`, `5` key platform configs, `8` root configs):** **52**
- **Dev 2 Exclusive:** **47**
- **Shared Files (Dev 2 Primary Owner):** **4** (`api_service.dart`, `auth_service.dart`, `constants.dart`, `main.dart`)
- **Protected:** **1** (`flutter_student_app/.env`)
- **Platform Boilerplate / Assets / Archives Excluded from Core Ownership:** `231` files (`android/` boilerplate, `ios/` boilerplate, `linux/`, `macos/`, `windows/`, `Assets.xcassets/`, `assets/`, `.idea/`, `App.zip`, `flutter_student_app.zip`, store PNGs, `.iml`).

---

## 2. Directory-by-Directory Ownership

| Directory / File | Count | Ownership | Dev 1 Access | Notes |
|---|---:|---|---|---|
| `flutter_student_app/lib/main.dart` | 1 | **Shared (Dev 2 Primary)** | Read-Only | Named route table (`27` routes + `1` `MaterialPageRoute`) |
| `flutter_student_app/lib/services/api_service.dart` | 1 | **Shared (Dev 2 Primary)** | Review Contract | Imported by `27` Dart files (`FEAT-020`) |
| `flutter_student_app/lib/services/auth_service.dart` | 1 | **Shared (Dev 2 Primary)** | Review Contract | Imported by `10` Dart files; role gate & token storage |
| `flutter_student_app/lib/utils/constants.dart` | 1 | **Shared (Dev 2 Primary)** | Review Contract | Imported by `5` files; API base URL |
| `flutter_student_app/lib/services/job_finder_service.dart`, `resume_service.dart` | 2 | **Dev 2 Exclusive** | Read-Only | Note: `job_finder_service.dart` uses raw `http` -> unify into `ApiService` (`FEAT-020`) |
| `flutter_student_app/lib/models/market_job_models.dart` | 1 | **Dev 2 Exclusive** | Read-Only | Market job DTOs |
| `flutter_student_app/lib/screens/**` | 29 | **Dev 2 Exclusive** | Read-Only | `28` screens + `job_finder_constants.dart` |
| `flutter_student_app/lib/widgets/**` | 2 | **Dev 2 Exclusive** | Read-Only | `glass_container.dart`, `premium_paywall.dart` (`6` importers) |
| `flutter_student_app/test/widget_test.dart` | 1 | **Dev 2 Exclusive** | Read-Only | Placeholder smoke test (`FEAT-022`) |
| Key Platform Configs (`android/app/build.gradle.kts`, `AndroidManifest.xml`, `ios/Runner/Info.plist`, `web/index.html`, `web/manifest.json`) | 5 | **Dev 2 Exclusive** | Read-Only | `usesCleartextTraffic` & `NSAllowsArbitraryLoads` (`FEAT-020`) |
| Root Configs (`pubspec.yaml`, `pubspec.lock`, `analysis_options.yaml`, `.gitignore`, `.metadata`, `.flutter-plugins-dependencies`, `README.md`) | 7 | **Dev 2 Exclusive** | Read-Only | Flutter SDK/package config |
| `flutter_student_app/.env` | 1 | **Protected** | No Access | Mobile env config |
