# Dev 1 — Test Execution Log (S0-10)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-10 | **Owner:** Dev 1  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

| Verification ID | Component | Command Executed | Environment | Exit Code | Actual Result | Status | Related Issue ID |
|---|---|---|---|---:|---|---|---|
| `BE-SYN-01` | Backend JS | `node --check` on `server/src/**/*.js` + `server/server.js` | Node `v22.23.5`, Win | `0` | `SYNTAX_ERRORS:0` (`153` files) | **PASS** | — |
| `BE-BLD-01` | Backend Build | `server/package.json` inspection | Node `v22.23.5` | — | No build script | **NOT_APPLICABLE** | — |
| `BE-TST-01` | Backend Tests | `server/package.json` inspection | Node `v22.23.5` | — | No test script/suite | **NOT_AVAILABLE** | `BASE-BE-001` (`AUD-032`) |
| `BE-BOOT-01` | Backend Boot + DB | `import('./src/app.js')` + `mongoose.connect` + `server.listen(0)` (`task-646`) | Node `v22.23.5`, MongoDB | `0` | `IMPORT_MS:38533`, `MODELS:39`, `SHUTDOWN:OK` | **PASS** | `BASE-BE-002` (38.5s boot) |
| `API-01..05` | Backend API | Ephemeral `fetch` probes on `127.0.0.1:50079` (`task-646`) | Node `v22.23.5` | `0` | `5/5` safe probes passed (`200`/`400`/`404`) | **PASS** | — |
| `SEC-01..05` | Backend Security | Unauth/bad-JWT/validation probes (`task-646`) | Node `v22.23.5` | `0` | `5/5` safe probes passed (`401`/`400`) | **PASS** | — |
