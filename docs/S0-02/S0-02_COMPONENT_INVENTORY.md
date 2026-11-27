# S0-02 — Component Inventory

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Total Component Files:** 27 (`12` common, `8` admin, `3` college, `2` company, `2` university)

---

## 1. Shared & Reusable Components (`client/src/common/components/`)

| Component | Purpose | Reusability | Limitations / Notes |
|---|---|---|---|
| `DataTable.jsx` | Generic table with client-side search & empty state | **High** | **No pagination**, **no sorting**, horizontal scroll only on mobile |
| `PageHeader.jsx` | Standard page title, icon badge, subtitle, action slot, refresh | **High** | Very clean; widely reused across dashboards |
| `DashboardCard.jsx` | Stat & navigation card with gradient/accent border | **High** | Supports `value`, `label`, `description`, `path` |
| `DashboardNavbar.jsx` | Top bar with mobile menu toggle & user profile link | **High** | Constructs `/dashboard/${role?.toLowerCase()}/profile` |
| `RefreshButton.jsx` | Page/data refresh button | **High** | — |
| `IconButton.jsx` | Standardized icon action button | **High** | — |
| `Loading.jsx` | Full-screen / inline loading spinner | **High** | Used as `Suspense` fallback |
| `SEO.jsx` | Dynamic document `<title>` and `<meta>` tags | **High** | — |
| `Navbar.jsx` | Public landing navigation bar | Medium | Landing/public pages only |
| `Footer.jsx` | Public landing footer | Medium | Landing/public pages only |
| `Hero.jsx` | Landing hero section | Low | Landing page specific |
| `MobileAppShowcase.jsx` | Flutter app promo section | Low | Landing page specific |

---

## 2. Role-Specific Modal Components

| Module | Component | Purpose | Duplication / Status |
|---|---|---|---|
| `admin/components/` | `BulkUploadModal.jsx` | Excel/CSV question import (`/preparation/questions/import`) | Active |
| `admin/components/` | `CreateCategoryModal.jsx` | Subject category CRUD | Active |
| `admin/components/` | `CreateCvTemplateModal.jsx` | CV template create/edit | Active |
| `admin/components/` | `CreateMockTestModal.jsx` | Mock test create/edit | Active |
| `admin/components/` | `CreatePlanModal.jsx` | Subscription plan create/edit | Active |
| `admin/components/` | `CreateQuestionModal.jsx` | Question create/edit | Active |
| `admin/components/` | `CreateSubjectModal.jsx` | Subject create/edit | Active |
| `admin/components/` | `UploadPdfModal.jsx` | PDF study material upload | Active |
| `company/components/` | `CreateJobModal.jsx` | Job & multi-round setup (508 lines) | Active |
| `company/components/` | `CreateExamFromJDModal.jsx` | AI MCQ generation from JD | Active |
| `college/components/` | `AddTpoModal.jsx` | TPO creation/edit | Active |
| `college/components/` | `AddDegreeModal.jsx` | Degree creation/edit | **Duplicated** in `university/components/` |
| `college/components/` | `AddBranchModal.jsx` | Branch creation/edit | **Duplicated** in `university/components/` |
| `university/components/` | `AddDegreeModal.jsx` | Degree creation/edit | Duplicate of `college/components/AddDegreeModal.jsx` |
| `university/components/` | `AddBranchModal.jsx` | Branch creation/edit | **Unused / Dead** (only imported by unrouted `university/pages/ManageBranch.jsx`) |

---

## 3. Missing Shared Primitives
- No shared `<ProtectedRoute />` / `<RoleGuard />` component.
- No React `<ErrorBoundary />` component.
- No shared `<Pagination />` or `<ConfirmDialog />` component (pages use `window.confirm` or inline modals).
