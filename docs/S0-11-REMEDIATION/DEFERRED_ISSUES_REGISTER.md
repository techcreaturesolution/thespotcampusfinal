# Deferred & Blocked Issues Register

**Project:** The Spot Campus (`thespotcampusfinal`) | **Branch:** `s0-11-remediation`

---

| Issue ID | Status | Reason / Evidence | Owner | Target Gate |
|---|---|---|---|---|
| `DB-004` (live dupes) | **PARTIALLY_FIXED** | `002_check_application_duplicates.js` dry-run detected `2` duplicate pairs in live DB; requires manual/approved dedup before `migrate:up` | Dev 1 | Before `FEAT-013` prod deploy |
| `DB-005` (`exam_id` type) | **DEFERRED** | Converting `tbl_papers.exam_id` String -> `ObjectId` requires production DB backup window | Dev 1 | `FEAT-015` / `FEAT-023` |
| `BASE-FL-001` (`187` Dart `info`) | **DEFERRED** | `deprecated_member_use` (`withOpacity`), `use_super_parameters`, `prefer_const_constructors` (non-runtime) | Dev 2 | Wave 2 cleanup |
| `BASE-BE-002` (`38.53s` boot) | **DEFERRED** | Cold `app.js` import latency from `jobFinder`/Puppeteer modules; non-blocking | Dev 1 | Wave 2 perf |
| `BASE-FL-003, 004` | **BLOCKED** | Android headless Gradle hang & Windows host lacking macOS/Xcode | Dev 2 / DevOps | CI / macOS runner |
| `FEAT-024`, `FEAT-025` | **BLOCKED** | Missing Step 0A Matrix, Migration Plan, Notification Spec | Project Lead | Before Wave 3 |
