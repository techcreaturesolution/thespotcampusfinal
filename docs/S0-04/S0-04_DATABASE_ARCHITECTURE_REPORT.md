# S0-04 — Database Architecture Report

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Task:** S0-04 — Existing Database Schema Mapping (Mapping Only — No Schema Modification)  
**Date:** 2026-11-26  
**Branch:** `ravi`

---

## 1. Database Technology & Stack

- **Database Engine:** MongoDB (NoSQL document store; connected via `MONGO_URL` SRV/standard URI in `server/.env`)
- **ODM:** Mongoose `^7.0.5` (`server/package.json`)
- **SQL / Other Databases:** None. All persistence is in MongoDB (including `sessions` via `connect-mongo` and brute-force store via `express-brute-mongo` in unused `sessionSecurityMiddleware.js`).
- **Connection Architecture (`server/src/config/db.js`):**
  - Overrides Node DNS to `8.8.8.8`, `8.8.4.4`, `1.1.1.1`, `1.0.0.1` with `ipv4first` for MongoDB SRV resolution.
  - `connectToMongoDB()` retries 3 times (3s delay, `serverSelectionTimeoutMS: 5000`, `connectTimeoutMS: 5000`, `socketTimeoutMS: 45000`, `family: 4`).
  - `connected` listener attempts `db.collection('tbl_prep_bookmarks').dropIndex('student_id_1_item_id_1')` (legacy index cleanup).
  - Graceful `SIGINT` shutdown in `server/server.js` closes `mongoose.connection`.

---

## 2. Schema Organization & Mongoose Conventions

- **Total Model Files:** 38 `.model.js` files under `server/src/modules/` exporting **39 Mongoose models**.
- **Naming Conventions:**
  - Core & Preparation modules use `tbl_<entity>` (Mongoose pluralizes to `tbl_<entity>s`, e.g., `tbl_student` -> `tbl_students`, `tbl_prep_question` -> `tbl_prep_questions`).
  - Exceptions (`DB-014`): `exam_payment` -> `exam_payments`, and `jobFinder` models use PascalCase (`AgentRun` -> `agentruns`, `JobPosting` -> `jobpostings`, `JobSearch` -> `jobsearches`, `AutoImportRule` -> `autoimportrules`, `SearchCache` -> `searchcaches`, `JobFinderSettings` -> `jobfindersettings`).
- **Timestamps & Soft-Delete:** All 39 models enable `{ timestamps: true }` (`createdAt`, `updatedAt`). **Zero models** implement soft-delete (`isDeleted` / `deletedAt`) (`DB-011`).
- **Hooks, Virtuals & Discriminators:** **Zero** `.pre()`/`.post()` hooks, **zero** `.virtual()` fields, and **zero** Mongoose discriminators are used. Password redaction is done via `Schema.methods.toJSON` on the 6 auth models.
- **Migrations & Seeding:** **Zero** migration scripts exist (`DB-007`). Only `server/src/scripts/seed.js` exists, which upserts a single Master Admin in `tbl_admin` using `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- **Transactions:** **Zero** `mongoose.startSession()` transactions are used (`DB-006`).
