# S0-09 — Complete File Dependency Map

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Cross-Platform System Dependency Graph

```mermaid
flowchart LR
  subgraph Dev2_Web["Dev 2: Web (client/src)"]
    App["App.jsx (67 routes)"]
    Layout["DashboardLayout.jsx"]
    Fetch["customFetch.js (76 importers)"]
    WebPages["74 Web Pages + 27 Components"]
    WebPages --> Fetch
    WebPages --> Layout
    App --> Layout
  end

  subgraph Dev2_Flutter["Dev 2: Flutter (flutter_student_app/lib)"]
    MainDart["main.dart (27 routes)"]
    ApiSvc["api_service.dart (27 importers)"]
    AuthSvc["auth_service.dart (10 importers)"]
    Screens["28 Flutter Screens"]
    Screens --> ApiSvc
    Screens --> AuthSvc
    MainDart --> Screens
  end

  subgraph Dev1_Backend["Dev 1: Backend & DB (server/src)"]
    AppJS["app.js"]
    Routes["config/routes.js (30 mounts)"]
    AuthMW["middleware/authMiddleware.js (12+ routes)"]
    Controllers["22 Module Controllers"]
    Models["39 Mongoose Models (594 paths, 51 refs)"]
    AppJS --> Routes
    Routes --> AuthMW
    Routes --> Controllers
    Controllers --> Models
  end

  Fetch -->|"HTTPS/JSON + Cookie/JWT (REQUIRED/BLOCKING)"| AppJS
  ApiSvc -->|"HTTPS/JSON + Bearer JWT (REQUIRED/BLOCKING)"| AppJS
```

---

## 2. Example Deep File Dependency Trace (`FEAT-011` Student Profile)
- **Backend (Dev 1):** `student.route.js` -> `authMiddleware.js` (`BLOCKING`) + `validationMiddleware.js` (`REQUIRED`) -> `student.controller.js` -> `student.model.js` (`BLOCKING`) + `tpo.model.js` (`REQUIRED` cross-module).
- **Web (Dev 2):** `Profile.jsx` -> `customFetch.js` (`BLOCKING`) + `PageHeader.jsx` (`REQUIRED`) + `Loading.jsx` (`REQUIRED`).
- **Flutter (Dev 2):** `profile_screen.dart` -> `api_service.dart` (`BLOCKING`) + `auth_service.dart` (`REQUIRED`).
