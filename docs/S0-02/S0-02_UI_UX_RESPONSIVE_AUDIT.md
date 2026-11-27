# S0-02 — UI/UX & Responsive Audit Report

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Scope:** Design system, layout responsiveness (Desktop/Laptop/Tablet/Mobile), forms, tables, navigation, and accessibility.

---

## 1. Design System & UI Consistency

- **Palette & Tokens (`tailwind.config.js`, `index.css`):** Consistent "Glass Geometric" theme using Indigo/Blue (`#3730a3`, `#2563eb`), Slate neutrals (`#f8f9ff`, `#0b1c30`), `Inter` font family, and shared `.glass-panel`, `.vibrant-btn`, `.text-gradient`, `.glow-soft` utilities.
- **Shared Chrome:** `DashboardLayout.jsx`, `DashboardNavbar.jsx`, `PageHeader.jsx`, `DashboardCard.jsx`, and `DataTable.jsx` provide strong visual consistency across all 6 role portals.

---

## 2. Responsive & Layout Audit

| Area | Desktop / Laptop (`lg+`) | Tablet (`md`) | Mobile (`< md`) | Findings / Issues |
|---|---|---|---|---|
| **Sidebar (`DashboardLayout.jsx`)** | Fixed `w-56` or collapsible `lg:w-16` | Hidden off-canvas drawer (`-translate-x-full`) | Slide-over drawer with `FiMenu` toggle | Clean responsive behavior; video interview hides sidebar (`isVideoRoom`). |
| **Tables (`DataTable.jsx`)** | Full width with `px-5 py-4` | Horizontal scroll (`overflow-x-auto`) | Horizontal scroll only | `FE-011`: No pagination; wide tables require horizontal scrolling on mobile. |
| **Forms & Modals** | `grid-cols-1 md:grid-cols-2` | 2-column grid | Single column | `FE-015`: Native HTML5 `required` only; inconsistent phone/password validation vs backend `validationMiddleware.js`. |
| **Global `<select>` (`index.css#L102`)** | Custom SVG arrow + `!important` rules | Same | Same | `FE-016`: Aggressive `!important` overrides on `select` prevent per-component Tailwind overrides. |
| **Navigation (`DashboardLayout.jsx`)** | Role-scoped menu | Same | Same | `FE-014`: `/dashboard/admin/transactions` (`AllTransactions.jsx`) is missing from Admin sidebar. |

---

## 3. UI/UX Findings

| Finding ID | Category | Severity | File Path | Description | Recommendation | Status |
|---|---|---|---|---|---|---|
| `FE-014` | Navigation/UX | Medium | `common/pages/DashboardLayout.jsx#L57-L78` | `AllTransactions` route (`/dashboard/admin/transactions`) is not linked in Admin sidebar | Add "Transactions" link under Admin menu in `DashboardLayout.jsx`. | Open |
| `FE-015` | Forms/Validation | Medium | `common/pages/SignUpStudent.jsx`, `Profile.jsx`, modals | Forms rely on basic HTML5 `required` without schema validation matching backend rules (e.g. password complexity, enrollment regex) | Introduce `zod` or `react-hook-form` with shared validation messages and inline field errors. | Open |
| `FE-016` | CSS/Responsive | Medium | `client/src/index.css#L102-L120`, `DataTable.jsx` | Global `select { ... !important }` overrides; `DataTable` lacks mobile card view & pagination | Scope custom select styles to a class (e.g. `.custom-select`) and add pagination to `DataTable`. | Open |
| `FE-018` | Documentation | Low | `README.md` | `README.md` claims `TanStack React Query` and `Recharts` are used, neither is in `client/package.json` | Update `README.md` to reflect actual stack. | Open |
