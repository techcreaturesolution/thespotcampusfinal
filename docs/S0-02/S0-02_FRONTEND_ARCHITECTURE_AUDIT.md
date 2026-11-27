# S0-02 — Frontend Architecture Audit Report

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Audit Phase:** Step 0 — S0-02 Web Frontend Codebase Audit (Audit Only)  
**Target Directory:** `client/`  
**Date:** 2026-11-26  
**Branch:** `ravi` (no application files modified)

---

## 1. Technology Stack (`client/package.json`)

| Category | Technology | Actual Version | Notes |
|---|---|---|---|
| Framework | React | `^18.3.1` | Functional components + Hooks |
| Language | JavaScript (JSX, ESM) | ES2020+ | No TypeScript (`@types/react` in devDeps only for IDE) |
| Build Tool | Vite | `^6.3.5` | `@vitejs/plugin-react ^4.4.1`, manual chunks (`vendor-core`, `vendor-excel`, `vendor-icons`) |
| Routing | `react-router-dom` | `^6.22.3` | `createBrowserRouter` + `React.lazy` / `Suspense` |
| Styling | Tailwind CSS | `^3.4.4` | `postcss ^8.4.38`, `autoprefixer ^10.4.19`, custom `index.css` utilities |
| HTTP Client | `axios` | `^1.3.6` | Wrapped in `src/utils/customFetch.js` |
| Real-time | `socket.io-client` | `^4.7.5` | Used in `VideoInterview.jsx` (and proctoring) |
| Notifications | `react-toastify` | `^9.1.3` | Global `<ToastContainer />` in `App.jsx` |
| Icons & Animations | `react-icons`, `gsap`, `react-countup`, `react-intersection-observer` | `5.4.0`, `3.15.0`, `6.5.3`, `9.16.0` | — |
| Excel Export/Import | `xlsx` | `^0.18.5` | Used in bulk question upload & exports |
| State Management | React local state + Outlet context | Built-in | **No Redux, Zustand, or TanStack React Query** (contrary to `README.md`) |
| Testing | None | — | No Vitest, Jest, Playwright, or Cypress |

---

## 2. Folder Structure (`client/src/`)

```text
client/src/
├── main.jsx                    # ReactDOM.createRoot + Toastify CSS
├── App.jsx                     # createBrowserRouter (67 routes) + Suspense + ToastContainer
├── index.css                   # Tailwind directives + Glass Geometric utilities + global select overrides
├── utils/
│   ├── customFetch.js          # Axios instance, Bearer token from localStorage, Idempotency-Key cache
│   └── loadScript.js           # Dynamic <script> loader (Razorpay checkout)
├── common/
│   ├── components/ (12)        # DashboardCard, DashboardNavbar, DataTable, Footer, Hero, IconButton, Loading, MobileAppShowcase, Navbar, PageHeader, RefreshButton, SEO
│   └── pages/ (16)             # Landing, SignIn, 4x SignUp*, Forgot/ResetPassword, Profile, DashboardLayout, VideoInterview, ViewPdf, ErrorPage, Legal pages
├── admin/                      # 15 pages (incl. 4 preparation/*) + 8 modal components
├── student/                    # 20 pages (incl. 11 preparation/*) + 1 data helper (jobFinder/india.js)
├── company/                    # 6 pages (1 unrouted: RecruitmentSubscription.jsx) + 2 modal components
├── college/                    # 7 pages + 3 modal components
├── university/                 # 6 pages (1 unrouted: ManageBranch.jsx) + 2 modal components (1 unused: AddBranchModal.jsx)
└── tpo/                        # 4 pages
```

---

## 3. Routing, State & Authentication Architecture

- **Routing (`App.jsx`):** Uses `createBrowserRouter` with `React.lazy` code-splitting for 65 routed pages. **Critical Gap (`FE-001`):** There are **zero route-level role guards** (`ProtectedRoute`). Every `/dashboard/*` route is rendered under `<DashboardLayout />` regardless of `role`.
- **State Management:** No global `AuthContext`. `DashboardLayout.jsx` calls `GET /login/current-user` on mount, stores `user` and `role` in component state, and passes `{ user, role, reloadUser }` via `<Outlet context={...} />`.
- **Authentication & Token Handling (`customFetch.js`):**
  - Sends `withCredentials: true` (for `httpOnly` cookie) **AND** reads `localStorage.getItem("token")` to attach `Authorization: Bearer <token>`.
  - Response interceptor saves `response.data.token` into `localStorage` on login and removes it on `/logout` or `401` (without redirecting on `401`).
- **Idempotency:** `customFetch.js` auto-generates an `Idempotency-Key` header for mutating requests (`POST`/`PUT`/`PATCH`/`DELETE`) with a 3-second in-memory signature cache.
