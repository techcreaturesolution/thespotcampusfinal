# S0-11 — Cross-Platform Readiness Matrix

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

| Integration Pair | Contract Area | Evidence | Status | Required Action |
|---|---|---|---|---|
| **Backend ↔ Web** | `/api/*` proxy, `{ msg }`, CORS | `S0-10` `INT-BW-01` | **PASS** | Maintain contract during `FEAT-007`–`018` |
| **Backend ↔ Flutter** | `Dio` + `http` split, `_joinInterview`, cleartext HTTP | `S0-10` `INT-BF-01`, `BASE-INT-001` | **FAIL** | Fix in Wave 1 (`FEAT-020`, `FEAT-014`) |
| **Web ↔ Flutter ↔ Backend** | Razorpay Payments (`FEAT-016`) | `AUD-007`, `DB-002`, `INT-PAY-01` | **FAIL / NOT_EXECUTED** | Server-side amount + `exam_payment` index fix |
| **Web ↔ Flutter ↔ Backend** | College-to-Institute (`FEAT-025`) | `S0-04`, `S0-08`, `S0-09` | **BLOCKED** | Step 0A Matrix + Migration Plan required |
