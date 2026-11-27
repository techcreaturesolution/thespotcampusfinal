# S0-09 — Git Branch and Merge Strategy

**Project:** The Spot Campus (`thespotcampusfinal`) | **Baseline:** Branch `ravi` (`66220d594954ba077cf1d4a709eba3a084a74abc`)

---

## 1. Current Repository Branch State (Read-Only Observed)
- Local branches: `main`, `ravi` (active), `vaibhav`.
- Remote branches: `origin/main`, `origin/ravi`, `origin/vaibhav`, `origin/prachi`, plus 3 `origin/devin/*` branches.
- Working tree has **43** pre-existing `git status --porcelain` entries (do NOT reset/stash/modify).

---

## 2. Recommended Future Branch Architecture (Do Not Create During S0-09)
- `main` — Approved production-ready code only.
- `develop` — Shared integration branch.
- `dev1/backend-foundation` — Dev 1 Wave 1 (`FEAT-022`, `FEAT-023`, `FEAT-007`, `FEAT-008`, `FEAT-021`).
- `dev2/frontend-foundation` — Dev 2 Wave 1 (`FEAT-019`, `FEAT-020`, `FEAT-022`).
- `dev1/feat-<id>-<slug>` & `dev2/feat-<id>-<slug>` — Feature-scoped branches.

---

## 3. Mandatory Two-Developer Git Rules
1. Never work directly on `main`.
2. Never force-push (`--force`) shared branches.
3. Never overwrite another developer's commits.
4. Pull/rebase from `develop` before starting new work.
5. Keep commits small and scoped strictly to owned files (`server/` for Dev 1, `client/` & `flutter_student_app/` for Dev 2).
6. Shared files (`24` registered) require Primary Owner review before merge.
7. Run relevant backend/Web/Flutter checks before PR merge to `develop`.
8. Resolve any merge conflict together with the Primary File Owner; never auto-resolve blindly.
9. Require integration verification on `develop` before merging to `main`.
10. Maintain backward compatibility for shared API contracts during parallel sprints.

## 4. Reference Workflow Commands (For Future Execution Only)
```powershell
git checkout develop && git pull origin develop
git checkout -b dev1/feat-007-auth-hardening   # Dev 1 example
git checkout -b dev2/feat-019-web-error-guard  # Dev 2 example
# After PR review & tests pass:
git checkout develop && git merge --no-ff dev1/feat-007-auth-hardening
```
