# S0-04 — Database Index & Data Quality Audit

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Total Schema-Level Indexes:** 56 (`schema.indexes()`) across 39 collections (20 collections have **0 indexes** beyond `_id`)

---

## 1. Existing Index Inventory (Verified via Mongoose `schema.indexes()`)

- **Unique Indexes:** `tbl_password_reset.token`, `tbl_interview.room_id` (sparse), `tbl_candidate_round {job_id, student_id, round_number}`, `tbl_resume.student_id`, `tbl_payment.orderId`, `exam_payment.user_id` (**BUG `DB-002`**), `exam_payment.orderId`, `tbl_recruitment_subscription.orderId`, `tbl_idempotency_key.key`, `tbl_prep_subject.name`, `tbl_prep_subject_category.name`, `tbl_prep_dailychallenge.date` (duplicate def), `tbl_prep_bookmark {student_id, item_id, notes}`, `tbl_prep_studentprogress.student_id` (duplicate def), `JobPosting.key`.
- **TTL Indexes:** `tbl_password_reset.createdAt` (`3600s`), `tbl_idempotency_key.createdAt` (`86400s`).
- **Text Indexes:** `JobPosting` (`title: 10, companyName: 4, category: 3, description: 1`).
- **Compound / Query Indexes:** `tbl_application` (`{student_id, job_id}`, `{job_id, createdAt}`), `tbl_paper` (`{exam_id, student_id}`, `{student_id, createdAt}`), `tbl_prep_question` (4), `tbl_prep_mocktest` (3), `tbl_prep_testattempt` (4), `tbl_prep_pdfmaterial` (3), `AgentRun` (1), `JobSearch` (2), `SearchCache` (1).

---

## 2. Database Findings Register (`DB-001` to `DB-016`)

| Finding ID | Category | Severity | File Path | Collection | Field | Evidence | Description | Impact | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `DB-001` | Relationship | Critical | `jobFinder/models/*.model.js` | 5 `jobFinder` collections | `user`, `createdBy`, `postedBy`, `owner`, `updatedBy` | `ref: 'tbl_user'` | `tbl_user` collection does not exist | `.populate()` fails/returns null; broken ownership | Map to actual role collections or `userRole` `refPath` | Open |
| `DB-002` | Index/Constraint | Critical | `subscription/exampayment.model.js#L5-L10` | `exam_payments` | `user_id` | `unique: true` on `user_id` | Prevents company from paying for >1 AI exam | Blocks repeat exam purchases | Remove `unique: true`; use `{user_id:1, examId:1}` | Open |
| `DB-003` | Index/Constraint | High | `auth/admin`, `university`, `college`, `tpo`, `company`, `student` | 6 user collections | `*_email`, `student_enrollment`, `college_code` | No `unique: true` | Duplicate accounts possible under race conditions | Auth ambiguity & login collisions | Add unique indexes after deduplication | Open |
| `DB-004` | Index/Constraint | High | `application/application.model.js#L61` | `tbl_applications` | `student_id, job_id` | Non-unique index | Concurrent requests create duplicate applications | Corrupts applicant counts & round state | Make index `{ unique: true }` | Open |
| `DB-005` | Schema/Type | High | `exam/paper.model.js#L5-L8` | `tbl_papers` | `exam_id` | `type: String` (no `ref`) | Stores `job_id` string instead of `tbl_exam._id` | Breaks `.populate()` & referential integrity | Migrate to `ObjectId` ref `tbl_exam` | Open |
| `DB-006` | Integrity | High | `company.controller.js`, `job.controller.js`, `round.controller.js` | Multiple | — | 0 `startSession()` calls | Multi-doc deletes/advances run without transactions | Orphaned `tbl_paper`, `tbl_interview`, `tbl_candidate_round` | Wrap multi-doc writes in MongoDB transactions | Open |
| `DB-007` | Migration | High | `server/src/scripts/seed.js` | All | — | Only `seed.js` exists | Zero migration history or versioning | Unsafe College-to-Institute rollout | Add versioned migration runner with rollback | Open |
| `DB-008` | Index/Perf | Medium | Core `tbl_*` models | 20 collections | Foreign keys | 0 indexes on FKs | Full collection scans on `college_id`, `degree_id`, `job_company_id`, `job_id` | Slow queries at scale | Add single/compound indexes on all FKs | Open |
| `DB-009` | Data Quality | Medium | `job.model.js`, `student.model.js`, `degree.model.js` | `tbl_jobposts`, `tbl_students`, `tbl_degrees` | `job_reg_end_date`, `job_salary`, `student_current_sem`, etc. | Typed as `String` | Numeric/date fields stored as strings | Breaks range filters & date sorting | Migrate to `Date` / `Number` | Open |
| `DB-010` | Schema | Medium | `job/job.model.js#L91-L93` | `tbl_jobposts` | `target_degree` | `Schema.Types.Mixed` | Unvalidated mixed type | Inconsistent string vs array values | Standardize to `[String]` | Open |
| `DB-011` | Schema | Medium | All 39 models | All | — | Hard deletes only | No `isDeleted` / `deletedAt` soft-delete | Permanent loss of audit/exam/payment history | Add soft-delete for core entities | Open |
| `DB-012` | Validation | Medium | `admin`, `university`, `college`, `tpo`, `company`, `student`, `degree`, `branch` | 8 collections | Core fields | Missing `required: true` | Empty/partial documents can be inserted | Null/undefined runtime errors | Add `required: true` on mandatory fields | Open |
| `DB-013` | Architecture | Medium | `job.model.js` vs `JobPosting.model.js` | `tbl_jobposts`, `jobpostings` | — | Dual job schemas | Overlapping campus vs aggregated job tables | Confusion between internal & external jobs | Document clear boundary | Open |
| `DB-014` | Naming | Low | `exampayment.model.js`, `jobFinder/models/*` | 7 collections | — | Non-`tbl_` names | Inconsistent collection naming | Schema inconsistency | Standardize naming policy | Open |
| `DB-015` | Index | Low | `dailychallenge.model.js`, `studentprogress.model.js` | 2 `tbl_prep_*` | `date`, `student_id` | `unique: true` + `.index()` | Duplicate unique index definitions | Mongoose startup warnings | Remove redundant `.index()` | Open |
| `DB-016` | Code Quality | Low | `jobFinder/jobFinder.controller.js#L28` | `jobpostings` | `active` | Top-level `updateMany` | Mutates DB on module import | Unexpected write on import/tests | Move to explicit startup/migration script | Open |
