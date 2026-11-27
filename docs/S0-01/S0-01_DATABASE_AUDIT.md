# S0-01 — Database Audit Report

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Database Engine:** MongoDB via Mongoose `^7.0.5`  
**Total Models Audited:** 38 Mongoose models across 38 `.model.js` files  
**Schema Modification Policy:** Read-only audit; zero schema or migration changes performed.

---

## 1. Existing Table / Collection Inventory (38 Models)

### A. Core Identity & Academic Hierarchy (10 Models)
| Model / Collection | File Path | Primary Key | Foreign Keys / Refs | Unique Constraints | Indexes |
|---|---|---|---|---|---|
| `tbl_admin` | `modules/auth/admin.model.js` | `_id` | None | None | None |
| `tbl_password_reset` | `modules/auth/passwordReset.model.js` | `_id` | None | `token` | `email`, TTL `createdAt` (3600s) |
| `tbl_university` | `modules/university/university.model.js` | `_id` | None | None | None |
| `tbl_college` | `modules/college/college.model.js` | `_id` | `college_university_id -> tbl_university` | None | None |
| `tbl_degree_master` | `modules/degree/degreemaster.model.js` | `_id` | Embedded `branches[]` | None | None |
| `tbl_degree` | `modules/degree/degree.model.js` | `_id` | `college_id -> tbl_college` | None | None |
| `tbl_branch` | `modules/branch/branch.model.js` | `_id` | `degree_id -> tbl_degree`, `college_id -> tbl_college` | None | None |
| `tbl_tpo` | `modules/tpo/tpo.model.js` | `_id` | `tpo_college_id -> tbl_college`, `tpo_degree_id -> tbl_degree` | None | None |
| `tbl_company` | `modules/company/company.model.js` | `_id` | None | None | None |
| `tbl_student` | `modules/student/student.model.js` | `_id` | `college_id`, `university_id`, `degree_id`, `branch_id` | None | None |

### B. Placement, Recruitment, Exams & Interviews (8 Models)
| Model / Collection | File Path | Foreign Keys / Refs | Unique Constraints | Indexes |
|---|---|---|---|---|
| `tbl_jobpost` | `modules/job/job.model.js` | `job_company_id -> tbl_company`, `approved_colleges[]`, `job_college[]` | None | None |
| `tbl_application` | `modules/application/application.model.js` | `student_id -> tbl_student`, `job_id -> tbl_jobpost` | None | `{student_id:1, job_id:1}` (non-unique), `{job_id:1, createdAt:-1}` |
| `tbl_exam` | `modules/exam/exam.model.js` | `company_id -> tbl_company`, `job_id -> tbl_jobpost` | None | None |
| `tbl_paper` | `modules/exam/paper.model.js` | `exam_id` (**String**, no ref!), `student_id -> tbl_student` | None | `{exam_id:1, student_id:1}`, `{student_id:1, createdAt:-1}` |
| `tbl_interview` | `modules/interview/interview.model.js` | `job_id`, `round_id`, `student_id`, `company_id`, `candidate_round_id` | `room_id` (sparse) | `room_id` |
| `tbl_candidate_round` | `modules/interview/round.model.js` | `job_id`, `student_id`, `application_id`, `round_id`, `evaluated_by` | `{job_id:1, student_id:1, round_number:1}` | `{job_id:1, student_id:1, round_number:1}` |
| `tbl_cv_template` | `modules/student/cvTemplate.model.js` | None | None | None |
| `tbl_resume` | `modules/student/resume.model.js` | `student_id -> tbl_student`, `selected_template_id -> tbl_cv_template` | `student_id` | `student_id` |

