# Flutter Analyzer Cleanup Report

**Project:** `flutter_student_app/` | **SDK:** Flutter `3.41.9`, Dart `3.11.5`  
**Status:** **PARTIALLY_FIXED** (`187 -> 121` info issues; `0` errors, `0` warnings)

---

- **Actions Executed:**
  - `dart fix --apply`: **37 fixes made in 11 files** (`deprecated_member_use`, `prefer_const_constructors`, `prefer_final_fields`, `use_super_parameters`, etc.).
  - `dart format .`: Formatted all Dart sources cleanly.
- **Remaining `121` `dart analyze` Issues (`FL_ANA_EXIT:2`):**
  - All remaining items are `info`-level diagnostics: `deprecated_member_use` (`.withOpacity()` / Color `.value` in `resume_builder_screen.dart`, `glass_container.dart`, `premium_paywall.dart`, `register_screen.dart`) and `2` `use_build_context_synchronously` infos (`resume_builder_screen.dart:438`, `resume_preview_screen.dart:142`).
  - **0 errors, 0 warnings.** No analyzer rules were disabled.
