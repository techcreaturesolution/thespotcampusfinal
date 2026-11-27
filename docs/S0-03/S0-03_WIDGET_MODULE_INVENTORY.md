# S0-03 — Widget & Module Inventory

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Total Reusable Widgets (`lib/widgets/`):** 2  
**Total Services (`lib/services/`):** 4  
**Total Models (`lib/models/`):** 1

---

## 1. Reusable Widgets (`flutter_student_app/lib/widgets/`)

| Widget | File Path | Purpose | Reusability | Notes |
|---|---|---|---|---|
| `GlassContainer` | `lib/widgets/glass_container.dart` | Glassmorphism card/container with `BackdropFilter` blur & gradient border | High | Uses deprecated `.withOpacity()` (Flutter 3.41) |
| `PremiumPaywall` | `lib/widgets/premium_paywall.dart` | Full-screen subscription paywall for Preparation module | High | Navigates to `/plans` and triggers `onPurchaseSuccess` |

---

## 2. Services & Models

| Component | File Path | Purpose | Reusability / Gaps |
|---|---|---|---|
| `AuthService` | `lib/services/auth_service.dart` | `ChangeNotifier` managing login, register, forgot-password, checkAuth, logout | Reusable, but duplicates `Dio` setup |
| `ApiService` | `lib/services/api_service.dart` | Centralized `Dio` client with `FlutterSecureStorage` token injection | Reusable, but lacks `401` auto-logout hook |
| `JobFinderService` | `lib/services/job_finder_service.dart` | Market Job Finder API client | Duplicates token reading; uses `package:http` instead of `ApiService` |
| `ResumeService` | `lib/services/resume_service.dart` | Clean wrapper over `ApiService` for CV/Resume endpoints | Good pattern to replicate for other modules |
| `market_job_models.dart` | `lib/models/market_job_models.dart` | Typed `MarketJobMeta`, `MarketJobSearch`, `MarketJob` models | Only typed models in app; other modules use raw `Map<String, dynamic>` |

---

## 3. Missing Shared Components
- No shared `LoadingWidget`, `ErrorStateWidget`, `EmptyStateWidget`, `CustomAppBar`, or `AppTextField` in `lib/widgets/` — every screen reimplements loading spinners, snackbars, and empty states inline (`FL-012`).
- Unused packages in `pubspec.yaml`: `socket_io_client` and `flutter_local_notifications` (`FL-011`).
