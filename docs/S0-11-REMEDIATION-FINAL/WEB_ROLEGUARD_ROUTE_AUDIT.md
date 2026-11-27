# Web RoleGuard Route Audit

**Affected Files:** `client/src/App.jsx`, `client/src/common/components/RoleGuard.jsx`, `client/tests/app.test.jsx`  
**Status:** **FIXED_AND_VERIFIED**

---

- **Protected Routes Wired in `App.jsx`:**
  - `admin/*` (`15` routes) -> `<RoleGuard allowedRoles={["Admin"]}>`
  - `student/*` (`20` routes) -> `<RoleGuard allowedRoles={["Student"]}>`
  - `company/*` (`5` routes) -> `<RoleGuard allowedRoles={["Company"]}>`
  - `college/*` (`7` routes) -> `<RoleGuard allowedRoles={["College"]}>`
  - `university/*` (`5` routes) -> `<RoleGuard allowedRoles={["University"]}>`
  - `tpo/*` (`4` routes) -> `<RoleGuard allowedRoles={["TPO"]}>`
  - Shared (`video-interview/:roomId`, `exam-result/:id`, `company/exam-result/:id`) -> `<RoleGuard>` with appropriate role lists.
- **Public Routes Preserved:** `/`, `/sign-in`, `/sign-up-*`, `/forgot-password`, `/reset-password/:token`, `/privacy-policy`, `/terms-of-service`, `/account-deletion-request`, `/view-pdf`.
- **Fail-Closed Verification (`app.test.jsx`, `4/4` PASS):** Verified unauthenticated -> `/sign-in`, unknown role `"SuperHacker"` -> `/sign-in`, cross-role -> `/dashboard`, and all 6 valid roles -> allowed.
- **Authority Note:** Backend `authorizePermissions` remains the security authority.
