# S0-04 — Field-Level Schema Dictionary

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Scope:** Complete schema-defined field dictionary across all 39 Mongoose models (excluding implicit `_id`, `createdAt`, `updatedAt` unless explicitly overridden).

---

## 1. Identity & Academic Hierarchy Collections

### `tbl_admins` (`admin.model.js`)
| Field | Type | Req | Default | Unique | Idx | Ref | Purpose / Notes |
|---|---|---|---|---|---|---|---|
| `admin_name` | String | No | — | No | No | — | Admin display name |
| `admin_email` | String | No | — | No | No | — | Login email (`DB-003` missing unique) |
| `admin_password` | String | No | — | No | No | — | Bcrypt hash; stripped in `toJSON()` |
| `admin_image` | String | No | — | No | No | — | Cloudinary URL |
| `admin_imagePublicID` | String | No | — | No | No | — | Cloudinary public ID |
| `role` | String | No | `"Admin"` | No | No | — | Role identifier |

### `tbl_password_resets` (`passwordReset.model.js`)
| Field | Type | Req | Default | Unique | Idx | Ref | Purpose / Notes |
|---|---|---|---|---|---|---|---|
| `email` | String | Yes | — | No | Yes | — | Lowercased, trimmed user email |
| `role` | String | Yes | — | No | No | — | Enum: `Admin, Student, Company, College, University, TPO` |
| `token` | String | Yes | — | Yes | Yes | — | SHA-256 hashed reset token |
| `createdAt` | Date | No | `Date.now` | No | TTL | — | Expires after `3600` seconds |

### `tbl_universities` (`university.model.js`)
| Field | Type | Req | Default | Unique | Idx | Ref | Purpose / Notes |
|---|---|---|---|---|---|---|---|
| `university_establishment` | String | No | — | No | No | — | Establishment year |
| `university_name` | String | No | — | No | No | — | University name |
| `university_email` | String | No | — | No | No | — | Login email (`DB-003`) |
| `university_address` | String | No | — | No | No | — | Physical address |
| `university_contact_no` | String | No | — | No | No | — | Contact phone |
| `university_website` | String | No | — | No | No | — | Website URL |
| `university_logo` / `university_logoPublicID` | String | No | — | No | No | — | Cloudinary logo |
| `university_status` | String | No | `STATUS.ACTIVE` (`"1"`) | No | No | — | Active/Deactive status |
| `university_verified` | String | No | `STATUS.DEACTIVE` (`"0"`) | No | No | — | `"Approved"` / `"Rejected"` / `"0"` |
| `university_password` | String | No | — | No | No | — | Bcrypt hash; stripped in `toJSON()` |
| `role` | String | No | `"University"` | No | No | — | Role identifier |

### `tbl_colleges` (`college.model.js`)
| Field | Type | Req | Default | Unique | Idx | Ref | Purpose / Notes |
|---|---|---|---|---|---|---|---|
| `college_university_id` | ObjectId | No | — | No | No | `tbl_university` | Parent university (`DB-008` missing index) |
| `college_code` | String | No | — | No | No | — | Institution code |
| `college_name`, `college_email`, `college_address`, `college_contact`, `college_website` | String | No | — | No | No | — | Core profile & contact fields |
| `college_logo`, `college_logoPublicID` | String | No | — | No | No | — | Cloudinary logo |
| `college_status`, `college_verified` | String | No | `"1"`, `"0"` | No | No | — | Active status & Admin approval |
| `college_password` | String | No | — | No | No | — | Bcrypt hash; stripped in `toJSON()` |
| `role` | String | No | `"College"` | No | No | — | Role identifier |

