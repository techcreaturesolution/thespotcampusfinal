export const SKILL_PROFICIENCY_LEVELS = [
  { code: "BEGINNER", name: "Beginner", order: 1, description: "Foundational understanding and guided usage" },
  { code: "INTERMEDIATE", name: "Intermediate", order: 2, description: "Independent practical application in projects" },
  { code: "ADVANCED", name: "Advanced", order: 3, description: "Deep proficiency and complex problem solving" },
  { code: "EXPERT", name: "Expert", order: 4, description: "Mastery, architecture design, and mentoring" },
];

export const SKILL_PROFICIENCY_OPTIONS = SKILL_PROFICIENCY_LEVELS.map((l) => l.name);

export const getProficiencyMeta = (name, levels = SKILL_PROFICIENCY_LEVELS) => {
  const found = levels.find((l) => l.name === name);
  return found || { code: "INTERMEDIATE", name: name || "Intermediate", order: 2, description: "" };
};

export const sortSkillsByProficiency = (skills = [], sortMode = "display_order") => {
  const copy = [...skills];
  if (sortMode === "proficiency_desc") {
    return copy.sort(
      (a, b) =>
        (b.proficiency_order ?? getProficiencyMeta(b.proficiency).order) -
          (a.proficiency_order ?? getProficiencyMeta(a.proficiency).order) ||
        (a.display_order ?? 0) - (b.display_order ?? 0),
    );
  }
  if (sortMode === "proficiency_asc") {
    return copy.sort(
      (a, b) =>
        (a.proficiency_order ?? getProficiencyMeta(a.proficiency).order) -
          (b.proficiency_order ?? getProficiencyMeta(b.proficiency).order) ||
        (a.display_order ?? 0) - (b.display_order ?? 0),
    );
  }
  return copy.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
};

export const SKILL_CATEGORY_OPTIONS = [
  "Programming Languages",
  "Frameworks",
  "Libraries",
  "Databases",
  "Cloud",
  "DevOps",
  "Mobile",
  "Web",
  "AI/ML",
  "Data",
  "Security",
  "Testing",
  "Tools",
  "Other",
];

export const validateAddSkillForm = ({ skillId, proficiency, yearsOfExperience, existingSkillIds = [] }) => {
  const errors = {};
  if (!skillId) {
    errors.skill_id = "Please select a technical skill from the catalog";
  } else if (existingSkillIds.includes(String(skillId))) {
    errors.skill_id = "This technical skill is already added to the profile";
  }

  if (!proficiency || !SKILL_PROFICIENCY_OPTIONS.includes(proficiency)) {
    errors.proficiency = "Please select a valid proficiency level";
  }

  if (yearsOfExperience !== "" && yearsOfExperience !== null && yearsOfExperience !== undefined) {
    const yrs = Number(yearsOfExperience);
    if (Number.isNaN(yrs) || yrs < 0 || yrs > 50) {
      errors.years_of_experience = "Years of experience must be between 0 and 50";
    }
  }

  return errors;
};

export const validateUpdateSkillForm = ({ proficiency, yearsOfExperience }) => {
  const errors = {};
  if (!proficiency || !SKILL_PROFICIENCY_OPTIONS.includes(proficiency)) {
    errors.proficiency = "Please select a valid proficiency level";
  }
  if (yearsOfExperience !== "" && yearsOfExperience !== null && yearsOfExperience !== undefined) {
    const yrs = Number(yearsOfExperience);
    if (Number.isNaN(yrs) || yrs < 0 || yrs > 50) {
      errors.years_of_experience = "Years of experience must be between 0 and 50";
    }
  }
  return errors;
};
