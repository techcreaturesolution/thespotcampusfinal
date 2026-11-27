export const RESUME_SECTION_META = [
  { key: "summary", label: "Professional Summary" },
  { key: "skills", label: "Technical Skills" },
  { key: "projects", label: "Projects Portfolio" },
  { key: "internships", label: "Internship Experience" },
  { key: "certifications", label: "Certifications & Credentials" },
  { key: "education", label: "Academic Education" },
];

export const RESUME_FONT_OPTIONS = [
  "Inter",
  "Outfit",
  "Playfair Display",
  "Roboto",
];

export const RESUME_LAYOUT_OPTIONS = [
  { code: "two_column_left", label: "Two Column (Left Sidebar)" },
  { code: "two_column_right", label: "Two Column (Right Sidebar)" },
  { code: "single_column", label: "Single Column Classic" },
];

export const RESUME_MARGIN_OPTIONS = ["small", "medium", "large"];

export const RESUME_STATUS_OPTIONS = ["Active", "Archived"];

export const RESUME_VISIBILITY_OPTIONS = [
  "Private",
  "Institute Only",
  "Public",
  "Shared",
];

export const validateResumeVersionForm = (form) => {
  const errors = {};
  const name = String(form.name || "").trim();

  if (name.length < 2 || name.length > 120) {
    errors.name = "Resume name must be between 2 and 120 characters";
  }

  if (form.target_role && String(form.target_role).trim().length > 120) {
    errors.target_role = "Target role must not exceed 120 characters";
  }

  if (form.description && String(form.description).trim().length > 500) {
    errors.description = "Description must not exceed 500 characters";
  }

  if (form.summary && String(form.summary).trim().length > 2000) {
    errors.summary = "Summary must not exceed 2000 characters";
  }

  if (form.color_theme && !/^#[0-9a-fA-F]{6}$/.test(String(form.color_theme).trim())) {
    errors.color_theme = "Color theme must be a valid 6-digit hex color";
  }

  if (form.font_family && !RESUME_FONT_OPTIONS.includes(form.font_family)) {
    errors.font_family = "Select a valid font family";
  }

  if (
    form.layout_columns &&
    !RESUME_LAYOUT_OPTIONS.some((l) => l.code === form.layout_columns)
  ) {
    errors.layout_columns = "Select a valid layout style";
  }

  if (form.page_margin && !RESUME_MARGIN_OPTIONS.includes(form.page_margin)) {
    errors.page_margin = "Select a valid page margin";
  }

  return errors;
};
