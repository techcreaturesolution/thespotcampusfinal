# S0-09 — Parallel Development Matrix (`25` Features)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Parallelism Classification Summary (`25` Features)
- **SAFE PARALLEL:** **8** (`FEAT-001`, `FEAT-002`, `FEAT-003`, `FEAT-004`, `FEAT-005`, `FEAT-006`, `FEAT-019`, `FEAT-022`)
- **PARALLEL AFTER CONTRACT APPROVAL:** **11** (`FEAT-009`, `FEAT-010`, `FEAT-011`, `FEAT-012`, `FEAT-013`, `FEAT-014`, `FEAT-015`, `FEAT-016`, `FEAT-017`, `FEAT-018`, `FEAT-020`)
- **SEQUENTIAL:** **4** (`FEAT-007`, `FEAT-008`, `FEAT-021`, `FEAT-023`)
- **BLOCKED:** **2** (`FEAT-024`, `FEAT-025`)
- **Total:** `8 + 11 + 4 + 2 = 25`

---

## 2. Feature-by-Feature Parallel Execution Plan

| Parallel Class | Feature IDs | Dev 1 Work | Dev 2 Work | Sync Gate |
|---|---|---|---|---|
| **SAFE PARALLEL (8)** | `FEAT-001`–`006`, `019`, `022` | Backend Vitest+Supertest (`022`), minor reuse checks (`001`–`006`) | Web `ErrorBoundary`/ESLint (`019`), `DataTable` pagination, Web/Flutter tests (`022`) | Zero shared-file conflict; independent directories |
| **SEQUENTIAL (4)** | `FEAT-007, 008, 021, 023` | `FEAT-023` runner -> `FEAT-007` auth/status fix -> `FEAT-008` Admin RBAC -> `FEAT-021` DB indexes | Waits for `FEAT-007` auth contract before updating `DashboardLayout` & `AuthService` | Must land first in Wave 1 |
| **PARALLEL AFTER CONTRACT APPROVAL (11)** | `FEAT-009`–`018`, `020` | Implement backend RBAC, Razorpay server amount, `exam_id` fix, `tbl_user` fix | Consolidate duplicate Web pages (`010`), fix Flutter `_joinInterview` (`014`), unify `Dio` (`020`), disable cleartext (`020`) | Freeze JSON request/response schema before Dev 2 API wiring |
| **BLOCKED (2)** | `FEAT-024, 025` | `PENDING` (awaiting Step 0A, Migration Plan, Notification spec) | `PENDING` | Do not start until human approval & specs arrive |
