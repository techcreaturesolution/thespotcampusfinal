# S0-04 — College-to-Institute Dependency Mapping

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Scope:** Complete mapping of existing `College`, `University`, and `Institute` structures (Mapping Only — Zero Renames or Migrations Executed).

---

## 1. Current State Summary

- **Existing Institute Model/Collection:** **NONE.** There is no `tbl_institute` model or `institute_id` field anywhere in `server/src/`.
- **Existing College Model:** `tbl_college` (`tbl_colleges` in `server/src/modules/college/college.model.js`) acts as the primary academic institution entity.
- **Existing University Model:** `tbl_university` (`tbl_universities` in `server/src/modules/university/university.model.js`) acts as the parent affiliating body above `tbl_college` (`college_university_id -> tbl_university`).

---

## 2. College & University Field & Reference Inventory

| Source Model / File | Field / Path | Target / Type | Usage / Dependency |
|---|---|---|---|
| `tbl_college` (`college.model.js`) | `college_university_id`, `college_code`, `college_name`, `college_email`, `college_address`, `college_contact`, `college_website`, `college_logo`, `college_status`, `college_verified`, `college_password`, `role: "College"` | Parent `tbl_university` | Login (`login.controller.js`), profile (`user.controller.js`), dropdowns, dashboard |
| `tbl_university` (`university.model.js`) | `university_establishment`, `university_name`, `university_email`, `university_address`, `university_contact_no`, `university_website`, `university_logo`, `university_status`, `university_verified`, `university_password`, `role: "University"` | Root entity | Affiliates colleges; scopes University dashboard, student, job, degree views |
| `tbl_student` (`student.model.js`) | `college_id`, `university_id` | `tbl_college`, `tbl_university` | Registration, TPO verification, job eligibility, CV compilation |
| `tbl_degree` (`degree.model.js`) | `college_id` | `tbl_college` | College-scoped degrees |
| `tbl_branch` (`branch.model.js`) | `college_id`, `degree_id` | `tbl_college`, `tbl_degree` | College-scoped branches |
| `tbl_tpo` (`tpo.model.js`) | `tpo_college_id`, `tpo_degree_id` | `tbl_college`, `tbl_degree` | TPO institutional scoping |
| `tbl_jobpost` (`job.model.js`) | `approved_colleges[]`, `job_college[].job_college_id`, `job_college[].job_university_id` | `tbl_college`, `tbl_university` | Campus job targeting & TPO approval |

---

## 3. Backend File Dependency Heatmap (21 Files in `server/src/`)

| File | Occurrences | Dependency Nature |
|---|---|---|
| `modules/job/job.controller.js` | 46 | Job targeting (`job_college`, `approved_colleges`), TPO/College/University filtering |
| `modules/dashboard/dashboard.controller.js` | 28 | Role-scoped stats for `College`, `TPO`, `University` |
| `modules/dropdown/dropdown.controller.js` | 18 | Cascading registration & job creation dropdowns (`universities`, `colleges`, `degrees`, `branches`) |
| `modules/student/student.controller.js` | 12 | Student scoping, College/TPO verification |
| `modules/application/application.controller.js` | 10 | `getInstitutionApplications`, institutional access checks |
| `modules/degree/degree.controller.js` & `branch.controller.js` | 8 each | College/TPO/University scoping |
| `modules/college/college.controller.js` & `tpo/tpo.controller.js` | 7 each | College & TPO CRUD + `getMyColleges` |
| `modules/auth/login.controller.js` & `user.controller.js` | 6 & 5 | Multi-collection login (`tbl_college`, `tbl_university`) & profile updates |
| `modules/student/cvTemplate.controller.js` | 3 | Populates `college_id.college_name` in CV templates |
| `modules/interview/round.controller.js` | 2 | Populates `college_id`, `university_id` in round candidate lists |
| `modules/university/university.controller.js` | 1 | Counts `tbl_college` per university |

---

## 4. Migration Dependency & Compatibility Risks

1. **JWT `role` & Login Collection Coupling:** `login.controller.js`, `user.controller.js`, `DashboardLayout.jsx`, and `constants.js` hardcode `"College"` and `"University"` role strings.
2. **Dual Targeting in `tbl_jobpost`:** `tbl_jobpost` uses BOTH `approved_colleges[]` AND `job_college[]` (`job_college_id`, `job_university_id`). Migrating to `Institute` requires backward-compatible dual-read/dual-write or a coordinated data backfill.
3. **Web & Flutter Coupling:** `client/src/common/pages/SignUpCollege.jsx`, `SignUpStudent.jsx`, `college/*`, `university/*`, and `flutter_student_app/lib/screens/register_screen.dart` all bind to `college_id`, `university_id`, and `/dropdown/colleges`.
4. **No Existing Migration Runner (`DB-007`):** Any College-to-Institute migration must introduce an idempotent migration script with rollback support before renaming collections or fields.
