# S0-11 — Role & Permission Approval Matrix

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

> **Blocking Documentation Note:** External **Step 0A Role & Permission Matrix** is **not committed** in the repository. Assessment below reflects actual codebase implementation (`S0-01`, `S0-02`, `S0-03`, `S0-07`).

| Role | Backend Auth/RBAC Status | Web Guard Status | Flutter Status | Status |
|---|---|---|---|---|
| **Admin** | Missing `authorizePermissions('admin')` on reports/payments/templates/contacts (`AUD-006, 009, 010`) | Missing `<RoleGuard>` (`FE-001`) | N/A (Web only) | **FAIL** |
| **University** | Missing `Admin`/ownership RBAC on university routes (`AUD-002`) | `university/*` pages present | N/A | **FAIL** |
| **College / Institute** | `tbl_college` exists (`tbl_institute` missing); RBAC gaps (`AUD-003`) | Duplicate `college/*` & `university/*` pages (`FE-012`) | N/A (Registration dropdown only) | **BLOCKED / FAIL** |
| **TPO** | Ownership gaps (`AUD-008`) | `tpo/*` pages present | N/A | **CONDITIONAL** |
| **Company** | `createJob` & `/rounds/*` RBAC gaps (`AUD-005, 008`) | `company/*` pages present | N/A | **FAIL** |
| **Student** | `*_status` check missing (`AUD-001`); `/api/register` (`AUD-013`) | `student/*` pages present | Weak Student role gate (`FL-003`) | **FAIL** |
