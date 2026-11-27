# Dev 1 — College-to-Institute Migration Readiness (S0-11)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-11 | **Owner:** Dev 1  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Readiness Verdict: **BLOCKED (`FEAT-025`)**
`tbl_institute` / `institute_id` does **not** exist in the codebase (`S0-04`, `S0-08`). External **Step 0A Role & Permission Matrix** and **College-to-Institute Migration Plan** are not committed in the repository.

## 2. Cross-Platform Classification of `college` References

| Category | Scope / Locations | Target | Risk & Rollback | Owner | Approval Status |
|---|---|---|---|---|---|
| **MUST MIGRATE** | `college.model.js` (`tbl_college`, `12` backend importers), `college.controller.js`, `college.route.js`, `tpo/student/degree/branch/job` `college_id` refs | Unified `tbl_institute` / `institute_id` | **CRITICAL** — Requires `FEAT-023` migration runner + backup/rollback script | Dev 1 | **BLOCKED** (Missing Migration Plan) |
| **MUST MIGRATE (UI)** | `client/src/college/**` (`10` files), `university/**`, `tpo/**`, `flutter_student_app/lib/screens/register_screen.dart` & `edit_profile_screen.dart` | Institute terminology & routes | **HIGH** — Breaks role navigation if uncoordinated | Dev 2 | **BLOCKED** (Missing Step 0A) |
| **LEGACY COMPATIBILITY REQUIRED** | `/api/college/*` API routes during transition, existing JWT `role: "college"` tokens | Dual-route/alias adapter until Flutter & Web cutover | **HIGH** — Prevents mobile client breakage | Dev 1 + Dev 2 | **BLOCKED** |
| **HISTORICAL DATA** | Existing `tbl_student`, `tbl_application`, `tbl_job` records with `college_id` | Backfill `institute_id` via idempotent migration | **CRITICAL** — Zero data loss required | Dev 1 | **BLOCKED** |
| **DOCUMENTATION ONLY** | `S0-01`–`S0-10` historical audit docs | Preserve as historical baseline | **LOW** | Joint | Approved as-is |
