# DB-004: Duplicate Application Resolution Report

**Affected Files:** `server/src/modules/application/application.model.js`, `server/src/migrations/002_check_application_duplicates.js`  
**Status:** **BLOCKED** (Awaiting explicit approval for live DB cleanup)

---

## Read-Only Live DB Duplicate Detection (No PII Exposed)
1. **Group 1:** `student_id: 6a200ebfae906940e518e75b`, `job_id: 6a201a9660a94032cf606171` — **3 records** (`6a2124388fe1ad85453b43b4`, `6a2124388fe1ad85453b43b8`, `6a2124388fe1ad85453b44a8`), all `application_status: "0"`, `round_status: "not_started"`.
   - **Deterministic Strategy:** Keep earliest/primary record `6a2124388fe1ad85453b43b4`; archive the other `2` to `tbl_applications_archive` before deletion.
2. **Group 2:** `student_id: 6a201501ae906940e518ec96`, `job_id: 6a200993a17adb9853bd93a4` — **5 records** (`6a201565ae906940e518ecaa` has `application_status: "1"`, `round_status: "in_progress"`; remaining 4 have `"0"` / `"not_started"`).
   - **Deterministic Strategy:** **Preserve `6a201565ae906940e518ecaa`** (active `in_progress` history); archive/remove the `4` `"0"` duplicates after human approval, then run `npm run migrate:up`.
