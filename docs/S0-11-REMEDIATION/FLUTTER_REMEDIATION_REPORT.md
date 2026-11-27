# Flutter Remediation Report (`FEAT-020`, `FEAT-022`)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Branch:** `s0-11-remediation`

---

- **HTTPS / Cleartext (`FL-001`):** Set `android:usesCleartextTraffic="false"` in `AndroidManifest.xml`.
- **Dio Client Unification (`FL-008`):** Refactored `job_finder_service.dart` to use `ApiService` (Dio) instead of raw `package:http`.
- **401 Token Cleanup (`FL-004`):** Added `401` secure-storage token deletion in `api_service.dart` `onError` interceptor.
- **Interview URL (`FL-005`):** Updated `_joinInterview` in `interview_list_screen.dart` to launch the Web frontend URL.
- **Widget Test (`FL-009`):** Fixed `!timersPending` failure in `test/widget_test.dart`; `flutter test --no-pub --suppress-analytics` -> **PASS (`1/1`, exit `0`)**.
- **Dart Analyzer (`BASE-FL-001`):** `dart analyze` reports `187 issues found` (exit `2`, non-blocking `info` deprecations deferred).
