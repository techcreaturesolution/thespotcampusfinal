import test from "node:test";
import assert from "node:assert/strict";
import {
  SKILL_PROFICIENCY_LEVELS,
  getProficiencyMeta,
  sortSkillsByProficiency,
  validateAddSkillForm,
  validateUpdateSkillForm,
} from "../src/utils/technicalSkillsValidation.js";

test("validateAddSkillForm enforces skill selection, duplicate check, proficiency, and experience", () => {
  const valid = validateAddSkillForm({
    skillId: "skill-1",
    proficiency: "Advanced",
    yearsOfExperience: "2.5",
    existingSkillIds: ["skill-2"],
  });
  assert.deepEqual(valid, {});

  const duplicate = validateAddSkillForm({
    skillId: "skill-1",
    proficiency: "Beginner",
    yearsOfExperience: "",
    existingSkillIds: ["skill-1"],
  });
  assert.ok(duplicate.skill_id);

  const invalid = validateAddSkillForm({
    skillId: "",
    proficiency: "Invalid",
    yearsOfExperience: "99",
    existingSkillIds: [],
  });
  assert.ok(invalid.skill_id);
  assert.ok(invalid.proficiency);
  assert.ok(invalid.years_of_experience);
});

test("validateUpdateSkillForm enforces proficiency and years bounds", () => {
  assert.deepEqual(
    validateUpdateSkillForm({ proficiency: "Expert", yearsOfExperience: "4" }),
    {},
  );
  const bad = validateUpdateSkillForm({ proficiency: "None", yearsOfExperience: "-2" });
  assert.ok(bad.proficiency);
  assert.ok(bad.years_of_experience);
});

test("SKILL_PROFICIENCY_LEVELS and sortSkillsByProficiency preserve deterministic rank order", () => {
  assert.deepEqual(
    SKILL_PROFICIENCY_LEVELS.map((l) => l.name),
    ["Beginner", "Intermediate", "Advanced", "Expert"],
  );
  assert.equal(getProficiencyMeta("Advanced").order, 3);

  const sample = [
    { id: "1", proficiency: "Beginner", proficiency_order: 1, display_order: 0 },
    { id: "2", proficiency: "Expert", proficiency_order: 4, display_order: 1 },
    { id: "3", proficiency: "Advanced", proficiency_order: 3, display_order: 2 },
  ];
  assert.deepEqual(
    sortSkillsByProficiency(sample, "proficiency_desc").map((s) => s.id),
    ["2", "3", "1"],
  );
  assert.deepEqual(
    sortSkillsByProficiency(sample, "proficiency_asc").map((s) => s.id),
    ["1", "3", "2"],
  );
});
