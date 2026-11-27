# S0-12 — Institute-Level Architecture Report

**Project:** The Spot Campus (`thespotcampusfinal`) | **Owners:** Dev 1 + Dev 2 | **Status:** **BLOCKED (`FEAT-025`)**

---

- **Current State:** `tbl_college` / `college_id` is active across `12` backend importers, `client/src/college/**`, and Flutter registration/profile screens. `tbl_institute` / `institute_id` does **not** exist.
- **Tenant Isolation & Compatibility:** Legacy `/api/college/*` routes and `college_id` data remain preserved; blind find-and-replace is prohibited.
- **Blocker:** External **College-to-Institute Migration Plan** and **Step 0A Role & Permission Matrix** are not committed in the repository (`FEAT-025` remains blocked until approved).
