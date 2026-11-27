import { PROFILE_VISIBILITY } from "../../utils/constants.js";

export const PROFILE_POLICY_VERSION = "S1-11.v1";

export const PROFILE_VISIBILITY_META = Object.freeze([
  {
    code: PROFILE_VISIBILITY.PRIVATE,
    label: "Private",
    description:
      "Only you and authorized platform administrators can access full profile policy state. Hidden from public discovery and external recruiters.",
    requires_publishable: false,
  },
  {
    code: PROFILE_VISIBILITY.INSTITUTE_ONLY,
    label: "Institute Only",
    description:
      "Visible to authorized faculty, TPO, and college/university staff within your own affiliated institute boundaries.",
    requires_publishable: true,
  },
  {
    code: PROFILE_VISIBILITY.PUBLIC,
    label: "Public",
    description:
      "Discoverable via public profile directory and accessible to external viewers/recruiters using the strict public allowlist.",
    requires_publishable: true,
  },
]);

export const SECTION_NAVIGATION_ACTIONS = Object.freeze({
  basic_identity: {
    label: "Fix Basic Identity",
    web_path: "/dashboard/student/profile",
    mobile_route: "/profile",
  },
  academic_profile: {
    label: "Fix Academic Profile",
    web_path: "/dashboard/student/academic-profile",
    mobile_route: "/academic-profile",
  },
  technical_skills: {
    label: "Manage Technical Skills",
    web_path: "/dashboard/student/skills",
    mobile_route: "/skills",
  },
  projects: {
    label: "Manage Projects",
    web_path: "/dashboard/student/projects",
    mobile_route: "/projects",
  },
  certifications: {
    label: "Manage Certifications",
    web_path: "/dashboard/student/certifications",
    mobile_route: "/certifications",
  },
  internships: {
    label: "Manage Internships",
    web_path: "/dashboard/student/internships",
    mobile_route: "/internships",
  },
  resume_readiness: {
    label: "Manage Resumes & Documents",
    web_path: "/dashboard/student/documents",
    mobile_route: "/documents",
  },
});

/**
 * Explicit allowlist policy for anonymous / external public profile views.
 * Sensitive contact, internal institute identifiers, backlogs, audit logs,
 * private attachments, and private resume documents are intentionally excluded.
 */
export const PUBLIC_PROFILE_ALLOWLIST = Object.freeze({
  included_fields: [
    "id",
    "student_name",
    "degree_name",
    "branch_name",
    "academic_batch",
    "expected_graduation_year",
    "verified_by_institute",
    "visibility",
    "published_at",
    "skills",
    "projects_public",
    "certifications_public_metadata",
    "internships_public",
  ],
  excluded_sensitive_fields: [
    "student_email",
    "student_contact",
    "student_enrollment",
    "student_total_backlog",
    "institute_id",
    "university_id",
    "documents",
    "certificate_file",
    "resume_versions_private",
    "audit_logs",
    "student_password",
  ],
});
