# S0-11 — Database & Migration Readiness

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

- **Current DB State (`S0-10`):** MongoDB live connection **PASS** (`39` Mongoose models registered across `38` `.model.js` files).
- **Critical Migration Blockers:**
  1. `DB-007` / `BASE-DB-001`: Zero migration runner or rollback history (`FEAT-023` required first).
  2. `DB-002`: `exam_payment.user_id` unique constraint bug (`FEAT-016`).
  3. `DB-005`: `exam_id` String -> `ObjectId` migration (`FEAT-015`).
  4. `DB-004`: Missing unique `{student_id, job_id}` index (`FEAT-013`).
  5. `DB-001`: Broken `tbl_user` refs in `jobFinder` (`FEAT-017`).
  6. `FEAT-025`: `tbl_college` -> `tbl_institute` migration **BLOCKED** (missing Migration Plan).
- **Approval:** **CONDITIONAL** — `FEAT-023` (Migration Runner) approved to build in Wave 1; schema-mutating features wait for `FEAT-023`.
