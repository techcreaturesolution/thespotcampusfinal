# S0-10 — Build Status Matrix

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-10 | **Owners:** Dev 1 + Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

| Component | Build / Check | Command | Exit Code | Duration | Status | Output / Artifacts |
|---|---|---|---:|---|---|---|
| **Backend (`server/`)** | Build Step | `server/package.json` | — | — | **NOT_APPLICABLE** | Runtime Node.js ESM app |
| **Backend (`server/`)** | Syntax (`153` files) | `node --check` | `0` | ~4s | **PASS** | `0` syntax errors |
| **Backend (`server/`)** | Boot & DB Connect | `import('./src/app.js')` + `mongoose.connect` | `0` | `38.53s` | **PASS** | `39` models registered |
| **Web (`client/`)** | Production Build | `npm.cmd run build` (`vite build`) | `0` | `24.08s` (`21.42s` Vite) | **PASS** | `client/dist/` generated (`vendor-excel` `283.05 kB`) |
| **Web (`client/`)** | ESLint | `npm.cmd run lint` | `1` | `5.48s` | **FAIL** | `21` errors, `88` warnings |
| **Flutter** | Static Analysis | `dart analyze` | `2` | `110.03s` | **FAIL** | `187 issues found.` |
| **Flutter** | Android Debug APK | `flutter build apk --debug --no-pub` | — | `>268s` | **BLOCKED** | Hung without progress (`task-682` cancelled) |
| **Flutter** | Android Release APK | — | — | — | **NOT_EXECUTED** | Skipped after debug build blocked |
| **Flutter** | iOS Build | — | — | — | **BLOCKED** | Windows host (no macOS/Xcode) |
