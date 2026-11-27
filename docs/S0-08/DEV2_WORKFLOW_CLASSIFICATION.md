# S0-08 — Dev 2 User Workflow Classification

**Owner:** Dev 2 | **Scope:** End-to-End Multi-Step User Workflows

| Workflow | Existing Steps | Broken / Missing Steps | Classification |
|---|---|---|---|
| **1. Student Registration → Verification → Profile** | `SignUpStudent` / `RegisterScreen` → `TPO/College verifyStudent` → `Profile` | `/api/register` exposes `GET /` PII; mass assignment on `update-profile` | **ENHANCEMENT** |
| **2. Company → Job → Approval → Student Apply** | `CreateJobModal` → `TPO approveJob` → `OpeningList`/`JobList` → `POST /application/:id` | `createJob` missing role check; duplicate application race condition | **ENHANCEMENT** |
| **3. Application → Shortlisting → Round → Interview** | `CompanyApplications` → `RoundManagement` → `CompanyInterviews` → `VideoInterview` | `/api/rounds/*` has 0 RBAC; Flutter `_joinInterview` URL broken | **ENHANCEMENT** |
| **4. Exam Creation → Attempt → Result** | `CreateExamFromJDModal` → `ExamPaper`/`ExamScreen` → `ExamResult` (Web) | Client `trustScore` trusted; Flutter lacks `ExamResult` screen | **ENHANCEMENT** |
| **5. Payment → Verify → Subscription Activation** | `Plans`/`PlansScreen` → Razorpay → `/payment/verify` → `/payment/check` | Client `amount` sent to backend (`FE-003`, `FL-002`) | **ENHANCEMENT** |
| **6. Preparation → Subscription Gate → Learning** | `requireStudentSubscription` → 11 Web / 11 Flutter screens | Fully wired; runtime E2E blocked in S0-07 | **REUSE** |
