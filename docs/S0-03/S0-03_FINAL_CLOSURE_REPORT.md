# S0-03 — Final Closure Report

**Owner:** Dev 2 | **Branch:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`) | **Status:** **Approval Ready**

---

## 1. Corrections & Reconciliations Completed

| # | Correction Item | Resolution & Source Evidence | Verification Status |
|---|---|---|---|
| 1 | Reconcile `28` vs `27` screens | Verified **28** `*_screen.dart` files (`15` root `lib/screens/` + `2` `job_finder/` + `11` `preparation/`). `27` are registered in `lib/main.dart#L107-L167` (`21` named `routes` + `6` `onGenerateRoute`), and `1` (`MarketJobDetailScreen`) is pushed via `MaterialPageRoute` at `market_job_finder_screen.dart#L1270,1370` (`24` Fully Implemented + `4` Partially Implemented + `0` Broken = `28`). | Verified |
| 2 | Resolve duplicate `FL-001` ID | Android `usesCleartextTraffic="true"` retains `FL-001` (`AndroidManifest.xml#L8`); iOS `NSAllowsArbitraryLoads: true` assigned unique ID `FL-022` (`ios/Runner/Info.plist#L7-L11`). Total S0-03 findings = **22** (`4 Critical, 6 High, 7 Medium, 5 Low`). | Verified |
| 3 | Verify `38` endpoints & `55` call sites | Verified across `ApiService`, `AuthService`, `JobFinderService`, `ResumeService`, and `pdf_viewer_screen.dart`. | Verified |
| 4 | Complete line refs & severity justifications | Added exact line references for `FL-007` (`profile_screen.dart#L770`, `auth_service.dart#L126`), `FL-010` (6 oversized screens), `FL-012` (`lib/widgets/glass_container.dart#L1-L72`, `premium_paywall.dart#L1-L196`), `FL-013` (`lib/models/market_job_models.dart#L1-L150`), `FL-017` (`ios/Runner/Info.plist#L74-L78`), `FL-018` (`home_screen.dart#L121-L144`) and severity justifications for all 22 findings in `S0-01_TO_S0-05_FINAL_EVIDENCE_SUBMISSION.md`. | Verified |
| 5 | iOS build limitation & zero code changes | Documented that iOS build/Xcode cannot run on `windows_x64` (`FL-017`); confirmed `0` Dart/Android/iOS source files modified. | Verified |

---

## 2. Severity Justifications for All 22 Flutter Findings (`FL-001`–`FL-022`)

- **Critical (`FL-001`, `FL-022`, `FL-002`, `FL-003`):**
  - `FL-001` & `FL-022`: Global cleartext HTTP (`usesCleartextTraffic="true"` on Android, `NSAllowsArbitraryLoads: true` on iOS) exposes auth tokens, PII, and proctoring data in transit to MITM attacks.
  - `FL-002`: Sending client-controlled `amount` to `POST /api/payment` directly enables ₹1 payment tampering when paired with backend `AUD-007`.
  - `FL-003`: Missing `role == 'Student'` check in `AuthService.login()` permits privileged web-only roles to authenticate into the mobile Student app.
- **High (`FL-004`–`FL-009`):**
  - `FL-004`: Missing `401` auto-logout leaves expired tokens in `FlutterSecureStorage`.
  - `FL-005`: Broken `_joinInterview` URL (API `baseUrl` instead of web URL) breaks mobile interview joining.
  - `FL-006`: Client-computed `trustScore` & `totalViolations` enable proctoring score tampering (`AUD-015`).
  - `FL-007`: Relies on mass-assignment `/users/update-profile` & unauthenticated `/register` (`AUD-004`, `AUD-008`).
  - `FL-008`: 3 fragmented HTTP clients (`package:http` without timeouts) risk hanging requests and auth drift.
  - `FL-009`: Zero automated tests (`test/` missing) leaves auth, payments, and proctoring without regression safety.
- **Medium (`FL-010`–`FL-016`):**
  - `FL-010` (monolithic 935–1,630L screens), `FL-011` (unused heavy packages `socket_io_client`/`flutter_local_notifications`), `FL-012` (only 2 shared widgets), `FL-013` (untyped `Map` payloads), `FL-014` (no offline cache), `FL-015` (`.env` asset + localhost HTTP fallback), `FL-016` (raw `android:label` + release signing `TODO`) — degrade maintainability, bundle size, and release readiness without immediate exploitability.
- **Low (`FL-017`–`FL-021`):**
  - `FL-017` (iOS build unavailable on Windows / missing photo library desc), `FL-018` (6 API calls in `StatefulWidget`), `FL-019` (missing `ExamResult` screen), `FL-020` (starter `README.md`), `FL-021` (untracked `.zip` archives) — minor UX, documentation, or repo hygiene items.
