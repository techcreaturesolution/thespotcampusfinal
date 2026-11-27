# S0-12 — API Contract Verification

**Project:** The Spot Campus (`thespotcampusfinal`) | **Owners:** Dev 1 + Dev 2

---

- **Canonical Contracts Verified:** `217` mounted routes (`30` `app.use` + `4` direct) + `6` unmounted `session` routes (`server/src/app.js`).
- **Auth & Registration:** `POST /api/login` (multi-role), `POST /api/auth/register` (`Admin` RBAC), `POST /api/register` (isolated `createStudent` only).
- **Cross-Platform Fixes Verified:** `interview_list_screen.dart` `_joinInterview` aligned to `/dashboard/video-interview/:roomId`; `job_finder_service.dart` unified on `ApiService` (Dio).
- **Remaining Contract Blocker:** `DB-005` (`tbl_papers.exam_id` `String` vs `ObjectId` ref target) & `FEAT-025` (`/api/institute/*` pending Migration Plan).
