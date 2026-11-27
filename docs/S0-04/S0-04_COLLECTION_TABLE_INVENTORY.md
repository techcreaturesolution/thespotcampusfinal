# S0-04 — Complete Collection & Table Inventory

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Total Model Files:** 38 | **Total Collections/Models:** 39 | **Total Top-Level Schema Paths:** 594

| # | Model Name | Actual Collection | File Path | Module | Fields | Refs | Indexes | Timestamps | Soft-Delete | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `tbl_admin` | `tbl_admins` | `modules/auth/admin.model.js` | `auth` | 9 | 0 | 0 | Yes | No | Active |
| 2 | `tbl_password_reset` | `tbl_password_resets` | `modules/auth/passwordReset.model.js` | `auth` | 6 | 0 | 3 | Yes | No | Active |
| 3 | `tbl_university` | `tbl_universities` | `modules/university/university.model.js` | `university` | 15 | 0 | 0 | Yes | No | Active |
| 4 | `tbl_college` | `tbl_colleges` | `modules/college/college.model.js` | `college` | 16 | 1 | 0 | Yes | No | Active |
| 5 | `tbl_degree_master` | `tbl_degree_masters` | `modules/degree/degreemaster.model.js` | `degree` | 7 | 0 | 0 | Yes | No | Active |
| 6 | `tbl_degree` | `tbl_degrees` | `modules/degree/degree.model.js` | `degree` | 7 | 1 | 0 | Yes | No | Active |
| 7 | `tbl_branch` | `tbl_branches` | `modules/branch/branch.model.js` | `branch` | 7 | 2 | 0 | Yes | No | Active |
| 8 | `tbl_tpo` | `tbl_tpos` | `modules/tpo/tpo.model.js` | `tpo` | 13 | 2 | 0 | Yes | No | Active |
| 9 | `tbl_company` | `tbl_companies` | `modules/company/company.model.js` | `company` | 14 | 0 | 0 | Yes | No | Active |
| 10 | `tbl_student` | `tbl_students` | `modules/student/student.model.js` | `student` | 22 | 4 | 0 | Yes | No | Active |
| 11 | `tbl_cv_template` | `tbl_cv_templates` | `modules/student/cvTemplate.model.js` | `student` | 7 | 0 | 0 | Yes | No | Active |
| 12 | `tbl_resume` | `tbl_resumes` | `modules/student/resume.model.js` | `student` | 24 | 2 | 1 | Yes | No | Active |
| 13 | `tbl_jobpost` | `tbl_jobposts` | `modules/job/job.model.js` | `job` | 24 | 2 | 0 | Yes | No | Active |
| 14 | `tbl_application` | `tbl_applications` | `modules/application/application.model.js` | `application` | 14 | 2 | 2 | Yes | No | Active |
| 15 | `tbl_exam` | `tbl_exams` | `modules/exam/exam.model.js` | `exam` | 24 | 2 | 0 | Yes | No | Active |
| 16 | `tbl_paper` | `tbl_papers` | `modules/exam/paper.model.js` | `exam` | 19 | 1 | 2 | Yes | No | Active |
| 17 | `tbl_interview` | `tbl_interviews` | `modules/interview/interview.model.js` | `interview` | 19 | 4 | 1 | Yes | No | Active |
| 18 | `tbl_candidate_round` | `tbl_candidate_rounds` | `modules/interview/round.model.js` | `interview` | 17 | 4 | 1 | Yes | No | Active |
| 19 | `tbl_payment` | `tbl_payments` | `modules/subscription/payment.model.js` | `subscription` | 19 | 1 | 1 | Yes | No | Active |
| 20 | `exam_payment` | `exam_payments` | `modules/subscription/exampayment.model.js` | `subscription` | 12 | 1 | 2 | Yes | No | Partially Used (Bug `DB-002`) |
| 21 | `tbl_recruitment_plan` | `tbl_recruitment_plans` | `modules/subscription/subscription.model.js` | `subscription` | 17 | 0 | 0 | Yes | No | Active |
| 22 | `tbl_recruitment_subscription` | `tbl_recruitment_subscriptions` | `modules/subscription/subscription.model.js` | `subscription` | 16 | 2 | 1 | Yes | No | Partially Used (Company bypass) |
| 23 | `tbl_idempotency_key` | `tbl_idempotency_keys` | `modules/idempotency/idempotency.model.js` | `idempotency` | 8 | 0 | 2 | Yes | No | Active |
| 24 | `tbl_contact` | `tbl_contacts` | `modules/contact/contact.model.js` | `contact` | 8 | 0 | 0 | Yes | No | Active |
| 25 | `tbl_prep_subject` | `tbl_prep_subjects` | `modules/preparation/subject/subject.model.js` | `preparation` | 9 | 0 | 2 | Yes | No | Active |
| 26 | `tbl_prep_subject_category` | `tbl_prep_subject_categories` | `modules/preparation/subject/subjectcategory.model.js` | `preparation` | 5 | 0 | 1 | Yes | No | Active |
| 27 | `tbl_prep_question` | `tbl_prep_questions` | `modules/preparation/question/question.model.js` | `preparation` | 16 | 2 | 4 | Yes | No | Active |
| 28 | `tbl_prep_mocktest` | `tbl_prep_mocktests` | `modules/preparation/mocktest/mocktest.model.js` | `preparation` | 19 | 2 | 3 | Yes | No | Active |
| 29 | `tbl_prep_testattempt` | `tbl_prep_testattempts` | `modules/preparation/mocktest/testattempt.model.js` | `preparation` | 19 | 3 | 4 | Yes | No | Active |
| 30 | `tbl_prep_dailychallenge` | `tbl_prep_dailychallenges` | `modules/preparation/dailychallenge/dailychallenge.model.js` | `preparation` | 7 | 1 | 2 | Yes | No | Active |
| 31 | `tbl_prep_bookmark` | `tbl_prep_bookmarks` | `modules/preparation/bookmark/bookmark.model.js` | `preparation` | 7 | 1 | 2 | Yes | No | Active |
| 32 | `tbl_prep_pdfmaterial` | `tbl_prep_pdfmaterials` | `modules/preparation/pdfmaterial/pdfmaterial.model.js` | `preparation` | 15 | 1 | 3 | Yes | No | Active |
| 33 | `tbl_prep_studentprogress` | `tbl_prep_studentprogresses` | `modules/preparation/progress/studentprogress.model.js` | `preparation` | 16 | 1 | 2 | Yes | No | Active |
| 34 | `AgentRun` | `agentruns` | `modules/jobFinder/models/AgentRun.model.js` | `jobFinder` | 18 | 2 | 1 | Yes | No | Active (Broken `tbl_user` ref) |
| 35 | `AutoImportRule` | `autoimportrules` | `modules/jobFinder/models/AutoImportRule.model.js` | `jobFinder` | 24 | 1 | 0 | Yes | No | Active (Broken `tbl_user` ref) |
| 36 | `JobPosting` | `jobpostings` | `modules/jobFinder/models/JobPosting.model.js` | `jobFinder` | 46 | 2 | 13 | Yes | No | Active (Broken `tbl_user` ref) |
| 37 | `JobSearch` | `jobsearches` | `modules/jobFinder/models/JobSearch.model.js` | `jobFinder` | 21 | 2 | 2 | Yes | No | Active (Broken `tbl_user` ref) |
| 38 | `SearchCache` | `searchcaches` | `modules/jobFinder/models/SearchCache.model.js` | `jobFinder` | 12 | 1 | 1 | Yes | No | Active |
| 39 | `JobFinderSettings` | `jobfindersettings` | `modules/jobFinder/models/Settings.model.js` | `jobFinder` | 16 | 1 | 0 | Yes | No | Active (Broken `tbl_user` ref) |
