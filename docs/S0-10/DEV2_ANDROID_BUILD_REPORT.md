# Dev 2 — Flutter Android Build Report (S0-10)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-10 | **Owner:** Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Android Environment Verified
- **Java / JDK:** `21.0.12` LTS (`Java HotSpot(TM) 64-Bit Server VM`).
- **Android SDK:** `C:\Users\Ravi\AppData\Local\Android\Sdk` (`ANDROID_HOME`, `ANDROID_SDK_ROOT`, `adb.exe` present).
- **Gradle Wrapper:** `flutter_student_app/android/gradlew.bat` present (`true`).

## 2. Build Verification Results

| Check ID | Build Type | Command | Status | Observed Result |
|---|---|---|---|---|
| `FL-AND-01` | Android Debug APK | `flutter build apk --debug --no-pub --suppress-analytics` (`task-682`) | **BLOCKED** (`BASE-FL-003`) | Command produced no progress after `4m28s` in headless PowerShell session (`task-682` cancelled); not counted as PASS |
| `FL-AND-02` | Android Release APK | — | **NOT_EXECUTED** | Skipped after debug build blocked; release signing/cleartext fix (`FL-001`) pending `FEAT-020` |

## 3. Static Configuration Notes (Not a Build Pass)
- `AndroidManifest.xml` currently retains `android:usesCleartextTraffic="true"` (`FL-001` / `FEAT-020`), to be disabled by Dev 2 in Wave 1.
