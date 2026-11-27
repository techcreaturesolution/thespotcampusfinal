# S0-12 — CI/CD Verification Report

**Project:** The Spot Campus (`thespotcampusfinal`) | **Owners:** Dev 1 + Dev 2

---

- **Workflows Present in `.github/workflows/`:**
  1. `.github/workflows/backend-web-ci.yml`: Runs `npm ci` + `npm test` on `server/`, and `npm ci` + `npm run lint -- --quiet` + `npm test` + `npm run build` on `client/` (Node `22`).
  2. `.github/workflows/mobile-ci.yml`: Runs `flutter pub get` + `dart analyze` + `flutter test` + `flutter build apk --debug` on `ubuntu-latest`, and `flutter build ios --release --no-codesign` on `macos-latest` (Flutter `3.41.9`, Java `21`).
- **Safety:** Neither workflow deploys to production; secrets are not hardcoded.
