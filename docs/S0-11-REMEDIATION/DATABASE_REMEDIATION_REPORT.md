# Database Remediation Report

**Project:** The Spot Campus (`thespotcampusfinal`) | **Branch:** `s0-11-remediation`

---

- **`DB-001` (`jobFinder`):** Replaced `ref: 'tbl_user'` in `AgentRun.model.js`, `AutoImportRule.model.js`, `JobPosting.model.js`, `Settings.model.js` (`tbl_admin`), and `JobSearch.model.js` (`tbl_student`).
- **`DB-002` (`exampayment.model.js`):** Removed `unique: true` on `user_id`, added `{ user_id: 1, examId: 1 }`.
- **`DB-004` (`application.model.js`):** Added partial unique `{ student_id: 1, job_id: 1 }` index; `002_check_application_duplicates.js` dry-run flagged `2` existing duplicate pairs in live DB before any destructive index build.
- **`DB-005` (`paper.model.js`):** Audited `45` papers via `003_audit_paper_exam_id.js`; conversion deferred pending backup window.
