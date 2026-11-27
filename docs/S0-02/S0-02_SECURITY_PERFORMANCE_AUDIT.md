# S0-02 — Frontend Security & Performance Audit

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Scope:** Defensive security review, dependency audit (`npm audit`), bundle/rendering performance, and error handling.

---

## 1. Security Findings

| Finding ID | Category | Severity | File Path | Description | Evidence | Impact | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|
| `FE-001` | Security/RBAC | Critical | `client/src/App.jsx#L143-L223` | Zero route-level role guards | All `/dashboard/*` routes mount directly under `<DashboardLayout />` without `<ProtectedRoute allowedRoles={...} />` | Any authenticated user can navigate to any other role's UI pages via URL. | Wrap role route groups in a `<RoleGuard allowedRoles={[...]} />` component (alongside backend RBAC). | Open |
| `FE-002` | Security/Auth | Critical | `client/src/utils/customFetch.js#L56-L106` | JWT stored in `localStorage` | `localStorage.setItem("token", response.data.token)` + `Authorization: Bearer` header | Any XSS vulnerability can exfiltrate the JWT from `localStorage`. | Use `httpOnly` cookies exclusively for web SPA auth. | Open |
| `FE-004` | Security/Auth | High | `client/src/utils/customFetch.js#L105-L107` | No redirect/state reset on `401` | `401` interceptor only calls `localStorage.removeItem("token")` | Expired sessions leave authenticated UI visible until manual reload. | Redirect to `/sign-in` and reset auth state on `401`. | Open |
| `FE-005` | Security/Scripts | High | `student/pages/ExamPaper.jsx#L63-L69` | External CDN scripts loaded without SRI | Dynamically loads `tracking-min.js` & `face-min.js` from `cdnjs.cloudflare.com` without `integrity` attribute | Supply-chain / CDN compromise could execute arbitrary JS during proctored exams. | Bundle locally or add `integrity` + `crossOrigin="anonymous"`. | Open |
| `FE-008` | Security/Deps | High | `client/package.json` | 10 prod dependency vulnerabilities | `npm audit --omit=dev --json`: 7 High, 3 Moderate (incl. `@remix-run/router` open redirect) | Known CVEs in client bundle dependencies. | Upgrade `react-router-dom` / `axios` via approved maintenance PR. | Open |
| `FE-021` | Security/XSS | Low | `university/pages/ManageCollege.jsx#L123` | Unvalidated external URL protocol | Prepends `https://` only if `!startsWith("http")`; does not block `javascript:` or `data:` | Potential `javascript:` URI execution if malicious URL is stored. | Validate URL starts with `http://` or `https://` before rendering `<a href>`. | Open |

*(Note: Zero `dangerouslySetInnerHTML` or `eval()` calls were found in `client/src/`. Compiled CV HTML is rendered inside `<iframe srcDoc={...} />` in `ResumeBuilder.jsx` and `CompanyApplications.jsx` — adding `sandbox="allow-same-origin"` is recommended for defense-in-depth.)*

---

## 2. Performance, Architecture & Testing Findings

| Finding ID | Category | Severity | File Path | Description | Evidence | Impact | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|
| `FE-009` | Architecture | High | `client/src/App.jsx` | Missing React `ErrorBoundary` | Only `errorElement: <ErrorPage />` on `/` route; no React `ErrorBoundary` wrapping `Outlet` | Uncaught render exceptions crash the whole SPA to a blank screen. | Add an `ErrorBoundary` around `<DashboardLayout />` `<Outlet />`. | Open |
| `FE-010` | Performance | Medium | `ResumeBuilder.jsx` (1,954L), `VideoInterview.jsx` (1,600L), `ExamPaper.jsx` (1,208L), `Landing.jsx` (991L), `JobFinder.jsx` (976L) | Monolithic oversized components | 5 pages exceed 950–1,950 lines each | Large state trees cause unnecessary re-renders and high maintenance cost. | Split into focused sub-components and custom hooks. | Open |
| `FE-011` | Performance | Medium | `common/components/DataTable.jsx` | No pagination or virtualization | Renders all `filtered` rows into DOM at once | Browser lag with large student/question/transaction lists. | Add client/server pagination to `DataTable.jsx`. | Open |
| `FE-012` | Architecture | Medium | `admin/`, `college/`, `university/`, `tpo/` | Duplicate management pages & modals | `ManageStudent.jsx` (4x), `ManageJob.jsx` (4x), `ManageDegree.jsx` (2x), `AddDegreeModal.jsx` (2x), `AddBranchModal.jsx` (2x) | Bug fixes must be repeated across 2–4 files. | Consolidate into shared role-parameterized components. | Open |
| `FE-013` | Dead Code | Medium | `company/pages/RecruitmentSubscription.jsx`, `university/pages/ManageBranch.jsx`, `university/components/AddBranchModal.jsx` | Unrouted / unused files | Not imported in `App.jsx` | Dead code increases maintenance confusion. | Remove or wire into router if needed. | Open |
| `FE-017` | Testing | Medium | `client/package.json` | Zero automated tests | No test runner, no `*.test.jsx` / `*.spec.jsx` files | No regression safety net for auth, forms, or exams. | Set up Vitest + React Testing Library for critical flows. | Open |
| `FE-019` | Routing | Low | `client/src/App.jsx#L152-L153,L177` | Duplicate `StudentExamResult` routes | Mounted at 3 different paths | Ambiguous navigation URLs. | Standardize to one canonical route per role. | Open |
| `FE-020` | API/UX | Low | `common/pages/Landing.jsx#L71,85` | Contact form lacks client cooldown/captcha | `POST /contact/` submits directly | Susceptible to accidental double-submit/spam. | Add submission cooldown feedback. | Open |
| `FE-022` | Build/Config | Low | `client/` | Missing `.env.example` & untracked `client.zip` | `.env` exists without `.env.example`; `client.zip` untracked | Onboarding friction and repo clutter. | Add `.env.example` and remove `client.zip`. | Open |
