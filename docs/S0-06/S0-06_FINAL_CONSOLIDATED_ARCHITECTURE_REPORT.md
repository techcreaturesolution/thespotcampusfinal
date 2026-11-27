# S0-06 — Final Consolidated Architecture Report

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Phase:** Step 0 — S0-06 Consolidated System Architecture Review  
**Owners:** Dev 1 (Backend, DB, API, Auth, Institute) + Dev 2 (Web, Flutter)  
**Baseline:** Branch `ravi`, Commit `66220d594954ba077cf1d4a709eba3a084a74abc`  
**Status:** **Approval Ready** (Zero source code modified; 36 pre-existing uncommitted files preserved)

---

## 1. Consolidated Architecture Summary

- **Backend (`server/`):** Node.js `v22.23.5` + Express `4.18.2` modular monolith + Socket.IO `4.7.5`, **30 `app.use` mounts** (27 `.route.js` files) + **4 direct routes** = **217 mounted endpoints** (`216 unique`) + **6 unmounted** (`session.route.js`). No service layer outside `jobFinder/`.
- **Database (`MongoDB` + `Mongoose 7.0.5`):** **38** `.model.js` files → **39** models, **594** top-level paths, **16** embedded schemas, **51** top-level `ref`s, **56** indexes. Zero migrations, zero transactions, zero soft-deletes.
- **Web Frontend (`client/`):** React `18.3.1` + Vite `6.3.5` + Tailwind `3.4.4`, **74** page files (`72` active, `2` unrouted), **67** routes, **27** component files, **215** `customFetch` call sites (`148` unique `METHOD+path`). No `<RoleGuard>`, no `<ErrorBoundary>`, `localStorage` JWT.
- **Flutter Mobile (`flutter_student_app/`):** Flutter `3.41.9` / Dart `3.11.5`, **28** screens (`27` in `main.dart` + `1` `MaterialPageRoute`), **2** reusable widgets, **38** distinct endpoints (`55` call sites), native Camera + MLKit proctoring. 3 HTTP clients, cleartext HTTP enabled, no Student role guard on login.
- **Testing Across All 3 Tiers:** **0** automated tests in Backend, Web, and Flutter.

---

## 2. Unresolved Architecture Questions (Need Product/Tech Lead Decision)

1. **Step 0A Role & Permission Matrix:** Not committed in repo — confirm exact allowed permissions for `TPO` vs `College` vs `University` before hardening RBAC.
2. **Dead Modules (`session/` & `RecruitmentSubscription.jsx`):** Confirm whether `session.route.js` / `sessionSecurityMiddleware.js` and Company `RecruitmentSubscription` should be removed or activated.
3. **`jobFinder` Ownership Model (`DB-001`):** Confirm how `JobPosting` / `JobSearch` should reference multi-collection users (remove `tbl_user` ref or introduce unified `userRole` `refPath`).
4. **College-to-Institute Rollout Strategy:** Confirm whether `/api/v1` or dual-field aliases will be used to keep existing Flutter builds compatible during migration.

---

## 3. Deliverables Index (`docs/S0-06/`)

1. [S0-06_SYSTEM_ARCHITECTURE_OVERVIEW.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-06/S0-06_SYSTEM_ARCHITECTURE_OVERVIEW.md)
2. [S0-06_BACKEND_ARCHITECTURE.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-06/S0-06_BACKEND_ARCHITECTURE.md)
3. [S0-06_DATABASE_ARCHITECTURE.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-06/S0-06_DATABASE_ARCHITECTURE.md)
4. [S0-06_API_ARCHITECTURE.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-06/S0-06_API_ARCHITECTURE.md)
5. [S0-06_WEB_FRONTEND_ARCHITECTURE.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-06/S0-06_WEB_FRONTEND_ARCHITECTURE.md)
6. [S0-06_FLUTTER_ARCHITECTURE.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-06/S0-06_FLUTTER_ARCHITECTURE.md)
7. [S0-06_AUTHENTICATION_PERMISSION_ARCHITECTURE.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-06/S0-06_AUTHENTICATION_PERMISSION_ARCHITECTURE.md)
8. [S0-06_MODULE_DEPENDENCY_MAPPING.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-06/S0-06_MODULE_DEPENDENCY_MAPPING.md)
9. [S0-06_COLLEGE_INSTITUTE_FUTURE_ARCHITECTURE.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-06/S0-06_COLLEGE_INSTITUTE_FUTURE_ARCHITECTURE.md)
10. [S0-06_ARCHITECTURE_RISKS_AND_RECOMMENDATIONS.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-06/S0-06_ARCHITECTURE_RISKS_AND_RECOMMENDATIONS.md)
11. [S0-06_FINAL_CONSOLIDATED_ARCHITECTURE_REPORT.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-06/S0-06_FINAL_CONSOLIDATED_ARCHITECTURE_REPORT.md)
