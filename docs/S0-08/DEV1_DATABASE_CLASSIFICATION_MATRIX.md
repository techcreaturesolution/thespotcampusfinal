# S0-08 — Dev 1 Database Classification Matrix

**Owner:** Dev 1 | **Baseline:** `38` `.model.js` files → `39` Mongoose models, `594` paths, `51` refs, `56` indexes (`S0-04`)

---

## 1. Model-Level Database Classification

| Classification | Count | Models / Collections | Exact Scope & Justification |
|---|---|---|---|
| **REUSE Existing Model** | 21 | `tbl_password_reset`, `tbl_degree_master`, `tbl_cv_template`, `tbl_resume`, `tbl_payment`, `tbl_recruitment_plan`, `tbl_recruitment_subscription`, `tbl_idempotency_key`, `tbl_contact`, 9x `tbl_prep_*`, `SearchCache`, `tbl_interview`, `tbl_candidate_round` | Core schemas are structurally sound. Minor index cleanup on `tbl_prep_dailychallenge` & `tbl_prep_studentprogress` (`DB-015`). |
| **ENHANCE Existing Model** | 18 | `tbl_admin`, `tbl_university`, `tbl_college`, `tbl_degree`, `tbl_branch`, `tbl_tpo`, `tbl_company`, `tbl_student`, `tbl_jobpost`, `tbl_application`, `tbl_exam`, `tbl_paper`, `exam_payment`, `AgentRun`, `AutoImportRule`, `JobPosting`, `JobSearch`, `JobFinderSettings` | Add `unique: true` on emails/enrollments/`{student_id, job_id}` (`DB-003`, `DB-004`), FK indexes (`DB-008`), fix `exam_payment.user_id` unique bug (`DB-002`), fix `tbl_user` refs (`DB-001`), migrate `tbl_paper.exam_id` to `ObjectId` (`DB-005`), standardize `String` numbers/dates (`DB-009`), add soft-delete (`DB-011`). |
| **CREATE New Model** | 1 (Planned) | `tbl_institute` (or `tbl_college` migration target) + optional `tbl_notification` | `tbl_institute` does not exist yet (`S0-04`); required only when College-to-Institute migration is approved. `tbl_notification` needed if in-app/push notifications are built (`NEW`). |