### `tbl_degree_masters` (`degreemaster.model.js`), `tbl_degrees` (`degree.model.js`), `tbl_branches` (`branch.model.js`)
- `tbl_degree_masters`: `degree_name` (String, Req), `degree_code` (String, Req), `total_semesters` (Number, Req), `branches[]` (`{ branch_name, branch_code }`, both Req).
- `tbl_degrees`: `college_id` (ObjectId -> `tbl_college`), `degree_name`, `degree_code`, `degree_sem` (all String, optional).
- `tbl_branches`: `degree_id` (ObjectId -> `tbl_degree`), `college_id` (ObjectId -> `tbl_college`), `branch_code`, `branch_name` (String, optional).

### `tbl_tpos` (`tpo.model.js`)
- `tpo_college_id` (ObjectId -> `tbl_college`), `tpo_degree_id` (ObjectId -> `tbl_degree`), `tpo_name`, `tpo_email`, `tpo_contact`, `tpo_image`, `tpo_imagePublicID`, `tpo_status` (`"1"`), `tpo_password` (stripped in `toJSON()`), `role` (`"TPO"`).

### `tbl_companies` (`company.model.js`)
- `company_name`, `company_email`, `company_address`, `company_contact`, `company_website`, `company_logo`, `company_logoPublicID`, `company_verified` (`"0"`), `company_status` (`"1"`), `company_password` (stripped in `toJSON()`), `role` (`"Company"`).

### `tbl_students` (`student.model.js`)
- FKs: `college_id` (`tbl_college`), `university_id` (`tbl_university`), `degree_id` (`tbl_degree`), `branch_id` (`tbl_branch`).
- Fields: `student_enrollment`, `student_name`, `student_email`, `student_contact`, `student_current_sem` (String), `student_total_backlog` (String), `student_skills`, `student_last_marksheet`, `student_last_marksheetPublicID`, `student_image`, `student_imagePublicID`, `student_status` (`"0"`), `isVerifiedByTPO` (Boolean, `false`), `student_password` (stripped in `toJSON()`), `role` (`"Student"`).

---

## 2. Placement, Recruitment, Exam & Interview Collections

### `tbl_jobposts` (`job.model.js`)
- `job_company_id` (ObjectId -> `tbl_company`), `job_title`, `job_position`, `job_type` (enum `JOB_TYPE`, default `Full-Time`), `job_work_mode` (enum `WORK_MODE`, Req), `job_location` (`{ country, state, city }`), `job_skills`, `job_reg_end_date` (String), `job_salary` (String), `job_exp` (String), `job_noofposition` (String), `job_desc`, `job_status` (`"1"`), `approved_colleges[]` (ObjectId -> `tbl_college`), `job_college[]` (`{ job_university_id, job_college_id, job_degree_id, job_branch_id }`), `job_level[]` (`{ level_type, level_name }`), `target_degree` (`Mixed`), `has_multiple_rounds` (Boolean, `false`), `rounds[]` (`{ round_number, round_type, round_name, round_description, is_eliminatory, interview_mode, duration_minutes, status }`).

### `tbl_applications` (`application.model.js`)
- `student_id` (ObjectId -> `tbl_student`), `job_id` (ObjectId -> `tbl_jobpost`), `company_reason`, `student_reason`, `application_current_status` (`"0"`), `application_status` (`"0"`), `student_decision` (`"0"`), `current_round` (Number, `0`), `total_rounds` (Number, `0`), `round_status` (enum `not_started|in_progress|all_cleared|eliminated|withdrawn`), `final_result` (enum `pending|selected|rejected|on_hold|withdrawn`).

