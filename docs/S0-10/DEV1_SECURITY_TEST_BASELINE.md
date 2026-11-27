# Dev 1 — Security Test Baseline (S0-10)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-10 | **Owner:** Dev 1  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Non-Destructive Security Probes Executed (`task-646`)

| Check ID | Test Case | Endpoint | Actual Status & Body | Status |
|---|---|---|---|---|
| `SEC-01` | Missing Auth Cookie/Header | `GET /api/users/current-user` | `401` `{"msg":"authentication invalid"}` (`109 ms`) | **PASS** |
| `SEC-02` | Invalid JWT Token | `GET /api/users/current-user` (`Cookie: token=bad.jwt.tok`) | `401` `{"msg":"authentication invalid"}` (`37 ms`) | **PASS** |
| `SEC-03` | Unauthenticated Dashboard Stats | `GET /api/stats` | `401` `{"msg":"authentication invalid"}` (`216 ms`) | **PASS** |
| `SEC-04` | Missing Required Fields (Login) | `POST /api/auth/login` (`{}`) | `400` `{"msg":"Validation failed: ..."}` (`1772 ms`) | **PASS** |
| `SEC-05` | Missing Required Fields (Contact) | `POST /api/contact` (`{}`) | `400` `{"msg":"Validation failed: ..."}` (`196 ms`) | **PASS** |

## 2. Known Unfixed Security Findings (Carry-Forward from S0-07/S0-08)
- `AUD-001` (`*_status` login check), `AUD-002..006` (missing `authorizePermissions` on University/College/Student/Round/Dashboard routes), `AUD-007` (client-supplied Razorpay amount), `AUD-011` (`DELETE /api/upload/:filename`), `AUD-013` (`/api/register`), `AUD-015` (`isCorrect` leak) remain unfixed per S0-10 No-Fix Rule.
