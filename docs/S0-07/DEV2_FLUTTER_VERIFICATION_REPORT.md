# S0-07 — Dev 2 Flutter Verification Report

**Owner:** Dev 2 | **Baseline:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)  
**Recalculated Counts:** `38` `.dart` files in `lib/`, `28` `*_screen.dart` files (`27` in `main.dart` + `1` `MarketJobDetailScreen` via `MaterialPageRoute`), `4` services, `2` widgets (`GlassContainer`, `PremiumPaywall`).

---

## 1. Flutter Verification Summary

| Area | Primary Status | Verified Evidence |
|---|---|---|
| **Static Screen & Route Wiring** | `WORKING` (L1) | All 28 screens exist, `main.dart` registers 27 routes (`21` named + `6` `onGenerateRoute`), `MarketJobDetailScreen` pushed via `MaterialPageRoute`. |
| **Interview Join Link (`interview_list_screen.dart#L54`)** | `NOT_WORKING` | Strips `/api` from API `baseUrl` instead of web client URL and opens unauthenticated browser (`FL-005`). |
| **Cleartext Network Config** | `PARTIALLY_WORKING` | `AndroidManifest.xml#L8` (`usesCleartextTraffic="true"`, `FL-001`) and `Info.plist#L7-L11` (`NSAllowsArbitraryLoads: true`, `FL-022`). |
| **Auth & HTTP Architecture** | `PARTIALLY_WORKING` | `AuthService` lacks `role == 'Student'` check (`FL-003`); `ApiService` lacks `401` auto-logout (`FL-004`); 3 HTTP clients (`FL-008`). |
| **Unused Packages (`pubspec.yaml#L23-L24`)** | `UNUSED` | `socket_io_client` and `flutter_local_notifications` have 0 imports in `lib/` (`FL-011`). |
| **Exam Result Screen & Push Notifications** | `NOT_IMPLEMENTED` | No `ExamResult` screen (`FL-019`) and no push/local notifications (`FL-011`). |
| **`flutter analyze`, Device E2E & iOS Build** | `BLOCKED` | `flutter analyze --no-pub` timed out on Windows; iOS build unavailable on `windows_x64` (`FL-017`); no live device/emulator E2E executed. |
