# Migration Runner Report (`FEAT-023`)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Branch:** `s0-11-remediation`

---

- **Files Created:** `server/src/migrations/migration.model.js`, `runner.js`, `001_fix_exampayment_index.js`, `002_check_application_duplicates.js`, `003_audit_paper_exam_id.js`.
- **NPM Scripts (`server/package.json`):** `migrate:status`, `migrate:dry-run`, `migrate:up`, `migrate:rollback`.
- **Live Dry-Run Output (`npm.cmd run migrate:dry-run`, exit `0`):**
  - `001_fix_exampayment_index`: `WOULD_DROP_user_id_1_AND_CREATE_COMPOUND` (`precondition.ok: true`)
  - `002_check_application_duplicates`: `BLOCKED_BY_EXISTING_DUPLICATES` (`duplicateSampleCount: 2`)
  - `003_audit_paper_exam_id`: `WOULD_AUDIT_45_PAPERS`
