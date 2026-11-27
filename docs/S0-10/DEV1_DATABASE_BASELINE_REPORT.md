# Dev 1 — Database Baseline Report (S0-10)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-10 | **Owner:** Dev 1  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Safe Database Connectivity & Model Verification

| Check ID | Check | Command / Method | Exit | Status | Observed Result |
|---|---|---|---|---|---|
| `DB-CON-01` | MongoDB Connectivity | `mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 5000 })` | `0` | **PASS** | `DB_STATUS:CONNECTED` (URI redacted) |
| `DB-MOD-01` | Mongoose Model Registration | `Object.keys(mongoose.models).length` | `0` | **PASS** | `MODELS:39` (reconciles with S0-04 `39` models) |
| `DB-QRY-01` | Read-Only Query Verification | `GET /api/dropdown/universities` | `0` | **PASS** | `200 OK` (`1899 ms` server), returned live university records |
| `DB-MIG-01` | Migration Runner | Repository inspection | — | **NOT_AVAILABLE** | No migration framework (`BASE-DB-001` / `DB-007`) |

## 2. Non-Destructive Constraints Observed
- Zero migrations, zero collection drops, zero seed scripts, and zero writes executed.
