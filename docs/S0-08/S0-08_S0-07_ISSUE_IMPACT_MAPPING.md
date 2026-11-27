# S0-08 — S0-07 Issue Impact Mapping

**Project:** The Spot Campus (`thespotcampusfinal`) | **Owners:** Dev 1 + Dev 2 (Joint)

| S0-07 Issue Group | Affected Features | Blocks Reuse? | Prerequisite for Next Step? | Impact Summary |
|---|---|---|---|---|
| `AUD-001`–`009` (Critical Backend Auth/RBAC/Payment) | `FEAT-007`, `008`, `009`, `010`, `011`, `014`, `016` | **Yes** | **Yes (P0)** | Prevents safe reuse of Admin, University, College, Student, Rounds, and Payment modules until locked down. |
| `AUD-010`–`021` (High Backend IDOR/Proctoring/CVEs) | `FEAT-010`, `011`, `013`, `014`, `015`, `018` | **Yes** | **Yes (P0/P1)** | Exposes resumes, files, exam answers, and client-trusted proctoring scores. |
| `DB-001`–`007` (Critical/High DB) | `FEAT-013`, `015`, `016`, `017`, `021`, `023`, `025` | **Yes** (`001`, `002`) | **Yes (P1)** | `DB-002` blocks 2nd AI exam payment; `DB-001` breaks `jobFinder` populates; `DB-007` blocks safe migrations. |
| `FE-001`–`009`, `VER-NEW-001` (Web Critical/High) | `FEAT-007`, `008`, `014`, `015`, `016`, `019` | **Yes** (`FE-001..003`) | **Yes (P0/P1)** | Missing `<RoleGuard>`, `localStorage` JWT, client `amount`, and 21 ESLint errors. |
| `FL-001`–`009`, `FL-022` (Flutter Critical/High) | `FEAT-007`, `014`, `015`, `016`, `017`, `020` | **Yes** (`FL-001..003, 022`) | **Yes (P0/P1)** | Cleartext HTTP, non-Student login, client `amount`, broken `_joinInterview`, 0 tests. |
