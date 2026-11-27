# S0-12 — DB-004 Duplicate Application Investigation Report

**Project:** The Spot Campus (`thespotcampusfinal`) | **Owner:** Dev 1 | **Status:** **BLOCKED** (Awaiting approval for live DB cleanup)

---

- **Schema & Index:** `server/src/modules/application/application.model.js` defines partial unique `{ student_id: 1, job_id: 1 }`; `002_check_application_duplicates.js` checks duplicates before index creation.
- **Read-Only Live DB Detection (No PII):**
  1. `student_id: 6a200ebfae906940e518e75b`, `job_id: 6a201a9660a94032cf606171` — **3 records** (`6a2124388fe1ad85453b43b4`, `6a2124388fe1ad85453b43b8`, `6a2124388fe1ad85453b44a8`), all `"0"` / `"not_started"`.
  2. `student_id: 6a201501ae906940e518ec96`, `job_id: 6a200993a17adb9853bd93a4` — **5 records** (`6a201565ae906940e518ecaa` has `application_status: "1"`, `round_status: "in_progress"` — **MUST PRESERVE**; other `4` are `"0"` / `"not_started"`).
- **Cleanup, Rollback & Approval:** Archive non-active duplicates to `tbl_applications_archive` after explicit human approval, then run `npm run migrate:up`; rollback restores archived docs and drops `student_id_1_job_id_1`.
