# S0-09 — Complete File Inventory

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Repository-Wide Non-Generated File Count (`812` Total)
Excluded build/cache directories: `node_modules/`, `.git/`, `.dart_tool/`, `build/`, `dist/`, `.gradle/`, `Pods/`, `ephemeral/`, `.symlinks/`.

| Category | Total Files | Core Source & Configs | Excluded from Core Ownership (Reason) |
|---|---:|---:|---|
| **Backend (`server/`)** | `298` | **158** | `139` `server/.cache/` (Puppeteer cache) + `1` `server/server.zip` |
| **Web Frontend (`client/`)** | `128` | **115** | `11` `client/public/` (static assets) + `1` `client/.vscode/` + `1` `client/client.zip` |
| **Flutter (`flutter_student_app/`)** | `283` | **52** | `231` platform boilerplate (`android/`, `ios/`, `linux/`, `macos/`, `windows/`, `Assets.xcassets/`, `assets/`, `.idea/`, `App.zip`, `flutter_student_app.zip`, store PNGs, `.iml`) |
| **Root & Governance** | `5` | **3** | `1` `.vscode/` + `1` `flutter_student_app.zip` |
| **Documentation (`docs/`)** | `98` | `0` (Audit Docs) | `98` `S0-01`–`S0-08` audit & architecture docs |
| **TOTAL** | **812** | **328** | **484** non-core / docs / cache / archive files |

---

## 2. Core Source & Config Ownership Reconciliation (`328` Files)

| Ownership Category | Count | Percentage | Scope |
|---|---:|---:|---|
| **Dev 1 Exclusive** | **145** | **44.2%** | Backend modules, models, controllers, services, exclusive middleware/utils/configs |
| **Dev 2 Exclusive** | **155** | **47.3%** | Web pages/components/hooks (`108`) + Flutter screens/widgets/services/configs (`47`) |
| **Shared Files** | **24** | **7.3%** | `12` Dev 1 Primary + `10` Dev 2 Primary + `2` Repo Governance (`README.md`, `.gitignore`) |
| **Protected Files** | **4** | **1.2%** | `server/.env`, `client/.env`, `flutter_student_app/.env`, `.agents/AGENTS.md` |
| **Pending Ownership** | **0** | **0.0%** | All `328` core files assigned |
| **TOTAL CORE FILES** | **328** | **100.0%** | Reconciles to `158 + 115 + 52 + 3 = 328` |
