# S0-01 — Technical Debt & Issues

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Scope:** Architecture, Performance, Code Quality, Transactions, Testing, and Documentation debt.

---

## 1. Technical Debt Register (Non-Security / Structural)

| Finding ID | Category | Severity | File Path | Description | Evidence | Impact | Recommendation | Status |
|---|---|---|---|---|---|---|---|---|
| `AUD-027` | Performance | Medium | `university.controller.js#L13`, `college.controller.js#L18`, `paper.controller.js#L43`, `round.controller.js#L129` | N+1 query patterns in loops | `Promise.all(map(... countDocuments))` and sequential `for...of` `findOne`/`findOneAndUpdate` | Linear DB round-trips per record; degrades under load. | Replace with MongoDB `$lookup` aggregations or `bulkWrite` / `$in` batch queries. | Open |
| `AUD-028` | Performance | Medium | `student.controller.js`, `company.controller.js`, `college.controller.js`, `job.controller.js`, `application.controller.js`, `dashboard.controller.js` | Missing pagination on list endpoints | `.find(query)` without `skip`/`limit` | Unbounded response payloads and memory spikes as collections grow. | Add `page`/`limit` pagination with total counts. | Open |
| `AUD-029` | Architecture | Medium | `session.route.js`, `sessionSecurityMiddleware.js`, `config/routes.js`, `login.controller.js` vs `user.controller.js` | Dead code & duplicate implementations | `session.route.js` & `routes.js` unused; `getCurrentUser` duplicated in 2 controllers | Developer confusion and drift between `app.js` and `routes.js`. | Remove `config/routes.js` and `getCurrentUser` duplicate; decide on `session` module. | Open |
| `AUD-030` | Code Quality | Medium | `company.controller.js#L92`, `job.controller.js#L320`, `round.controller.js#L100` | Multi-document mutations without transactions | `deleteCompany`, `deleteJob`, `advanceCandidates` perform sequential writes/deletes | Partial failures leave orphaned `tbl_exam`, `tbl_paper`, `tbl_interview`, `tbl_candidate_round` records. | Wrap multi-collection writes in `mongoose.startSession()` transactions. | Open |
| `AUD-032` | Testing | Medium | `server/package.json` | Zero automated tests | No test runner, no `*.test.js` or `*.spec.js` files in `server/` | Regressions in auth, RBAC, payments, and exams go undetected. | Introduce Vitest/Jest + Supertest for auth, RBAC, and payment integration tests. | Open |
| `AUD-035` | API/Routing | Low | `app.js#L176,191-192`, `jobFinder.route.js#L45-48` | Duplicate route mounts & paths | `LoginRouter` mounted at `/api/login` AND `/api/logout`; `/job/:id` & `/jobs/:id`; `plans/active` mounted twice | Confusing API surface (`POST /api/logout` triggers `login`). | Clean up duplicate mounts and standardize REST paths. | Open |
| `AUD-036` | Code Quality | Low | `server/src/modules/student/cvTemplate.controller.js#L118-L143` | `GET` endpoint mutates DB | `getAllTemplates` iterates templates and calls `await t.save()` | Unexpected write side effects on read requests. | Move template migration to a one-time script (`scripts/`). | Open |
| `AUD-037` | Code Quality | Low | `server/src/modules/jobFinder/jobFinder.controller.js#L28` | Top-level DB write on module import | `JobPosting.updateMany(...).catch(() => {})` at module top level | Executes DB write whenever module is imported (even in tests). | Move to an explicit startup hook or migration script. | Open |
| `AUD-038` | Documentation | Low | `README.md` | Outdated documentation & missing roadmap docs | `README.md` references `backend/`, "14 models"; Step 0A / Migration docs absent | New developers get wrong mental model of the codebase. | Update `README.md` and commit approved Step 0A / Roadmap docs. | Open |

---

## 2. Deployment & Configuration Observations

- **Environment Variables:** `server/.env` contains 39 keys (MongoDB, JWT, Cloudinary, OpenAI, Razorpay, SMTP, and 10+ JobFinder API keys). No `.env.example` exists in `server/`.
- **Error Logging:** `errorHandlerMiddleware.js` writes stack traces to `server_errors.log` with basic regex redaction for Windows paths, `sk-*`, `rzp_*`, and `Bearer *` tokens.
- **Process/Deployment:** No `Dockerfile`, `docker-compose.yml`, or CI/CD `.github/workflows/` found in the repository. Puppeteer Chrome is installed via `postinstall: node install-chrome.js`.
- **Existing Uncommitted Work:** `git status` on branch `ravi` shows modified files in `server/src/` (`errorHandlerMiddleware.js`, `application`, `college`, `company`, `exam`, `paper`, `job`, `preparation`, `student`, `generateMCQs.js`) and `client/` / `flutter_student_app/`.