### C. Payments, Subscriptions, System & Contact (5 Models)
| Model / Collection | File Path | Foreign Keys / Refs | Unique Constraints | Indexes |
|---|---|---|---|---|
| `tbl_payment` | `modules/subscription/payment.model.js` | `user_id -> tbl_student` | `orderId` | `orderId` |
| `exam_payment` | `modules/subscription/exampayment.model.js` | `user_id -> tbl_company` | `user_id` (**BUG**), `orderId` | `user_id`, `orderId` |
| `tbl_recruitment_plan` | `modules/subscription/subscription.model.js` | None | None | None |
| `tbl_recruitment_subscription` | `modules/subscription/subscription.model.js` | `company_id -> tbl_company`, `plan_id -> tbl_recruitment_plan` | `orderId` | `orderId` |
| `tbl_idempotency_key` | `modules/idempotency/idempotency.model.js` | `user_id` (String) | `key` | `key`, TTL `createdAt` (86400s) |
| `tbl_contact` | `modules/contact/contact.model.js` | None | None | None |

*(Note: `subscription.model.js` exports 2 models: `tbl_recruitment_plan` and `tbl_recruitment_subscription`; total models across `server/src` = 38 files, 39 Mongoose schemas/models including `RecruitmentPlan` + `RecruitmentSubscription`.)*

### D. Preparation Module (9 Models)
| Model / Collection | File Path | Unique Constraints | Indexes |
|---|---|---|---|
| `tbl_prep_subject` | `preparation/subject/subject.model.js` | `name` | `name`, `{category:1, is_active:1}` |
| `tbl_prep_subject_category` | `preparation/subject/subjectcategory.model.js` | `name` | `name` |
| `tbl_prep_question` | `preparation/question/question.model.js` | None | `{subject_id:1, difficulty:1}`, `{company_name:1, is_previous_year:1}`, `{is_active:1, difficulty:1}`, `tags` |
| `tbl_prep_mocktest` | `preparation/mocktest/mocktest.model.js` | None | `{test_type:1, is_active:1}`, `company_name`, `subject_id` |
| `tbl_prep_testattempt` | `preparation/mocktest/testattempt.model.js` | None | `{student_id:1, test_type:1}`, `{student_id:1, mock_test_id:1}`, `{student_id:1, status:1}`, `{student_id:1, createdAt:-1}` |
| `tbl_prep_dailychallenge` | `preparation/dailychallenge/dailychallenge.model.js` | `date` (defined twice!) | `date` |
| `tbl_prep_bookmark` | `preparation/bookmark/bookmark.model.js` | `{student_id:1, item_id:1, notes:1}` | `{student_id:1, item_type:1}`, `{student_id:1, item_id:1, notes:1}` |
| `tbl_prep_pdfmaterial` | `preparation/pdfmaterial/pdfmaterial.model.js` | None | `{category:1, is_active:1}`, `subject_id`, `tags` |
| `tbl_prep_studentprogress` | `preparation/progress/studentprogress.model.js` | `student_id` (defined twice!) | `student_id` |

### E. JobFinder Module (6 Models)
| Model / Collection | File Path | Broken / Notable Refs | Indexes |
|---|---|---|---|
| `AgentRun` | `jobFinder/models/AgentRun.model.js` | `rule -> AutoImportRule`, `user -> tbl_user` (MISSING) | `{agent:1, createdAt:-1}` |
| `AutoImportRule` | `jobFinder/models/AutoImportRule.model.js` | `createdBy -> tbl_user` (MISSING) | None |
| `JobPosting` | `jobFinder/models/JobPosting.model.js` | `importRule -> AutoImportRule`, `postedBy -> tbl_user` (MISSING) | `key` (unique), `dedupeKey`, `origin`, `category`, `level`, `education`, `city`, `state`, `postedAt`, `sourceKey`, `verification.status`, `lastSeenAt`, full-text index |
| `JobSearch` | `jobFinder/models/JobSearch.model.js` | `owner -> tbl_user` (MISSING), `jobs[] -> JobPosting` | `owner`, `status` |
| `SearchCache` | `jobFinder/models/SearchCache.model.js` | `_id: String`, `jobs[] -> JobPosting` | `jobs` |
| `JobFinderSettings` | `jobFinder/models/Settings.model.js` | `_id: String ('global')`, `updatedBy -> tbl_user` (MISSING) | None |

---

