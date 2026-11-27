# S0-03 — Mobile UI/UX & Platform Audit Report

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Scope:** Mobile UI/UX consistency, Android configuration (`build.gradle.kts`, `AndroidManifest.xml`), and iOS configuration (`Info.plist`).

---

## 1. Android Platform Audit (`android/`)

- **Application ID & Namespace:** `com.techcreaturesolution.spotcampus` (`android/app/build.gradle.kts`).
- **SDK & Build Config:** Uses `flutter.compileSdkVersion`, `flutter.minSdkVersion`, `flutter.targetSdkVersion`, Java 17 with `coreLibraryDesugaringEnabled = true`, ABIs `arm64-v8a` & `x86_64`, and `isMinifyEnabled = true` + `isShrinkResources = true` for release.
- **Permissions (`AndroidManifest.xml`):** Only `INTERNET` and `CAMERA` (appropriate for proctoring; no excessive permissions).
- **Findings:**
  - `FL-001` (Critical): `android:usesCleartextTraffic="true"` is enabled globally in `AndroidManifest.xml`.
  - `FL-016` (Medium): `android:label="the_spot_campus_student"` uses raw snake_case package name; `build.gradle.kts` retains template `TODO` comments for release `signingConfig` (`key.properties` not committed, which is safe, but release signing must be verified before store publish).

---

## 2. iOS Platform Audit (`ios/`)

- **Environment Limitation:** Audited on `windows_x64`; Xcode/iOS build & CocoaPods compilation could not be executed in this environment.
- **Configuration (`ios/Runner/Info.plist`):**
  - `CFBundleDisplayName`: `"The Spot Campus Student"`
  - `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` are properly defined.
  - `UISupportedInterfaceOrientations`: Portrait + Landscape Left/Right (iPad adds PortraitUpsideDown).
- **Findings:**
  - `FL-022` (Critical): `NSAppTransportSecurity` sets `NSAllowsArbitraryLoads: true`, disabling App Transport Security (ATS) for all domains (`ios/Runner/Info.plist#L7-L11`).
  - `FL-017` (Low): Missing `NSPhotoLibraryUsageDescription` if gallery/file picking is added later.

---

## 3. Mobile UI/UX & Accessibility

- **Theme (`main.dart`):** Material 3 (`useMaterial3: true`), `Color(0xFF2563EB)` seed, `GoogleFonts.outfitTextTheme()`, consistent `InputDecorationTheme` & `ElevatedButtonThemeData`.
- **UI/UX Gaps (`FL-012`, `FL-019`, `FL-020`):**
  - Only 2 shared widgets (`GlassContainer`, `PremiumPaywall`); loading, error, and empty states are duplicated inline across 27 screens.
  - `ExamScreen` pops back immediately after submission without an `ExamResult` summary screen (`FL-019`).
  - `flutter_student_app/README.md` is still the default Flutter template (`FL-020`).
