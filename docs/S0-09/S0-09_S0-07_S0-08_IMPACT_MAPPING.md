# S0-09 — S0-07 & S0-08 Impact Mapping

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

| Finding / Feature | Affected Files | Primary Owner | Secondary Consumer | Shared-File Conflict? | Blocks Development? |
|---|---|---|---|---|---|
| `AUD-001, 014, 017` + `FE-002` + `FL-003` (`FEAT-007`) | `authMiddleware.js`, `auth.controller.js`, `login.controller.js`, `DashboardLayout.jsx`, `auth_service.dart` | Dev 1 (Backend) / Dev 2 (Clients) | Both | **Yes** (`authMiddleware.js`, `auth.route.js`) | **YES (Wave 1 Blocker)** |
| `AUD-006, 009, 010` + `FE-001, 014` (`FEAT-008`) | `dashboard.route.js`, `contact.route.js`, `payment.route.js`, `App.jsx` | Dev 1 / Dev 2 | Both | **Yes** (`App.jsx`, `payment.route.js`) | **YES (Wave 1 Blocker)** |
| `AUD-007` + `DB-002` + `FL-002` (`FEAT-016`) | `payment.controller.js`, `payment.model.js`, `Plans.jsx`, `plans_screen.dart` | Dev 1 | Dev 2 | **Yes** (`payment.route.js`) | **YES (Razorpay Security)** |
| `AUD-004, 013` (`FEAT-011`) | `auth.route.js`, `student.controller.js`, `student.model.js` | Dev 1 | Dev 2 | **Yes** (`auth.route.js`) | **YES (Public Register)** |
| `AUD-005, 012` + `FL-005` (`FEAT-014`) | `round.route.js`, `interview.controller.js`, `interview_list_screen.dart` | Dev 1 / Dev 2 | Both | **Yes** (`socket.js`) | **YES (Contract Sync)** |
| `AUD-015` + `DB-005` + `FL-006` (`FEAT-015`) | `exam.controller.js`, `exam.model.js`, `ExamPaper.jsx`, `exam_screen.dart` | Dev 1 / Dev 2 | Both | No (Contract sync) | **YES (`exam_id` migration)** |
| `DB-001` + `FL-008` (`FEAT-017`) | `jobFinder/*.model.js`, `job_finder_service.dart` | Dev 1 / Dev 2 | Both | No | **YES (`tbl_user` ref fix)** |
| `FL-001, 004, 022` (`FEAT-020`) | `api_service.dart`, `AndroidManifest.xml`, `Info.plist` | Dev 2 | Dev 1 | **Yes** (`api_service.dart`) | **YES (Transport Sec)** |
| `FEAT-022` & `FEAT-023` (Tests & Migration Runner) | `server/tests/*`, `client/tests/*`, `server/src/migrations/*` | Joint / Dev 1 | Both | No | Prerequisite for safe refactor |
| `FEAT-024` & `FEAT-025` (Notifications & Unified Institute) | `PENDING` + `college.model.js`, `App.jsx`, `constants.js` | Joint (Dev 1 Lead) | Both | **Yes** (High) | **BLOCKED (Missing Step 0A & Migration Plan)** |
