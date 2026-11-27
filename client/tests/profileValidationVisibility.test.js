import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

test("S1-11 web component consumes authoritative profile-policy APIs without duplicating backend rules", () => {
  const cardSource = fs.readFileSync(
    path.join(ROOT, "src/common/components/ProfileValidationVisibilityCard.jsx"),
    "utf8",
  );

  assert.match(cardSource, /\/profile-policy\/me/);
  assert.match(cardSource, /\/profile-policy\/me\/publish/);
  assert.match(cardSource, /\/profile-policy\/me\/unpublish/);
  assert.match(cardSource, /\/profile-policy\/me\/visibility/);
  assert.match(cardSource, /\/profile-policy\/student\/\$\{studentId\}/);
  assert.match(cardSource, /\/profile-policy\/view\/\$\{targetId\}\?preview=/);
  assert.match(cardSource, /confirmPublicTarget/);
  assert.match(cardSource, /Blocking Validation Errors/);
  assert.match(cardSource, /Advisory Warnings/);
  assert.doesNotMatch(cardSource, /college_id/);
});

test("S1-11 web card is integrated into Profile and AcademicProfileModal", () => {
  const profileSource = fs.readFileSync(
    path.join(ROOT, "src/common/pages/Profile.jsx"),
    "utf8",
  );
  const modalSource = fs.readFileSync(
    path.join(ROOT, "src/common/components/AcademicProfileModal.jsx"),
    "utf8",
  );

  assert.match(profileSource, /ProfileValidationVisibilityCard/);
  assert.match(modalSource, /ProfileValidationVisibilityCard/);
  assert.match(modalSource, /setActiveTab\("policy"\)/);
});
