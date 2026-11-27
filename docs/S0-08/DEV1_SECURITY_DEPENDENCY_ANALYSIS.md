# S0-08 — Dev 1 Security Dependency Analysis

**Owner:** Dev 1 | **Baseline:** `S0-01` (`20` Security-only findings) + `S0-05` (`API-ISSUE-001`–`012`)

---

## 1. Security Prerequisite Gates Before Feature Reuse

> **Rule:** An insecure existing module CANNOT be safely classified as `REUSE` without documenting its blocking security fixes.

| Blocking Finding IDs | Affected Modules / Features | Blocks Reuse? | Prerequisite Action Required |
|---|---|---|---|
| `AUD-001`–`AUD-003`, `AUD-009` | `auth/register`, `university`, `degreeMaster`, `contact` | **Yes** | Add `authenticateUser` + `authorizePermissions("Admin")` before exposing/reusing. |
| `AUD-004`, `AUD-008`, `AUD-013` | `student`, `user`, `college`, `company` | **Yes** | Isolate `/api/register`, whitelist fields, fix `updateStudent` bypass. |
| `AUD-005`, `AUD-006` | `round`, `dashboard`, `payment` | **Yes** | Enforce `Company`/`Admin` on `/api/rounds/*` and `Admin` on reports/payments. |
| `AUD-007` | `payment`, `exampayment` | **Yes** | Compute Razorpay order `amount` strictly server-side. |
| `AUD-015`, `AUD-016` | `exam`, `paper` | **Yes** | Compute `trustScore` server-side; restrict `isCorrect` to `Admin`/owner. |
| `AUD-018` (`29` prod CVEs) | `server/package.json` | **Required** | Run dependency remediation PR. |
