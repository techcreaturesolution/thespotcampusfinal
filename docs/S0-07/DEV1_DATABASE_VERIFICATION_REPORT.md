# S0-07 — Dev 1 Database Verification Report

**Owner:** Dev 1 | **Baseline:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)  
**Recalculated Counts (Verified via Mongoose Introspection):** `38` `.model.js` files, **39** Mongoose models/collections, **594** top-level schema paths, **51** top-level `ref` fields, **56** schema-level indexes (`schema.indexes()`).

---

## 1. Database Verification Findings

| Area | Status | Verified Evidence |
|---|---|---|
| **Schema Loading & Syntax** | `WORKING` (L1–L2) | All 38 `.model.js` files import cleanly into Mongoose without syntax or circular-import errors. |
| **`jobFinder` `tbl_user` Refs** | `NOT_WORKING` | 5 models (`AgentRun`, `AutoImportRule`, `JobPosting`, `JobSearch`, `JobFinderSettings`) reference `tbl_user`, which does not exist (`DB-001`). |
| **`exam_payment.user_id` Unique Index** | `NOT_WORKING` | `exampayment.model.js#L5-L10` sets `unique: true` on `user_id`, blocking >1 AI exam purchase per company (`DB-002`). |
| **`tbl_paper.exam_id` Type** | `PARTIALLY_WORKING` | Typed as `String` (`paper.model.js#L5-L8`) with no Mongoose `ref`; stores `job_id` in practice (`DB-005`). |
| **Unique & FK Indexes** | `PARTIALLY_WORKING` | 20 collections have 0 custom indexes (`DB-008`); user emails & `{ student_id, job_id }` lack `unique: true` (`DB-003`, `DB-004`). |
| **Transactions & Migrations** | `NOT_IMPLEMENTED` | 0 `startSession()` transactions (`DB-006`); 0 migration scripts (`DB-007`). |
| **Live DB Data Quality** | `BLOCKED` | Production/dev DB records not queried to obey non-destructive / no-PII-exposure rules. |
