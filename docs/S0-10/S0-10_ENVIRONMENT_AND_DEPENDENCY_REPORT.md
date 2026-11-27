# S0-10 — Environment and Dependency Report

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-10 | **Owners:** Dev 1 + Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

| Tool / Runtime | Measured Version / Path | Status | Notes |
|---|---|---|---|
| **OS / Shell** | Windows / PowerShell | Active | `npm.ps1` blocked by ExecutionPolicy; use `npm.cmd` |
| **Node.js** | `v22.23.5` | **PASS** | Compatible with `server/` ESM & `client/` Vite 6 |
| **npm** | `11.11.0` (`npm.cmd`) | **PASS** | `server/package-lock.json` & `client/package-lock.json` untouched |
| **Flutter SDK** | `3.41.9` (`channel stable`) | **PASS** | Installed; `flutter analyze` hung, `dart analyze` ran |
| **Dart SDK** | `3.11.5` (`DevTools 2.54.2`) | **PASS** | `pubspec.yaml` constraint `>=3.0.0 <4.0.0` |
| **Java / JDK** | `21.0.12` LTS (HotSpot 64-Bit) | **PASS** | Installed |
| **Android SDK** | `C:\Users\Ravi\AppData\Local\Android\Sdk` (`adb.exe` present) | **PASS** | `gradlew.bat` present; headless `flutter build apk` hung |
| **Xcode / macOS** | Unavailable | **BLOCKED** | Windows host cannot build iOS |
| **MongoDB** | Live Atlas/Remote via `server/.env` | **PASS** | Connected cleanly (`39` Mongoose models) |
