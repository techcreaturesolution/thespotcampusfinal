# S0-04 — Final Database Mapping Report

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Task:** S0-04 — Existing Database Schema Mapping (Mapping Only — No Schema Modification)  
**Date:** 2026-11-26  
**Branch:** `ravi`

---

## 1. Executive Summary & Verified Counts

- **Database Technology:** MongoDB + Mongoose `^7.0.5` (no SQL databases)
- **Total Model Files:** **38** `.model.js` files
- **Total Collections / Models:** **39** Mongoose models
- **Total Schema-Defined Top-Level Paths:** **594** (plus 16 embedded subdocument schemas)
- **Total Top-Level `ref` Relationships:** **51** (plus nested array `ref`s)
- **Total Schema-Level Indexes:** **56** (`schema.indexes()`, across 19 indexed collections; 20 collections have 0 custom indexes)
- **College-Related Models:** **6** (`tbl_college`, `tbl_student`, `tbl_degree`, `tbl_branch`, `tbl_tpo`, `tbl_jobpost`) + 21 backend `.js` files
- **University-Related Models:** **3** (`tbl_university`, `tbl_college`, `tbl_student`) + `tbl_jobpost.job_college`
- **Institute-Related Models:** **0** (`tbl_institute` / `institute_id` does not exist yet)
- **API-to-Database Coverage:** 100% of 27 mounted route groups mapped in `S0-04_API_DATABASE_MAPPING.md`
- **Migration History:** **0** migration scripts (only `server/src/scripts/seed.js` for Master Admin)

---

## 2. Findings Summary (`DB-001` to `DB-016`)

- **Critical:** **2** (`DB-001` broken `tbl_user` ref in 5 `jobFinder` models; `DB-002` `exam_payment.user_id` `unique: true` bug)
- **High:** **5** (`DB-003` missing unique email/code indexes; `DB-004` non-unique application index; `DB-005` `tbl_paper.exam_id` typed as `String`; `DB-006` zero transactions; `DB-007` zero migration history)
- **Medium:** **6** (`DB-008` missing FK indexes; `DB-009` numeric/date fields as `String`; `DB-010` `target_degree` `Mixed`; `DB-011` no soft-delete; `DB-012` missing `required` constraints; `DB-013` dual job schemas)
- **Low / Info:** **3** (`DB-014` naming inconsistency; `DB-015` duplicate unique index defs; `DB-016` top-level `updateMany` on import)
- **Total Findings:** **16**

---

## 3. Database Architecture Readiness & Recommendations

- **Readiness:** **Moderate (Not Ready for Blind Migration).** `preparation` and `jobFinder` modules have good indexing, but core `tbl_*` collections lack unique constraints, FK indexes, transactions, and a migration runner.
- **Recommendations for Next Phase:**
  1. **Fix Critical Schema Bugs First:** Remove `unique: true` on `exam_payment.user_id` (`DB-002`) and resolve `tbl_user` refs in `jobFinder` (`DB-001`).
  2. **Build Versioned Migration Infrastructure (`DB-007`):** Before College-to-Institute migration, introduce idempotent migration scripts with rollback support.
  3. **Add Unique & FK Indexes (`DB-003`, `DB-004`, `DB-008`):** Deduplicate existing records and enforce unique emails/enrollments/applications + FK indexes.
  4. **Plan College-to-Institute Migration Carefully:** Account for all 21 backend files, `tbl_jobpost.approved_colleges[]` + `job_college[]`, and Web/Flutter dropdown dependencies documented in `S0-04_COLLEGE_INSTITUTE_DEPENDENCY_MAP.md`.

---

## 4. Deliverables Index (`docs/S0-04/`)

1. [S0-04_DATABASE_ARCHITECTURE_REPORT.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-04/S0-04_DATABASE_ARCHITECTURE_REPORT.md)
2. [S0-04_COLLECTION_TABLE_INVENTORY.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-04/S0-04_COLLECTION_TABLE_INVENTORY.md)
3. [S0-04_DATABASE_SCHEMA_DICTIONARY.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-04/S0-04_DATABASE_SCHEMA_DICTIONARY.md)
4. [S0-04_DATABASE_RELATIONSHIP_MAPPING.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-04/S0-04_DATABASE_RELATIONSHIP_MAPPING.md)
5. [S0-04_COLLEGE_INSTITUTE_DEPENDENCY_MAP.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-04/S0-04_COLLEGE_INSTITUTE_DEPENDENCY_MAP.md)
6. [S0-04_API_DATABASE_MAPPING.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-04/S0-04_API_DATABASE_MAPPING.md)
7. [S0-04_DATABASE_INDEX_DATA_QUALITY.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-04/S0-04_DATABASE_INDEX_DATA_QUALITY.md)
8. [S0-04_FINAL_DATABASE_MAPPING_REPORT.md](file:///d:/Ravi/Radhe/thespotcampusfinal/docs/S0-04/S0-04_FINAL_DATABASE_MAPPING_REPORT.md)
