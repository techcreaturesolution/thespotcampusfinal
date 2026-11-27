# S0-04 — Database Relationship Mapping

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Total Verified Top-Level `ref` Fields:** 51 (+ nested array `ref`s in `tbl_jobpost.job_college`, `tbl_prep_studentprogress`)

---

## 1. Complete Database ER Diagram

```mermaid
erDiagram
    tbl_university ||--o{ tbl_college : "college_university_id"
    tbl_university ||--o{ tbl_student : "university_id"
    tbl_college ||--o{ tbl_degree : "college_id"
    tbl_college ||--o{ tbl_branch : "college_id"
    tbl_college ||--o{ tbl_tpo : "tpo_college_id"
    tbl_college ||--o{ tbl_student : "college_id"
    tbl_degree ||--o{ tbl_branch : "degree_id"
    tbl_degree ||--o{ tbl_tpo : "tpo_degree_id"
    tbl_degree ||--o{ tbl_student : "degree_id"
    tbl_branch ||--o{ tbl_student : "branch_id"

    tbl_company ||--o{ tbl_jobpost : "job_company_id"
    tbl_company ||--o{ tbl_exam : "company_id"
    tbl_company ||--o{ tbl_interview : "company_id"
    tbl_company ||--o| exam_payment : "user_id (BUG: unique)"
    tbl_company ||--o{ tbl_recruitment_subscription : "company_id"
    tbl_recruitment_plan ||--o{ tbl_recruitment_subscription : "plan_id"

    tbl_jobpost ||--o{ tbl_application : "job_id"
    tbl_jobpost ||--o{ tbl_exam : "job_id"
    tbl_jobpost ||--o{ tbl_candidate_round : "job_id"
    tbl_jobpost ||--o{ tbl_interview : "job_id"

    tbl_student ||--o{ tbl_application : "student_id"
    tbl_student ||--o| tbl_resume : "student_id"
    tbl_cv_template ||--o{ tbl_resume : "selected_template_id"
    tbl_student ||--o{ tbl_paper : "student_id"
    tbl_student ||--o{ tbl_interview : "student_id"
    tbl_student ||--o{ tbl_candidate_round : "student_id"
    tbl_student ||--o{ tbl_payment : "user_id"
    tbl_student ||--o| tbl_prep_studentprogress : "student_id"
    tbl_student ||--o{ tbl_prep_testattempt : "student_id"
    tbl_student ||--o{ tbl_prep_bookmark : "student_id"

    tbl_application ||--o{ tbl_candidate_round : "application_id"
    tbl_candidate_round ||--o| tbl_interview : "candidate_round_id"
```

---

## 2. College / University Relationship Diagram

```mermaid
flowchart TD
    U["tbl_university"] -->|"college_university_id (1:N)"| C["tbl_college"]
    U -->|"university_id (1:N)"| S["tbl_student"]
    C -->|"college_id (1:N)"| D["tbl_degree"]
    C -->|"college_id (1:N)"| B["tbl_branch"]
    C -->|"tpo_college_id (1:N)"| T["tbl_tpo"]
    C -->|"college_id (1:N)"| S
    D -->|"degree_id (1:N)"| B
    D -->|"tpo_degree_id (1:N)"| T
    D -->|"degree_id (1:N)"| S
    B -->|"branch_id (1:N)"| S
    C -.->|"approved_colleges[] (M:N)"| J["tbl_jobpost"]
    C -.->|"job_college[].job_college_id (M:N)"| J
```

---

## 3. Student & Preparation Relationship Diagram

```mermaid
erDiagram
    tbl_prep_subject ||--o{ tbl_prep_question : "subject_id"
    tbl_prep_subject ||--o{ tbl_prep_mocktest : "subject_id"
    tbl_prep_subject ||--o{ tbl_prep_pdfmaterial : "subject_id"
    tbl_prep_subject ||--o{ tbl_prep_testattempt : "subject_id"
    tbl_prep_mocktest ||--o{ tbl_prep_testattempt : "mock_test_id"
    tbl_prep_question }o--o{ tbl_prep_mocktest : "questions[]"
    tbl_prep_question }o--o{ tbl_prep_dailychallenge : "questions[]"
    tbl_student ||--o{ tbl_prep_testattempt : "student_id"
    tbl_student ||--o{ tbl_prep_bookmark : "student_id"
    tbl_student ||--o| tbl_prep_studentprogress : "student_id"
```

---

## 4. Recruitment Pipeline Relationship Diagram

```mermaid
flowchart LR
    Comp["tbl_company"] -->|posts| Job["tbl_jobpost (embedded rounds[])"]
    Stud["tbl_student"] -->|submits| App["tbl_application"]
    Job -->|receives| App
    Job -->|has| Exam["tbl_exam"]
    Stud -->|takes| Paper["tbl_paper (exam_id: String!)"]
    App -->|tracks| CR["tbl_candidate_round"]
    CR -->|schedules| Int["tbl_interview (room_id)"]
```

---

## 5. Referential Integrity Risks
- **`tbl_user` Dangling Ref (`DB-001`):** `AgentRun`, `AutoImportRule`, `JobPosting`, `JobSearch`, `JobFinderSettings` all reference `tbl_user`, which does not exist.
- **`tbl_paper.exam_id` (`DB-005`):** Typed as `String` without `ref`, storing `job_id` instead of `tbl_exam._id`.
- **Hard Deletes Without Transactions (`DB-006`):** `deleteCompany` and `deleteJob` leave orphaned `tbl_paper`, `tbl_interview`, `tbl_candidate_round` records.
