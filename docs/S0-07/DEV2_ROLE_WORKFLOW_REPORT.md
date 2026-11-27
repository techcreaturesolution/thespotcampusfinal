# S0-07 — Dev 2 Role Workflow Report

**Owner:** Dev 2 | **Baseline:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Six-Role Workflow Verification Matrix

| Role | Web Pages | Flutter Screens | Static Wiring (L1–L2) | Runtime E2E (L4–L5) | Verified Gaps |
|---|---|---|---|---|---|
| **Admin** | 15 pages | Web-only | `PARTIALLY_WORKING` | `BLOCKED` | `AllTransactions` missing from sidebar (`FE-014`); no route guard (`FE-001`); backend `/stats/admin-report` & `/payment` lack `Admin` guard (`AUD-006`). |
| **University** | 6 pages (`1` unrouted) | Web-only | `PARTIALLY_WORKING` | `BLOCKED` | `ManageBranch.jsx` unrouted (`FE-013`); backend `university` routes unauthenticated (`AUD-002`). |
| **College** | 7 pages | Web-only | `PARTIALLY_WORKING` | `BLOCKED` | `updateCollege` mass assignment (`AUD-008`); duplicate pages across `college/`/`tpo/`/`university/` (`FE-012`). |
| **TPO** | 4 pages | Web-only | `PARTIALLY_WORKING` | `BLOCKED` | `login.controller.js` ignores `tpo_status` (`AUD-014`); `tpo.route.js` lacks RBAC (`AUD-010`). |
| **Company** | 6 pages (`1` unrouted) | Web-only | `PARTIALLY_WORKING` | `BLOCKED` | `RecruitmentSubscription.jsx` unrouted (`FE-013`); `rounds` lacks backend RBAC (`AUD-005`); `exam_payment.user_id` unique bug (`DB-002`). |
| **Student** | 20 pages | 28 screens | `PARTIALLY_WORKING` | `BLOCKED` | Web & Flutter `Plans` send client `amount` (`FE-003`, `FL-002`); `ExamPaper`/`ExamScreen` send client `trustScore` (`FE-006`, `FL-006`); Flutter `_joinInterview` broken (`FL-005`). |
