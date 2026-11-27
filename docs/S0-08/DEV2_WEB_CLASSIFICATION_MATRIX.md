# S0-08 — Dev 2 Web Frontend Classification Matrix

**Owner:** Dev 2 | **Baseline:** `74` page files (`72` active, `2` unrouted), `67` routes, `27` components, `215` `customFetch` calls (`148` unique `METHOD+path`)

---

## 1. Web Page & Component Classification

| Area / Pages | Existing Implementation | Classification | Required Scope / Justification |
|---|---|---|---|
| **Public & Legal Pages** (`Landing`, `PrivacyPolicy`, `TermsOfService`, `ForgotPassword`, `ResetPassword`, `ViewPdf`) | `common/pages/*` | **REUSE** | Fully functional UI & routes; reuse directly. |
| **Preparation UI** (`15` Admin pages + `11` Student pages + `8` Admin modals) | `admin/pages/preparation/*`, `student/pages/preparation/*` | **REUSE** | Complete UI & API wiring; minor ESLint cleanup (`VER-NEW-001`). |
| **AI CV Builder** (`ResumeBuilder.jsx`, `ManageCvTemplates.jsx`) | `student/pages/ResumeBuilder.jsx` (1,954L) | **ENHANCEMENT** | Reuse core builder; split 1,954L monolith (`FE-010`) and add `iframe sandbox`. |
| **App Shell, Routing & HTTP** (`App.jsx`, `DashboardLayout.jsx`, `customFetch.js`) | `App.jsx`, `DashboardLayout.jsx`, `utils/customFetch.js` | **ENHANCEMENT** | Add `<RoleGuard>` (`FE-001`), `<ErrorBoundary>` (`FE-009`), `AllTransactions` sidebar link (`FE-014`), remove `localStorage` JWT (`FE-002`), add `401` redirect (`FE-004`). |
| **Shared Components** (`DataTable.jsx`, `PageHeader.jsx`, `DashboardCard.jsx`) | `common/components/*` | **ENHANCEMENT** | Reuse `PageHeader` & `DashboardCard`; enhance `DataTable.jsx` with pagination & sorting (`FE-011`). |
| **Role Management Pages** (`ManageStudent` x4, `ManageJob` x4, `ManageDegree` x2, `Applications` x2) | `admin/`, `college/`, `university/`, `tpo/` | **ENHANCEMENT** | Consolidate duplicate role pages into shared parameterized components (`FE-012`); prepare College-to-Institute labels. |
| **Payments & Exams** (`Plans.jsx`, `ExamPaper.jsx`, `ExamResult.jsx`) | `student/pages/*` | **ENHANCEMENT** | Remove client `amount` (`FE-003`), add SRI to CDN scripts (`FE-005`), remove `/rounds/.../advance` from `ExamResult.jsx` (`FE-006`). |
| **Unrouted Dead Pages** (`RecruitmentSubscription.jsx`, `university/ManageBranch.jsx`, `AddBranchModal.jsx`) | `company/pages/`, `university/` | **UNUSED (Deprecate)** | Not routed in `App.jsx` (`FE-013`). |
| **Web Automated Tests** | None | **NEW** | Add Vitest + React Testing Library (`FE-017`). |
