# S0-12 — Flutter Test and Analyzer Report

**Project:** `flutter_student_app/` | **Owner:** Dev 2 | **Date:** 2026-11-27

---

## 1. Fresh Execution Results (`task-1069`)
- **Automated Tests (`flutter test --no-pub --suppress-analytics`):** **PASS** (`00:03 +1: All tests passed!`, `FL_TEST:0`).
  - Test file: `flutter_student_app/test/widget_test.dart` (`App smoke test`).
- **Static Analysis (`dart analyze`):** `121 issues found.` (`FL_ANA:2`) — **0 errors, 0 warnings, 121 info diagnostics** (`deprecated_member_use` on `.withOpacity()` / `.value` and `2` `use_build_context_synchronously` infos). No analyzer rules suppressed.
- **API & Auth Integration Verified:** `job_finder_service.dart` unified on `ApiService` (Dio), `401` token deletion in `api_service.dart`, Web URL fix in `interview_list_screen.dart` `_joinInterview`, HTTPS enforced (`usesCleartextTraffic="false"`).
