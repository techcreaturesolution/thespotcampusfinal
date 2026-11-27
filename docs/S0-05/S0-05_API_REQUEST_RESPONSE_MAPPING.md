# S0-05 — Request & Response Schema Mapping

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Scope:** Global headers, validation middleware, file uploads, response envelopes, and error formats.

---

## 1. Global Request Pipeline (`server/src/app.js`)

1. **Headers:** `Content-Type: application/json` (10MB limit) or `multipart/form-data`; `Authorization: Bearer <jwt>` or `Cookie: token=<jwt>`; optional `Idempotency-Key` / `X-Idempotency-Key` (enforced globally on `/api/` via `requireIdempotency`).
2. **Global Sanitization (`sanitizeInput`):** Strips `<script>...</script>` tags and trims strings across `req.body`, `req.query`, `req.params`; `express-mongo-sanitize` strips `$` and `.` keys.
3. **Rate Limiting (`rateLimiter.js`):**
   - `generalLimiter`: 5,000 req / 15 min (`/api/`)
   - `authLimiter`: 30 req / 15 min (`/api/auth`, `/api/login`)
   - `paymentLimiter`: 10 req / 15 min (`/api/order`, `/api/payment`)
   - `searchLimiter`: 30 req / 1 min (`/api/job-finder/search`)

---

## 2. Validation & File Upload Contracts

- **`validationMiddleware.js` (`express-validator`):** Used selectively on `auth.route.js` (`registerValidation`, `loginValidation`), `student.route.js` (`studentValidation`), `job.route.js` (`jobValidation`, `validateIdParam`), `exam.route.js` (`validateExamParam`), `paper.route.js` (`validatePaperParam`), `contact.route.js` (`contactValidation`, `mongoIdValidation`). **Most routes have no schema validation.**
- **`jobFinder` (`zod`):** Uses strict `zod` schemas (`searchSchema`, `portalJobSchema`).
- **File Uploads:**
  - Legacy `multerMiddleware.js` (`uploads/`, 5MB max): Used by `user`, `university`, `college`, `tpo`, `company`, `cvTemplate`, `preparation`.
  - Hardened `fileUploadMiddleware.js` (field-specific dirs, magic-byte image check): Used by `student.route.js` and `upload.route.js`.

---

## 3. Response & Error Envelope Inconsistencies (`API-ISSUE-015`)

- **Success Envelopes Vary by Module:**
  - Core modules: `{ msg, <entity> }` or `{ <entities>: [...] }` (`{ jobs }`, `{ students }`, `{ colleges }`)
  - `exam` / `preparation`: `{ success: true, message, data }` or `{ mockTests }`
  - `jobFinder`: Direct JSON (`{ search }`, `{ items }`, `{ job }`)
- **Error Envelopes Vary:**
  - `errorHandlerMiddleware.js`: `{ msg }` (sanitizes 500s in production)
  - Controller `try/catch` blocks: Many controllers bypass `errorHandlerMiddleware` by returning `res.status(500).json({ error: error.message })` directly, leaking raw error messages even in production!
  - Validation/auth errors: Mix of `{ msg }`, `{ error }`, `{ message }`, `{ success: false, message }`.
