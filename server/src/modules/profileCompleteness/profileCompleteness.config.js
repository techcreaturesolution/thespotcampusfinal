/**
 * Canonical section rules, weights, and navigation metadata for S1-10 Profile Completeness.
 * Core required Student sections sum to 100 points.
 * Optional enhancement sections have weight 0 so empty optional sections never block 100%.
 */
export const PROFILE_COMPLETENESS_FORMULA_VERSION = "S1-10.v1";

export const PROFILE_COMPLETENESS_BANDS = [
  { key: "COMPLETE", min: 100, label: "Complete" },
  { key: "STRONG", min: 75, label: "Strong" },
  { key: "IN_PROGRESS", min: 40, label: "In Progress" },
  { key: "NEEDS_ATTENTION", min: 1, label: "Needs Attention" },
  { key: "EMPTY", min: 0, label: "Empty" },
];

export const PROFILE_COMPLETENESS_SECTIONS = Object.freeze([
  {
    key: "basic_identity",
    title: "Basic Identity & Contact",
    feature_refs: ["S1-01", "Profile"],
    weight: 15,
    required: true,
    is_optional: false,
    applicable_roles: ["Student"],
    criteria_summary: "Full name, primary email address, and valid contact number",
    action: {
      label: "Update Profile",
      web_path: "/dashboard/student/profile",
      mobile_route: "/profile",
    },
  },
  {
    key: "academic_profile",
    title: "Academic Profile & History",
    feature_refs: ["S1-01"],
    weight: 25,
    required: true,
    is_optional: false,
    applicable_roles: ["Student"],
    criteria_summary:
      "University, college, degree, branch, enrollment, current semester, academic year, batch, score, and active academic history",
    action: {
      label: "Complete Academic Profile",
      web_path: "/dashboard/student/academic-profile",
      mobile_route: "/academic-profile",
    },
  },
  {
    key: "technical_skills",
    title: "Technical Skills & Proficiency",
    feature_refs: ["S1-02", "S1-03"],
    weight: 20,
    required: true,
    is_optional: false,
    applicable_roles: ["Student"],
    criteria_summary:
      "At least 3 active canonical technical skills with assigned proficiency levels",
    action: {
      label: "Manage Technical Skills",
      web_path: "/dashboard/student/skills",
      mobile_route: "/skills",
    },
  },
  {
    key: "projects",
    title: "Projects & Repository Links",
    feature_refs: ["S1-04", "S1-05"],
    weight: 20,
    required: true,
    is_optional: false,
    applicable_roles: ["Student"],
    criteria_summary:
      "At least 1 active non-archived project with title, description, and an external repository/demo link",
    action: {
      label: "Manage Projects",
      web_path: "/dashboard/student/projects",
      mobile_route: "/projects",
    },
  },
  {
    key: "resume_readiness",
    title: "Resume Versions & Document Upload",
    feature_refs: ["S1-08", "S1-09"],
    weight: 20,
    required: true,
    is_optional: false,
    applicable_roles: ["Student"],
    criteria_summary:
      "At least 1 active tailored resume version (S1-08) and 1 available uploaded resume document (S1-09)",
    action: {
      label: "Upload or Configure Resume",
      web_path: "/dashboard/student/documents",
      secondary_web_path: "/dashboard/student/resume-versions",
      mobile_route: "/documents",
      secondary_mobile_route: "/resume-versions",
    },
  },
  {
    key: "certifications",
    title: "Certifications",
    feature_refs: ["S1-06"],
    weight: 0,
    required: false,
    is_optional: true,
    applicable_roles: ["Student"],
    criteria_summary: "Optional: Active verified certifications with issuer and issue date",
    action: {
      label: "Add Certifications",
      web_path: "/dashboard/student/certifications",
      mobile_route: "/certifications",
    },
  },
  {
    key: "internships",
    title: "Internship Experience",
    feature_refs: ["S1-07"],
    weight: 0,
    required: false,
    is_optional: true,
    applicable_roles: ["Student"],
    criteria_summary: "Optional: Active internship or industry work experience entries",
    action: {
      label: "Add Internships",
      web_path: "/dashboard/student/internships",
      mobile_route: "/internships",
    },
  },
]);
