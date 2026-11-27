# AUD-001: Multi-Role Active-Status Authentication Verification

**Affected File:** `server/src/modules/auth/login.controller.js`  
**Test File:** `server/tests/auth_student_migration.test.js`  
**Status:** **FIXED_AND_VERIFIED**

---

- **Verified All 6 Roles (Positive & Negative):**
  - `Admin` (`admin_status`: `Active` -> `200` + JWT; `Suspended` -> `401`, no JWT)
  - `Student` (`isVerifiedByTPO: true` + `student_status: Active` -> `200`; `isVerifiedByTPO: false` or `student_status: Inactive` -> `401`, no JWT)
  - `Company` (`company_verified: Approved` -> `200`; `Pending` -> `401`)
  - `College` (`college_verified: Approved` -> `200`; `Rejected` -> `401`)
  - `University` (`university_verified: Approved` -> `200`; `Pending` -> `401`)
  - `TPO` (`tpo_status: Active` -> `200`; `Disabled` -> `401`)
- **Result:** `3/3` `AUD-001` test blocks in `auth_student_migration.test.js` **PASS** (exit `0`).
