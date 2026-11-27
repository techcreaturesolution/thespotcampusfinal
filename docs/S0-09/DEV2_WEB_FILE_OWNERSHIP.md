# Dev 2 — Web Frontend File Ownership

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-09 | **Owner:** Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Web Ownership Summary
- **Total Core Web Files (`client/src/` + `client/` root, excl. `client.zip`, `client/public/`, `.vscode/`):** **115**
- **Dev 2 Exclusive:** **108**
- **Shared Files (Dev 2 Primary Owner):** **6** (`customFetch.js`, `App.jsx`, `DashboardLayout.jsx`, `DataTable.jsx`, `PageHeader.jsx`, `DashboardCard.jsx`)
- **Protected:** **1** (`client/.env`)
- **Static Assets / Editor Excluded from Core Source:** `client/public/` (`11`), `client/.vscode/` (`1`), `client/client.zip` (`1`).

---

## 2. Directory-by-Directory Ownership

| Directory / File | Count | Ownership | Dev 1 Access | Notes |
|---|---:|---|---|---|
| `client/src/App.jsx` | 1 | **Shared (Dev 2 Primary)** | Read-Only | Central React Router (`67` routes) & future `<RoleGuard>` |
| `client/src/utils/customFetch.js` | 1 | **Shared (Dev 2 Primary)** | Review Contract | Imported by `76` files (`215` call sites); Axios client |
| `client/src/utils/loadScript.js` | 1 | **Dev 2 Exclusive** | Read-Only | Razorpay checkout script loader (`FEAT-016`) |
| `client/src/main.jsx`, `index.css` | 2 | **Dev 2 Exclusive** | Read-Only | App bootstrap & Tailwind styles |
| `client/src/common/pages/DashboardLayout.jsx` | 1 | **Shared (Dev 2 Primary)** | Review Contract | Shared auth context & role navigation shell |
| `client/src/common/components/DataTable.jsx`, `PageHeader.jsx`, `DashboardCard.jsx` | 3 | **Shared (Dev 2 Primary)** | Read-Only | Reusable UI primitives (`FEAT-019`) |
| `client/src/common/**` (remaining 24 files) | 24 | **Dev 2 Exclusive** | Read-Only | Shared pages (`SignIn`, `Landing`, `Profile`, `VideoInterview`, etc.) & components |
| `client/src/admin/**` | 23 | **Dev 2 Exclusive** | Read-Only | Admin pages & modals (`FEAT-008`, `FEAT-003`) |
| `client/src/college/**` | 10 | **Dev 2 Exclusive** | Read-Only | College portal (`FEAT-010`, `FEAT-013`) |
| `client/src/company/**` | 8 | **Dev 2 Exclusive** | Read-Only | Company portal (`FEAT-012`, `013`, `014`, `015`) |
| `client/src/student/**` | 21 | **Dev 2 Exclusive** | Read-Only | Student portal, Prep (`26` Web prep pages span `admin`/`student`), Resume |
| `client/src/tpo/**` | 4 | **Dev 2 Exclusive** | Read-Only | TPO portal (`FEAT-010`, `011`, `013`) |
| `client/src/university/**` | 8 | **Dev 2 Exclusive** | Read-Only | University portal (`FEAT-009`, `010`) |
| `client/` root configs (`package.json`, `package-lock.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `index.html`) | 7 | **Dev 2 Exclusive** | Read-Only | Vite/Tailwind/ESLint config (`21` ESLint errors in `FEAT-019`) |
| `client/.env` | 1 | **Protected** | No Access | `VITE_*` secrets/URLs |
