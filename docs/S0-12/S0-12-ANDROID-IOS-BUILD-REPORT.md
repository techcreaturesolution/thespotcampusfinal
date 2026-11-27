# S0-12 — Android & iOS Build Report

**Project:** `flutter_student_app/` | **Owner:** Dev 2 | **Date:** 2026-11-27

---

- **Android Configuration Verified:** JDK `21.0.12` LTS, Android SDK (`C:\Users\Ravi\AppData\Local\Android\Sdk`), `gradlew.bat` present, `AndroidManifest.xml` sets `android:usesCleartextTraffic="false"`.
- **Android Build Status:** **BLOCKED** locally (headless PowerShell `flutter build apk --debug` hung `>4m28s` without output); `.github/workflows/mobile-ci.yml` configured for Ubuntu CI execution.
- **iOS Configuration Verified:** `ios/Runner/Info.plist` present (`True`); `ios/Podfile` absent (`False` — generated on macOS).
- **iOS Build Status:** **BLOCKED — ENVIRONMENT NOT AVAILABLE** (Windows host without macOS/Xcode). `.github/workflows/mobile-ci.yml` configured for `macos-latest` (`flutter build ios --release --no-codesign`).
