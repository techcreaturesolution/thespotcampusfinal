# S0-07 — Dev 1 Test Evidence

**Owner:** Dev 1 | **Date:** 2026-11-26

---

## 1. Layer 1–3 Execution Log

| Check | Command | Result | Evidence |
|---|---|---|---|
| **Git Baseline** | `git branch --show-current; git rev-parse HEAD` | Pass | `ravi` / `66220d594954ba077cf1d4a709eba3a084a74abc` |
| **Backend Syntax (All JS)** | `Get-ChildItem server\src -Filter *.js \| node --check` | Pass | `Checked server/src JS files. Syntax errors: 0` |
| **Model Introspection** | `node --input-type=module` (import 38 `.model.js`) | Pass | `39 models, 594 paths, 51 refs, 56 indexes` |
| **Route Extraction** | Static parser on `server/src/app.js` + `*.route.js` | Pass | `30 mounts, 27 files, 4 direct = 217 mounted (216 unique) + 6 unmounted` |
| **Prod Dependency Audit** | `cd server; npm.cmd audit --omit=dev --json` | Executed | `29 vulnerabilities (4 critical, 23 high, 2 moderate)` |
| **Automated Test Suite** | Search for `*test*`/`*spec*` in `server/` | `NOT_IMPLEMENTED` | `0` test files, `0` test scripts in `server/package.json` |
| **Live Runtime / External** | — | `BLOCKED` | No live DB mutation or paid external API calls permitted in S0-07 |
