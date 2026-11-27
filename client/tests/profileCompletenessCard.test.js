import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

test("S1-10 web card renders backend completeness contract without client formula duplication", () => {
  const cardSource = fs.readFileSync(
    path.join(ROOT, "src/common/components/ProfileCompletenessCard.jsx"),
    "utf8",
  );

  assert.match(cardSource, /\/profile-completeness\/me/);
  assert.match(cardSource, /\/profile-completeness\/student\/\$\{studentId\}/);
  assert.match(cardSource, /completeness\.missing_items/);
  assert.match(cardSource, /completeness\.recommendations/);
  assert.doesNotMatch(cardSource, /calculateAcademicCompletion|earned_weight\s*=|total_fields/);
});

test("S1-10 web card is wired into StudentDashboard, Profile, and AcademicProfileModal", () => {
  const dashboardSource = fs.readFileSync(
    path.join(ROOT, "src/student/pages/StudentDashboard.jsx"),
    "utf8",
  );
  const profileSource = fs.readFileSync(
    path.join(ROOT, "src/common/pages/Profile.jsx"),
    "utf8",
  );
  const modalSource = fs.readFileSync(
    path.join(ROOT, "src/common/components/AcademicProfileModal.jsx"),
    "utf8",
  );

  assert.match(dashboardSource, /ProfileCompletenessCard/);
  assert.match(profileSource, /ProfileCompletenessCard/);
  assert.match(modalSource, /ProfileCompletenessCard/);
  assert.match(modalSource, /setActiveTab\("completeness"\)/);
});
