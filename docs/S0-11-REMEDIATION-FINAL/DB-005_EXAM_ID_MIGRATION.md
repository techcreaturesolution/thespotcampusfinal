# DB-005: `exam_id` String / ObjectId Migration Plan

**Affected Areas:** `server/src/modules/exam/paper.model.js`, `paper.controller.js`, `003_audit_paper_exam_id.js`  
**Status:** **BLOCKED** (Requires schema contract approval & backup window)

---

## Read-Only DB & Code Findings
- **Live DB (`tbl_papers`):** `45` total documents; **45/45** have `typeof exam_id === "string"`, **45/45** are valid 24-char ObjectId strings (`0` invalid, `0` native `ObjectId`).
- **Controller Dependency:** `paper.controller.js` queries `{ exam_id: req.params.id }` where `req.params.id` is `job_id` (`tbl_exam.findOne({ job_id: req.params.id })`).
- **Safe Migration Plan (Blocked Until Approved):**
  1. Verify MongoDB snapshot/backup before execution.
  2. Confirm whether `tbl_papers.exam_id` should remain `job_id` ref (`tbl_jobpost`) or migrate to `tbl_exam._id`.
  3. Dry-run -> batched `$convert` (`toObjectId`) -> update `paper.controller.js` -> postcondition count check -> rollback via backup/reverse string cast.
