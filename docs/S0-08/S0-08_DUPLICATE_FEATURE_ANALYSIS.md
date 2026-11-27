# S0-08 — Duplicate Feature & Implementation Analysis

**Project:** The Spot Campus (`thespotcampusfinal`) | **Owners:** Dev 1 + Dev 2 (Joint)

| # | Duplicate Area | Original / Authoritative | Duplicate Implementation(s) | Consolidation Action (Future) |
|---|---|---|---|---|
| 1 | **Current User Endpoint** | `GET /api/login/current-user` (`login.controller.js`) | `GET /api/users/current-user` (`user.controller.js`) | Keep one canonical `/api/users/current-user` or `/api/login/current-user`. |
| 2 | **Double-Mounted Routers** | `/api/login`, `/api/student`, `/api/payment` | `/api/logout` (`LoginRouter`), `/api/register` (`StudentRouter`), `/api/order` (`PaymentRouter`) | Separate `POST /api/register`; remove `/api/logout` & `/api/order` aliases after client sync. |
| 3 | **Route Setup Config** | `server/src/app.js` direct mounts | `server/src/config/routes.js` (`setupRoutes`) | Remove dead `config/routes.js`. |
| 4 | **Auth & File Upload Middleware** | `authMiddleware.js` (`authenticateUser`), `fileUploadMiddleware.js` | `sessionSecurityMiddleware.js` (`enhancedAuthenticateUser`), `multerMiddleware.js` | Standardize on `fileUploadMiddleware.js`; decide on `sessionSecurityMiddleware.js`. |
| 5 | **Duplicate Job Models** | `tbl_jobpost` (`job.model.js`) | `JobPosting` (`jobFinder/models/JobPosting.model.js`) | Keep distinct boundaries (Campus vs External Aggregated), do NOT merge. |
| 6 | **Duplicate Web Role Pages** | `college/pages/ManageStudent.jsx`, `ManageJob.jsx`, `ManageDegree.jsx`, `CollegeApplications.jsx` | Copies in `admin/`, `tpo/`, `university/` + `AddDegreeModal`/`AddBranchModal` | Consolidate into shared role-parameterized components (`FE-012`). |
| 7 | **Duplicate Web Routes** | `/dashboard/student/exam-result/:id` | `/dashboard/exam-result/:id`, `/dashboard/company/exam-result/:id` | Standardize canonical route (`FE-019`). |
| 8 | **Duplicate Flutter HTTP Clients** | `ApiService` (`Dio`) | `AuthService` (own `Dio`), `JobFinderService` (`package:http`), `pdf_viewer_screen.dart` (`Dio()`) | Route all HTTP calls through `ApiService` (`FL-008`). |
