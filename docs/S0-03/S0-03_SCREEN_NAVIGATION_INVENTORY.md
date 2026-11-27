# S0-03 — Screen & Navigation Inventory

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Total Screens:** 28 (`27` registered in `main.dart` + `1` pushed via `MaterialPageRoute`: `MarketJobDetailScreen`)  
**Total Routes in `main.dart`:** 27 (`21` named `routes` + `6` in `onGenerateRoute`)

---

## 1. Auth, Core & Placement Screens (15 Screens)

| Screen | Route | File Path | Key APIs | Status |
|---|---|---|---|---|
| `SplashScreen` | `/` | `screens/splash_screen.dart` | Calls `AuthService.checkAuth()` (`/login/current-user`) | Fully Implemented |
| `LoginScreen` | `/login` | `screens/login_screen.dart` | `AuthService.login()` (`POST /login`) | Partially Implemented (No Student role guard) |
| `ForgotPasswordScreen` | `/forgot-password` | `screens/forgot_password_screen.dart` | `AuthService.forgotPassword()` (`POST /auth/forgot-password`) | Fully Implemented |
| `RegisterScreen` | `/register` | `screens/register_screen.dart` | `GET /dropdown/*`, `POST /register` | Fully Implemented |
| `HomeScreen` | `/home` | `screens/home_screen.dart` | `GET /jobs/student`, `/application/student`, `/interviews/student`, `/preparation/progress*`, `POST /application/:id` | Fully Implemented (1,630 lines) |
| `JobListScreen` | `/jobs` | `screens/job_list_screen.dart` | `GET /jobs/student`, `GET /application/student`, `POST /application/:id` | Fully Implemented |
| `JobDetailScreen` | `/job-detail` (arg: `jobId`) | `screens/job_detail_screen.dart` | `GET /jobs/:id`, `GET /application/student`, `POST /application/:id` | Fully Implemented |
| `ExamScreen` | `/exam` (arg: `examId`) | `screens/exam_screen.dart` | `GET /exam/:id`, `POST /paper/session/:id`, `POST /paper/:id/snapshot|violation|auto-submit`, `POST /paper/:id` | Partially Implemented (Client trustScore; no Socket.IO) |
| `MyApplicationsScreen` | `/my-applications` | `screens/my_applications_screen.dart` | `GET /application/student` | Fully Implemented |
| `ProfileScreen` | `/profile` | `screens/profile_screen.dart` | `GET /student/resume/me`, `PATCH /users/update-profile` | Fully Implemented |
| `InterviewListScreen` | `/interviews` | `screens/interview_list_screen.dart` | `GET /interviews/student` | Partially Implemented (`_joinInterview` uses API `baseUrl` instead of web URL) |
| `PlansScreen` | `/plans` | `screens/plans_screen.dart` | `GET /recruitment-subscription/plans/active?plan_for=student`, `GET /payment/check`, `POST /payment`, `POST /payment/verify` | Partially Implemented (Client `amount` sent) |
| `ResumeBuilderScreen` | `/resume` | `screens/resume_builder_screen.dart` | `ResumeService` (`/payment/check`, `/student/resume/me`, `/cv-templates`, `/ai-summaries`) | Fully Implemented (1,207 lines) |
| `ResumePreviewScreen` | `/resume-preview` | `screens/resume_preview_screen.dart` | `ResumeService` (`/cv-templates/compile`, `/cv-templates/download-pdf`) | Fully Implemented |

---

## 2. Job Finder & Bookmarks Screens (3 Screens)

| Screen | Route | File Path | Key APIs | Status |
|---|---|---|---|---|
| `MarketJobFinderScreen` | `/market-job-finder` | `screens/job_finder/market_job_finder_screen.dart` | `JobFinderService` (`/job-finder/meta`, `/searches`, `/search`) | Fully Implemented (1,405 lines) |
| `MarketJobDetailScreen` | *(MaterialPageRoute)* | `screens/job_finder/market_job_detail_screen.dart` | `JobFinderService.getJobDetails`, `applyJob` | Fully Implemented |
| `BookmarksScreen` | `/bookmarks` | `screens/bookmarks_screen.dart` | `GET /preparation/bookmarks`, `POST /preparation/bookmarks/toggle` | Fully Implemented |

---

## 3. Preparation Module Screens (11 Screens)

| Screen | Route | File Path | Key APIs | Status |
|---|---|---|---|---|
| `PreparationDashboardScreen` | `/preparation` | `screens/preparation/preparation_dashboard_screen.dart` | `GET /preparation/progress` | Fully Implemented |
| `MockTestsScreen` | `/preparation/mock-tests` | `screens/preparation/mock_tests_screen.dart` | `GET /preparation/mock-tests/active`, `bookmarks`, `POST .../start` | Fully Implemented |
| `TakeTestScreen` | `/preparation/take-test` | `screens/preparation/take_test_screen.dart` | `POST /preparation/mock-tests/save/:id`, `submit/:id` | Fully Implemented |
| `TestResultScreen` | `/preparation/test-result` | `screens/preparation/test_result_screen.dart` | `GET /preparation/mock-tests/result/:id` | Fully Implemented |
| `SubjectPracticeScreen` | `/preparation/subjects` | `screens/preparation/subject_practice_screen.dart` | `GET /preparation/subjects/active` | Fully Implemented |
| `PracticeScreen` | `/preparation/practice` | `screens/preparation/practice_screen.dart` | `GET /preparation/questions/practice/:id`, `POST /preparation/progress/practice/update` | Fully Implemented |
| `DailyChallengeScreen` | `/preparation/daily-challenge` | `screens/preparation/daily_challenge_screen.dart` | `GET /preparation/daily-challenge`, `POST .../submit` | Fully Implemented |
| `PerformanceScreen` | `/preparation/performance` | `screens/preparation/performance_screen.dart` | `GET /preparation/progress`, `GET /preparation/progress/subjects` | Fully Implemented |
| `ReadingMaterialScreen` | `/preparation/reading` | `screens/preparation/reading_material_screen.dart` | `GET /preparation/pdfs/active` | Fully Implemented |
| `PreviousPapersScreen` | `/preparation/previous-papers` | `screens/preparation/previous_papers_screen.dart` | `GET /preparation/questions/previous-year*`, `bookmarks*` | Fully Implemented |
| `PdfViewerScreen` | `/preparation/pdf-viewer` | `screens/preparation/pdf_viewer_screen.dart` | `Dio.download(url)`, `POST /preparation/pdfs/reading-progress` | Fully Implemented |