## 2. Schema Problems & Findings

| Finding ID | Category | Severity | File Path | Description | Evidence | Impact | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|
| `AUD-019` | Database | High | `server/src/modules/subscription/exampayment.model.js#L5-L10` | `user_id` has `unique: true` | `user_id: { type: ObjectId, ref: "tbl_company", required: true, unique: true }` | A company can never create/pay for a second AI exam. | Remove `unique: true` from `user_id`; use compound index `{ user_id: 1, examId: 1 }`. | Open |
| `AUD-020` | Database | High | `server/src/modules/jobFinder/models/*.model.js` | Dangling `ref: 'tbl_user'` in 5 models | `AgentRun`, `AutoImportRule`, `JobPosting`, `JobSearch`, `Settings` reference `tbl_user` | `tbl_user` model does not exist; `.populate()` fails or returns null. | Align `ref` with actual role models or `userRole` dynamic `refPath`. | Open |
| `AUD-022` | Database | Medium | `server/src/modules/auth/admin.model.js`, `university.model.js`, `college.model.js`, `tpo.model.js`, `company.model.js`, `student.model.js` | Missing `unique: true` on email & enrollment/code fields | No `unique: true` on `*_email`, `student_enrollment`, `college_code` | Race conditions during registration can create duplicate accounts. | Add unique indexes on all email and unique identifier fields. | Open |
| `AUD-023` | Database | Medium | `server/src/modules/application/application.model.js#L61` | Application uniqueness not enforced at DB level | `ApplicationSchema.index({ student_id: 1, job_id: 1 })` lacks `{ unique: true }` | Concurrent requests can create duplicate job applications. | Add `{ unique: true }` after deduplicating existing records. | Open |
| `AUD-024` | Database | Medium | `server/src/modules/exam/paper.model.js#L5-L8` | `exam_id` stored as `String` instead of `ObjectId` | `exam_id: { type: String, required: true }` (also stores `job_id` in controllers) | Breaks referential integrity and `.populate("exam_id")`. | Standardize `exam_id` as `ObjectId` ref `tbl_exam` (with migration). | Open |
| `AUD-025` | Database | Medium | `server/src/modules/*/*.model.js` | Missing indexes on foreign keys | `tbl_student` (`college_id`, `degree_id`), `tbl_college` (`college_university_id`), `tbl_jobpost` (`job_company_id`), `tbl_exam` (`job_id`, `company_id`) have no indexes | Full collection scans as data grows. | Add indexes on all frequently queried foreign keys. | Open |
| `AUD-026` | Database | Medium | `server/src/modules/job/job.model.js`, `student.model.js`, `degree.model.js` | Numeric/Date fields stored as `String` | `job_reg_end_date`, `job_salary`, `job_exp`, `job_noofposition`, `student_current_sem`, `student_total_backlog`, `degree_sem` are `String` | Prevents range queries, sorting, and date comparisons in MongoDB. | Migrate to `Date` / `Number` types in planned schema migration. | Open |
| `AUD-033` | Database | Low | `exampayment.model.js`, `jobFinder/models/*.model.js` | Inconsistent collection naming & overlapping job tables | `exam_payment`, `AgentRun`, `JobPosting` vs `tbl_*`; `JobPosting` overlaps conceptually with `tbl_jobpost` | Confusing schema conventions and potential dual-source job confusion. | Standardize naming convention and document `JobPosting` vs `tbl_jobpost` boundary. | Open |
| `AUD-034` | Database | Low | `dailychallenge.model.js#L26-L28`, `studentprogress.model.js#L109-L111` | Duplicate unique index definitions | `unique: true` on field AND explicit `.index(..., { unique: true })` | Mongoose duplicate index warnings on startup. | Remove redundant `.index()` calls. | Open |

- **Soft-Delete & Migrations:** Zero soft-delete (`isDeleted`/`deletedAt`) support across all 38 models (`findByIdAndDelete` / `deleteMany` perform hard deletes). Zero migration scripts exist (`scripts/seed.js` only).
