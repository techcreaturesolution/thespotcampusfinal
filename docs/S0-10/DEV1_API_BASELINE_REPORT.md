# Dev 1 — API Baseline Report (S0-10)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-10 | **Owner:** Dev 1  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Ephemeral API Probe Results (`127.0.0.1:50079`, `task-646`)

| Probe ID | Method & Path | Expected | Actual Status | Latency | Status |
|---|---|---|---|---:|---|
| `API-01` | `GET /api/test` | `200` JSON health | `200` `{"message":"The Spot Campus Final API v2.0 - Running"}` | `205 ms` | **PASS** |
| `API-02` | `GET /api/dropdown/universities` | `200` JSON list | `200` `{"universities":[...]}` | `2184 ms` | **PASS** |
| `API-03` | `POST /api/auth/login` (`{}`) | `400` validation | `400` `{"msg":"Validation failed: Please provide a valid email address, Password is required"}` | `1772 ms` | **PASS** |
| `API-04` | `POST /api/contact` (`{}`) | `400` validation | `400` `{"msg":"Validation failed: ..."}` | `196 ms` | **PASS** |
| `API-05` | `GET /api/nonexistent-check` | `404` JSON error | `404` `{"msg":"not found"}` | `468 ms` | **PASS** |

## 2. API Baseline Notes
- All **217** mounted routes + **6** unmounted `session` routes from S0-05/S0-07 remain unchanged.
- Note: `server/src/app.js` exports named `{ app, server, io }` (no default export).
- Note: Safe read-only/validation probes passed (`5/5`); mutating, payment, and authenticated role-matrix probes were not executed per S0-10 non-destructive rules.
