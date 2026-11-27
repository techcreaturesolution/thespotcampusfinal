# Payment Security Report (`AUD-007`, `DB-002`)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Branch:** `s0-11-remediation`

---

- **`payment.controller.js`:** `createOrder` fetches `RecruitmentPlan` (`plan_for: "student", is_active: true`) and uses `plan.price` + `plan.currency`; `verifyPayment` checks order ownership, idempotency (`status === "Paid"`), and `crypto.timingSafeEqual`.
- **`exampayment.controller.js`:** `createExamOrder` uses `Number(process.env.AI_EXAM_PRICE || 499)`; `verifyExamPayment` checks ownership, idempotency, and `crypto.timingSafeEqual`; `verifyExamAccess` enforces `Admin` or owner ID.
- **`exampayment.model.js`:** Removed `unique: true` on `user_id` and added `{ user_id: 1, examId: 1 }` index (`001_fix_exampayment_index.js`).