### `tbl_exams` (`exam.model.js`) & `tbl_papers` (`paper.model.js`)
- `tbl_exams`: `company_id` (`tbl_company`), `job_id` (`tbl_jobpost`), `title` (Req), `subject` (Req), `noOfQuestion` (Number, Req), `questions[]` (`{ questionText, options[{ optionText, isCorrect }], questionType, difficulty }`), `timeLimit` (Number, Req), `generatedFromJD` (Boolean), `status` (enum `EXAM_STATUS`), `proctoring` (10 config fields), `passingScore` (Number), `instructions` (String).
- `tbl_papers`: `exam_id` (**String**, Req — `DB-005`, relationship **Unverified / Implicit**; no Mongoose `ref`), `student_id` (`tbl_student`), `answers[]` (`{ question_id, selectedOption[] }`), `score` (Number), `proctoring` (`violations[]`, `cameraSnapshots[]`, `totalViolations`, `trustScore`, `autoSubmitted`, `autoSubmitReason`, `startedAt`, `submittedAt`, `totalTimeSpentSeconds`, `browserInfo`, `ipAddress`), `status` (`in_progress|submitted|auto_submitted|evaluated`).

### `tbl_interviews` (`interview.model.js`) & `tbl_candidate_rounds` (`round.model.js`)
- `tbl_interviews`: `job_id` (`tbl_jobpost`, Req), `round_id` (ObjectId, Req), `student_id` (`tbl_student`, Req), `company_id` (`tbl_company`, Req), `candidate_round_id` (`tbl_candidate_round`), `interview_mode`, `scheduled_at` (Date, Req), `duration_minutes` (Number, `60`), `room_id` (String, unique sparse), `meeting_link`, `status` (`INTERVIEW_STATUS`), `started_at`, `ended_at`, `interviewer_notes`, `rating` (1–10), `recommendation`.
- `tbl_candidate_rounds`: `job_id` (`tbl_jobpost`, Req), `student_id` (`tbl_student`, Req), `application_id` (`tbl_application`, Req), `round_id` (ObjectId, Req), `round_number` (Number, Req), `round_type` (String, Req), `status` (`CANDIDATE_ROUND_STATUS`), `score`, `max_score`, `remarks`, `feedback`, `evaluated_by` (`tbl_company`), `started_at`, `completed_at`.

---

## 3. CV, Payments, Preparation, Contact, Idempotency & JobFinder

- **CV (`tbl_cv_templates`, `tbl_resumes`):** `tbl_cv_templates` (`name`, `html_content`, `css_content`, `thumbnail`); `tbl_resumes` (`student_id` unique -> `tbl_student`, `punch_line`, `linkedin`, `github`, `portfolio`, `education[]`, `skills[]`, `projects[]`, `experience[]`, `languages[]`, `certifications[]`, `selected_template`, `selected_template_id` -> `tbl_cv_template`, `font_family`, `color_theme`, `layout_columns`, `page_margin`, `ai_compiled_html`, `ai_compiled_css`, `ai_summaries[]`, `chosen_summary`).
- **Payments (`tbl_payments`, `exam_payments`, `tbl_recruitment_plans`, `tbl_recruitment_subscriptions`):** Razorpay order/payment/signature fields, plan metadata (`plan_for`: `company|student`, `price`, `validity_days`, `features{}`), `expires_at`, `is_active`.
- **Preparation (9 `tbl_prep_*` collections):** Subjects, categories, questions (`options[]`, `correct_option_index`, `difficulty`, `is_previous_year`), mock tests, test attempts (`answers[]`, `score`, `accuracy`), daily challenges (`date` unique), bookmarks (`item_type`, `item_id`, `notes`), PDF materials, and student progress (`subject_progress[]`, `weekly_activity[]`, `reading_progress[]`).
- **JobFinder (6 collections):** `JobPosting` (46 paths, `key` unique, `dedupeKey`, `origin`, `verification{}`, `postedBy` -> `tbl_user`), `JobSearch` (`owner` -> `tbl_user`, `jobs[]` -> `JobPosting`), `AutoImportRule` (`createdBy` -> `tbl_user`), `AgentRun` (`rule`, `user` -> `tbl_user`), `SearchCache` (`_id: String`, `jobs[]`), `JobFinderSettings` (`_id: 'global'`, `updatedBy` -> `tbl_user`).
- **System (`tbl_contacts`, `tbl_idempotency_keys`):** Contact inquiries and 24h TTL idempotency cache (`key` unique).
