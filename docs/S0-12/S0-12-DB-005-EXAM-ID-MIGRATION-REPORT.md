# S0-12 — DB-005 Exam ID Migration Report

**Project:** The Spot Campus (`thespotcampusfinal`) | **Owner:** Dev 1 | **Status:** **BLOCKED** (Requires contract & backup approval)

---

- **Current Schema & Live DB (`tbl_papers`):** `paper.model.js` stores `exam_id` as `String`; all **45/45** live documents hold valid 24-char ObjectId strings (`0` invalid, `0` native `ObjectId`).
- **API Dependency:** `paper.controller.js` queries `{ exam_id: req.params.id }` where `req.params.id` is `job_id` (`tbl_exam.findOne({ job_id: req.params.id })`).
- **Migration & Rollback Plan:** Confirm target reference (`tbl_jobpost` vs `tbl_exam._id`), take MongoDB snapshot, run dry-run (`003_audit_paper_exam_id.js`), execute batched `ObjectId` cast + update controller queries; rollback via snapshot or string cast.
