# S0-08 — Implementation Dependency Map

**Project:** The Spot Campus (`thespotcampusfinal`) | **Owners:** Dev 1 + Dev 2 (Joint)

| Feature | Blocking Dependencies (`BLOCKING`) | Required Dependencies (`REQUIRED`) | Independent / Parallel? |
|---|---|---|---|
| `FEAT-007` (Auth & Login) | `AUD-001`, `014`, `017`, `FE-002`, `FL-003` | `FEAT-021` (unique emails) | Must go **FIRST** (Foundation) |
| `FEAT-008` (Admin Portal) | `FEAT-007`, `AUD-006`, `009`, `FE-001` | `FEAT-019` (`DataTable` pagination) | Depends on `FEAT-007` |
| `FEAT-009`, `FEAT-010`, `FEAT-011` (Uni/College/Student) | `FEAT-007`, `AUD-002..004, 008, 010, 013` | `FEAT-001` (Dropdowns) | Depends on `FEAT-007` |
| `FEAT-012`..`FEAT-016` (Recruitment/Exam/Payment) | `FEAT-007`, `AUD-005, 007, 012, 015, 016`, `DB-002, 004, 005` | `FEAT-002` (Idempotency) | Depends on `FEAT-007` & `FEAT-021` |
| `FEAT-017` (JobFinder) | `DB-001` (`tbl_user` ref fix), `FL-008` | OpenAI / SerpAPI keys | Independent after `DB-001` |
| `FEAT-022` (Automated Tests) | None | `FEAT-007`..`021` | Can start **immediately** |
| `FEAT-023` (Migration Runner) | None | `FEAT-021` | Can start **immediately** |
| `FEAT-024` (Notifications) | `FEAT-007` | Firebase/FCM + backend queue | Independent after `FEAT-007` |
| `FEAT-025` (Unified Institute) | `FEAT-010`, `FEAT-023`, Step 0A + Migration Plan Docs | `FEAT-001`, `009`, `011`, `012` | **Blocked** until `FEAT-023` & Docs |
