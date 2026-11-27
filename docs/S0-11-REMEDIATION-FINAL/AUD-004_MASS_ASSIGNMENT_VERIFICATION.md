# AUD-004: Student Mass-Assignment Verification

**Affected Files:** `server/src/modules/student/student.controller.js`, `server/src/modules/student/student.model.js`  
**Test File:** `server/tests/auth_student_migration.test.js`  
**Status:** **FIXED_AND_VERIFIED**

---

- **Explicit Allowlist (`STUDENT_EDITABLE_FIELDS`):** `student_name`, `student_contact`, `student_current_sem`, `student_total_backlog`, `student_skills`, `student_enrollment`, `college_id`, `university_id`, `degree_id`, `branch_id` (plus `isVerifiedByTPO`/`student_status` ONLY for `Admin`/`College`/`TPO`).
- **Verification Results (`auth_student_migration.test.js`):**
  - Attempted mass assignment of `role: "Admin"`, `student_password: "hacked"`, `isVerifiedByTPO: true`, `student_status: "Active"`, and `$set: { role: "Admin" }` by `Student`: all privileged/nested fields **stripped**; only `student_name` persisted (`200`).
  - `Company` and `University` roles calling `PATCH /api/student/:id`: **rejected with `403`**.
