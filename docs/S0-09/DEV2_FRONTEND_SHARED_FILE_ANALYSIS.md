# Dev 2 — Frontend Shared File Analysis

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-09 | **Owner:** Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Detailed Shared File Register (Dev 2 Primary Owner — 10 Files)

| File Path | File Purpose | Primary Owner | Consumers | Shared By | Modification Permission | Approval Required | Dependencies | Risk | Change Impact |
|---|---|---|---|---|---|---|---|---|---|
| `client/src/utils/customFetch.js` | Axios client (`215` calls, `76` importers) | Dev 2 | All Web pages | Dev 2 + Dev 1 (contract) | Dev 2 only | Yes (Notify Dev 1 on auth/header changes) | `server/src/app.js` (CORS/cookies) | **Critical** | Interceptor/baseURL bug breaks all 74 Web pages |
| `client/src/App.jsx` | React Router (`67` routes) & route guards | Dev 2 | All Web roles | Dev 2 | Dev 2 only | Yes (Role route audit) | All Web page modules | **High** | Broken path/guard causes 404 or unauthorized UI |
| `client/src/common/pages/DashboardLayout.jsx` | Shared auth context & role sidebar shell | Dev 2 | All 6 Web roles | Dev 2 | Dev 2 only | Yes | `customFetch.js`, `/auth/current-user` | **Critical** | Auth state/role bug locks out dashboards |
| `client/src/common/components/DataTable.jsx` | Shared table component (`15` importers) | Dev 2 | Admin, College, TPO, Company, Uni | Dev 2 | Dev 2 only | Yes (Props stability) | Portal table pages | **Medium** | Prop changes break `15` management pages |
| `client/src/common/components/PageHeader.jsx` | Shared page title/breadcrumb (`46` importers) | Dev 2 | Almost all dashboard pages | Dev 2 | Dev 2 only | Yes | Portal pages | **Low** | Visual/layout regression across `46` pages |
| `client/src/common/components/DashboardCard.jsx` | Shared KPI metric card (`6` importers) | Dev 2 | Role dashboards | Dev 2 | Dev 2 only | Yes | Dashboard pages | **Low** | KPI layout break |
| `flutter_student_app/lib/services/api_service.dart` | Dio HTTP client (`27` importers) | Dev 2 | All Flutter screens | Dev 2 + Dev 1 (contract) | Dev 2 only | Yes (Notify Dev 1 on auth/401) | `constants.dart`, backend routes | **Critical** | Interceptor/timeout/401 bug breaks mobile app |
| `flutter_student_app/lib/services/auth_service.dart` | Mobile login, token storage, role gate (`10` importers) | Dev 2 | Auth & profile screens | Dev 2 + Dev 1 (contract) | Dev 2 only | Yes | `api_service.dart`, `/auth/*` | **Critical** | Role/token bug breaks mobile login/security |
| `flutter_student_app/lib/utils/constants.dart` | API base URL & app constants (`5` importers) | Dev 2 | Services & screens | Dev 2 | Dev 2 only | Yes | `flutter_student_app/.env` | **High** | Wrong baseURL breaks all mobile API calls |
| `flutter_student_app/lib/main.dart` | Named route registry & app entry (`27` routes) | Dev 2 | All Flutter screens | Dev 2 | Dev 2 only | Yes | All screens, `auth_service.dart` | **High** | Route rename breaks navigation |
