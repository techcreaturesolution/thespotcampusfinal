# Dev 2 — Flutter Static Analysis Report (S0-10)

**Project:** The Spot Campus (`thespotcampusfinal`) | **Step:** S0-10 | **Owner:** Dev 2  
**Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Environment & SDK
- **Flutter:** `3.41.9` (channel `stable`) | **Dart:** `3.11.5` | **DevTools:** `2.54.2`.
- **Lint Package:** `flutter_lints: ^3.0.1` (`analysis_options.yaml`).

## 2. Static Analysis Execution (`task-667`)
- **Command:** `dart analyze` (note: `flutter analyze` wrapper hung in PowerShell without output; direct `dart analyze` completed in `110.03s`).
- **Exit Code:** `2`
- **Status:** **FAIL** (`BASE-FL-001`)
- **Actual Output:** `187 issues found.` (includes `deprecated_member_use` on `withOpacity`/`value`, `use_build_context_synchronously`, `prefer_final_fields`, `use_super_parameters`, `prefer_const_constructors`).
