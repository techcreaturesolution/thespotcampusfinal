# S0-12 — Role & Permission Verification

**Project:** The Spot Campus (`thespotcampusfinal`) | **Owners:** Dev 1 + Dev 2

---

- **External Step 0A Matrix Status:** **MISSING FROM REPOSITORY** (No permissions invented).
- **Verified Implemented Enforcement (Backend Authoritative):**
  - `server/src/middleware/authMiddleware.js` (`authenticateUser`, `authorizePermissions`) enforced on Admin, University, College, Round, Payment, Contact, CV Template, and `/api/auth/register` routes (`17/17` backend tests PASS).
  - `login.controller.js` verifies active status across all 6 roles (`Admin`, `University`, `College`, `TPO`, `Company`, `Student`).
  - `client/src/common/components/RoleGuard.jsx` wired across all 6 role portals in `client/src/App.jsx` (`4/4` Web tests PASS, fail-closed on unknown roles).
