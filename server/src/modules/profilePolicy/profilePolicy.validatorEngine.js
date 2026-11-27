import {
  ACADEMIC_STATUS,
  CERTIFICATION_STATUS,
  DOCUMENT_TYPES,
  INTERNSHIP_STATUS,
  PROFILE_LIFECYCLE_STATES,
  PROFILE_VALIDATION_CODES,
  PROFILE_VISIBILITY_OVERRIDE,
  PROJECT_STATUS,
  RESUME_VERSION_STATUS,
  SKILL_PROFICIENCY,
  VALIDATION_SEVERITY,
} from "../../utils/constants.js";
import {
  calculateUnifiedProfileCompleteness,
  filterValidCertifications,
  filterValidInternships,
  filterValidProjects,
  filterValidResumeDocuments,
  filterValidResumeVersions,
  filterValidSkills,
} from "../profileCompleteness/profileCompleteness.calculator.js";
import { PROFILE_POLICY_VERSION, SECTION_NAVIGATION_ACTIONS } from "./profilePolicy.config.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PROFICIENCY_CODES = new Set(Object.values(SKILL_PROFICIENCY));

const isNonEmpty = (val) => typeof val === "string" && val.trim().length > 0;

const isSafeUrl = (rawUrl, { requireHttps = false } = {}) => {
  if (!isNonEmpty(rawUrl)) return true;
  try {
    const parsed = new URL(rawUrl.trim());
    if (requireHttps) return parsed.protocol === "https:";
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const addIssue = (bucket, { level, section, field = null, record_id = null, code, message, severity }) => {
  bucket.push({
    level,
    section,
    field,
    record_id: record_id ? String(record_id) : null,
    code,
    message,
    severity,
    action: SECTION_NAVIGATION_ACTIONS[section] || SECTION_NAVIGATION_ACTIONS.basic_identity,
  });
};

/**
 * Pure multi-level domain validation engine for S1-11.
 * Evaluates field, record, section, profile validity, and publishability independently
 * from S1-10 completeness while reusing S1-10 output for completeness context.
 */
export const evaluateProfileValidation = ({
  student = null,
  institute_id = null,
  activeAcademicHistoryCount = 0,
  studentSkills = [],
  projects = [],
  projectLinks = [],
  certifications = [],
  internships = [],
  resumeVersions = [],
  documents = [],
  completenessSnapshot = null,
} = {}) => {
  const errors = [];
  const warnings = [];
  const safeStudent = student || {};
  const resolvedInstituteId = institute_id || null;

  // 1. Account & Identity Validation
  if (safeStudent.is_deleted === true) {
    addIssue(errors, {
      level: "PROFILE",
      section: "basic_identity",
      code: PROFILE_VALIDATION_CODES.ACCOUNT_RESTRICTED,
      message: "Deleted accounts cannot be validated or published.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  }

  if (safeStudent.visibility_override === PROFILE_VISIBILITY_OVERRIDE.SUSPENDED) {
    addIssue(errors, {
      level: "PROFILE",
      section: "basic_identity",
      code: PROFILE_VALIDATION_CODES.ACCOUNT_RESTRICTED,
      message: "Profile visibility is administratively suspended.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  }

  if (!isNonEmpty(safeStudent.student_name)) {
    addIssue(errors, {
      level: "FIELD",
      section: "basic_identity",
      field: "student_name",
      code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
      message: "Full name is required.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  }

  if (!isNonEmpty(safeStudent.student_email)) {
    addIssue(errors, {
      level: "FIELD",
      section: "basic_identity",
      field: "student_email",
      code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
      message: "Email address is required.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  } else if (!EMAIL_REGEX.test(safeStudent.student_email.trim())) {
    addIssue(errors, {
      level: "FIELD",
      section: "basic_identity",
      field: "student_email",
      code: PROFILE_VALIDATION_CODES.INVALID_FORMAT,
      message: "Email address format is invalid.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  }

  const contactDigits = String(safeStudent.student_contact ?? "").trim();
  if (!contactDigits) {
    addIssue(errors, {
      level: "FIELD",
      section: "basic_identity",
      field: "student_contact",
      code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
      message: "Contact number is required for placement verification.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  } else if (contactDigits.length < 7 || contactDigits.length > 20) {
    addIssue(errors, {
      level: "FIELD",
      section: "basic_identity",
      field: "student_contact",
      code: PROFILE_VALIDATION_CODES.INVALID_FORMAT,
      message: "Contact number must be between 7 and 20 characters.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  }

  // 2. Academic Validation (S1-01)
  if (safeStudent.academic_status === ACADEMIC_STATUS.DROPPED) {
    addIssue(errors, {
      level: "SECTION",
      section: "academic_profile",
      field: "academic_status",
      code: PROFILE_VALIDATION_CODES.ACCOUNT_RESTRICTED,
      message: "Profiles marked as Dropped cannot be published.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  } else if (safeStudent.academic_status === ACADEMIC_STATUS.DETAINED) {
    addIssue(warnings, {
      level: "SECTION",
      section: "academic_profile",
      field: "academic_status",
      code: PROFILE_VALIDATION_CODES.UNSUPPORTED_STATE,
      message: "Academic status is currently Detained; verify eligibility before applying.",
      severity: VALIDATION_SEVERITY.WARNING,
    });
  }

  if (!safeStudent.university_id) {
    addIssue(errors, {
      level: "FIELD",
      section: "academic_profile",
      field: "university_id",
      code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
      message: "University affiliation is required.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  }

  if (!resolvedInstituteId) {
    addIssue(errors, {
      level: "FIELD",
      section: "academic_profile",
      field: "institute_id",
      code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
      message: "Affiliated institute is required.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  }

  if (!safeStudent.degree_id) {
    addIssue(errors, {
      level: "FIELD",
      section: "academic_profile",
      field: "degree_id",
      code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
      message: "Academic degree program is required.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  }

  if (!safeStudent.branch_id) {
    addIssue(errors, {
      level: "FIELD",
      section: "academic_profile",
      field: "branch_id",
      code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
      message: "Branch or department is required.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  }

  if (!isNonEmpty(safeStudent.student_enrollment)) {
    addIssue(errors, {
      level: "FIELD",
      section: "academic_profile",
      field: "student_enrollment",
      code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
      message: "Enrollment number is required.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  }

  if (!isNonEmpty(String(safeStudent.student_current_sem ?? ""))) {
    addIssue(errors, {
      level: "FIELD",
      section: "academic_profile",
      field: "student_current_sem",
      code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
      message: "Current semester is required.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  }

  if (safeStudent.cgpa !== null && safeStudent.cgpa !== undefined) {
    const cgpa = Number(safeStudent.cgpa);
    if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      addIssue(errors, {
        level: "FIELD",
        section: "academic_profile",
        field: "cgpa",
        code: PROFILE_VALIDATION_CODES.INVALID_FORMAT,
        message: "CGPA must be between 0 and 10.",
        severity: VALIDATION_SEVERITY.ERROR,
      });
    }
  }

  if (safeStudent.percentage !== null && safeStudent.percentage !== undefined) {
    const pct = Number(safeStudent.percentage);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      addIssue(errors, {
        level: "FIELD",
        section: "academic_profile",
        field: "percentage",
        code: PROFILE_VALIDATION_CODES.INVALID_FORMAT,
        message: "Percentage must be between 0 and 100.",
        severity: VALIDATION_SEVERITY.ERROR,
      });
    }
  }

  if (
    safeStudent.admission_year &&
    safeStudent.expected_graduation_year &&
    Number(safeStudent.expected_graduation_year) < Number(safeStudent.admission_year)
  ) {
    addIssue(errors, {
      level: "FIELD",
      section: "academic_profile",
      field: "expected_graduation_year",
      code: PROFILE_VALIDATION_CODES.INVALID_DATE_RANGE,
      message: "Expected graduation year cannot precede admission year.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  }

  if ((Number(activeAcademicHistoryCount) || 0) === 0) {
    addIssue(warnings, {
      level: "SECTION",
      section: "academic_profile",
      field: "academic_history",
      code: PROFILE_VALIDATION_CODES.MISSING_RECOMMENDATION,
      message: "Add previous academic history (10th/12th/Diploma) to strengthen your record.",
      severity: VALIDATION_SEVERITY.WARNING,
    });
  }

  // 3. Technical Skills Validation (S1-02 + S1-03)
  const activeSkills = (studentSkills || []).filter((s) => s && s.is_deleted !== true);
  const seenSkillIds = new Set();

  for (const entry of activeSkills) {
    const skillObj = entry.skill_id;
    const skillId = skillObj?._id ? String(skillObj._id) : String(skillObj || "");
    if (!skillId || (typeof skillObj === "object" && (skillObj.is_deleted || skillObj.is_active === false))) {
      addIssue(errors, {
        level: "RECORD",
        section: "technical_skills",
        field: "skill_id",
        record_id: entry._id,
        code: PROFILE_VALIDATION_CODES.INVALID_REFERENCE,
        message: "Profile contains an inactive or removed canonical skill.",
        severity: VALIDATION_SEVERITY.ERROR,
      });
    } else if (seenSkillIds.has(skillId)) {
      addIssue(errors, {
        level: "RECORD",
        section: "technical_skills",
        field: "skill_id",
        record_id: entry._id,
        code: PROFILE_VALIDATION_CODES.DUPLICATE_ENTRY,
        message: "Duplicate technical skill association detected.",
        severity: VALIDATION_SEVERITY.ERROR,
      });
    } else {
      seenSkillIds.add(skillId);
    }

    if (!VALID_PROFICIENCY_CODES.has(entry.proficiency)) {
      addIssue(errors, {
        level: "RECORD",
        section: "technical_skills",
        field: "proficiency",
        record_id: entry._id,
        code: PROFILE_VALIDATION_CODES.UNSUPPORTED_STATE,
        message: "A technical skill has an invalid proficiency level.",
        severity: VALIDATION_SEVERITY.ERROR,
      });
    }
  }

  const validSkills = filterValidSkills(activeSkills);
  if (validSkills.length === 0) {
    addIssue(errors, {
      level: "SECTION",
      section: "technical_skills",
      field: "skills",
      code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
      message: "Add at least 1 valid technical skill with proficiency before publishing.",
      severity: VALIDATION_SEVERITY.ERROR,
    });
  } else if (validSkills.length < 3) {
    addIssue(warnings, {
      level: "SECTION",
      section: "technical_skills",
      field: "skills",
      code: PROFILE_VALIDATION_CODES.MISSING_RECOMMENDATION,
      message: "Adding 3 or more technical skills improves recruiter discovery.",
      severity: VALIDATION_SEVERITY.WARNING,
    });
  }

  // 4. Projects & Links Validation (S1-04 + S1-05)
  const nonDeletedProjects = (projects || []).filter(
    (p) => p && p.is_deleted !== true && p.status !== PROJECT_STATUS.ARCHIVED,
  );
  const validProjectIds = new Set();

  for (const proj of nonDeletedProjects) {
    validProjectIds.add(String(proj._id || ""));
    if (!isNonEmpty(proj.title) || !isNonEmpty(proj.description)) {
      addIssue(errors, {
        level: "RECORD",
        section: "projects",
        field: !isNonEmpty(proj.title) ? "title" : "description",
        record_id: proj._id,
        code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
        message: "Every active project must include a title and description.",
        severity: VALIDATION_SEVERITY.ERROR,
      });
    }
    if (!proj.is_ongoing && proj.start_date && proj.end_date) {
      if (new Date(proj.end_date) < new Date(proj.start_date)) {
        addIssue(errors, {
          level: "RECORD",
          section: "projects",
          field: "end_date",
          record_id: proj._id,
          code: PROFILE_VALIDATION_CODES.INVALID_DATE_RANGE,
          message: `Project '${proj.title || "Untitled"}' has end_date earlier than start_date.`,
          severity: VALIDATION_SEVERITY.ERROR,
        });
      }
    }
    for (const urlField of ["project_url", "repository_url", "live_demo_url"]) {
      if (!isSafeUrl(proj[urlField])) {
        addIssue(errors, {
          level: "RECORD",
          section: "projects",
          field: urlField,
          record_id: proj._id,
          code: PROFILE_VALIDATION_CODES.INVALID_URL,
          message: `Project '${proj.title || "Untitled"}' contains an unsafe ${urlField}.`,
          severity: VALIDATION_SEVERITY.ERROR,
        });
      }
    }
  }

  const activeProjectLinks = (projectLinks || []).filter((l) => l && l.is_deleted !== true);
  for (const link of activeProjectLinks) {
    const pid = link.project_id?._id ? String(link.project_id._id) : String(link.project_id || "");
    if (!validProjectIds.has(pid)) continue;
    if (!isSafeUrl(link.url)) {
      addIssue(errors, {
        level: "RECORD",
        section: "projects",
        field: "url",
        record_id: link._id,
        code: PROFILE_VALIDATION_CODES.INVALID_URL,
        message: "Project external link URL must use http:// or https://.",
        severity: VALIDATION_SEVERITY.ERROR,
      });
    }
  }

  const validProjects = filterValidProjects(nonDeletedProjects);
  if (validProjects.length === 0) {
    addIssue(warnings, {
      level: "SECTION",
      section: "projects",
      code: PROFILE_VALIDATION_CODES.MISSING_RECOMMENDATION,
      message: "Add at least 1 project to showcase practical experience.",
      severity: VALIDATION_SEVERITY.WARNING,
    });
  } else {
    const linkedProjectIds = new Set(
      activeProjectLinks.map((l) =>
        l.project_id?._id ? String(l.project_id._id) : String(l.project_id || ""),
      ),
    );
    const hasAnyLink = validProjects.some(
      (p) =>
        linkedProjectIds.has(String(p._id || "")) ||
        isNonEmpty(p.repository_url) ||
        isNonEmpty(p.live_demo_url) ||
        isNonEmpty(p.project_url),
    );
    if (!hasAnyLink) {
      addIssue(warnings, {
        level: "SECTION",
        section: "projects",
        code: PROFILE_VALIDATION_CODES.MISSING_RECOMMENDATION,
        message: "Attach a GitHub repository or live demo link to one of your projects.",
        severity: VALIDATION_SEVERITY.WARNING,
      });
    }
  }

  // 5. Certifications Validation (S1-06)
  const activeCerts = (certifications || []).filter(
    (c) => c && c.is_deleted !== true && c.status !== CERTIFICATION_STATUS.ARCHIVED,
  );
  const now = new Date();
  for (const cert of activeCerts) {
    if (!isNonEmpty(cert.title) || !isNonEmpty(cert.issuing_organization) || !cert.issue_date) {
      addIssue(errors, {
        level: "RECORD",
        section: "certifications",
        field: "title",
        record_id: cert._id,
        code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
        message: "Active certification requires title, issuing organization, and issue date.",
        severity: VALIDATION_SEVERITY.ERROR,
      });
    }
    if (!cert.does_not_expire && cert.issue_date && cert.expiry_date) {
      if (new Date(cert.expiry_date) < new Date(cert.issue_date)) {
        addIssue(errors, {
          level: "RECORD",
          section: "certifications",
          field: "expiry_date",
          record_id: cert._id,
          code: PROFILE_VALIDATION_CODES.INVALID_DATE_RANGE,
          message: `Certification '${cert.title || "Untitled"}' expires before its issue date.`,
          severity: VALIDATION_SEVERITY.ERROR,
        });
      } else if (new Date(cert.expiry_date) < now) {
        addIssue(warnings, {
          level: "RECORD",
          section: "certifications",
          field: "expiry_date",
          record_id: cert._id,
          code: PROFILE_VALIDATION_CODES.EXPIRED_CREDENTIAL,
          message: `Certification '${cert.title || "Untitled"}' has expired.`,
          severity: VALIDATION_SEVERITY.WARNING,
        });
      }
    }
    if (!isSafeUrl(cert.credential_url, { requireHttps: true })) {
      addIssue(errors, {
        level: "RECORD",
        section: "certifications",
        field: "credential_url",
        record_id: cert._id,
        code: PROFILE_VALIDATION_CODES.INVALID_URL,
        message: `Certification '${cert.title || "Untitled"}' credential URL must use https://.`,
        severity: VALIDATION_SEVERITY.ERROR,
      });
    }
  }

  // 6. Internships Validation (S1-07)
  const activeInternships = (internships || []).filter(
    (i) => i && i.is_deleted !== true && i.status !== INTERNSHIP_STATUS.ARCHIVED,
  );
  for (const internship of activeInternships) {
    if (!isNonEmpty(internship.role_title) || !isNonEmpty(internship.organization_name) || !internship.start_date) {
      addIssue(errors, {
        level: "RECORD",
        section: "internships",
        field: "role_title",
        record_id: internship._id,
        code: PROFILE_VALIDATION_CODES.REQUIRED_FIELD,
        message: "Active internship requires role title, organization name, and start date.",
        severity: VALIDATION_SEVERITY.ERROR,
      });
    }
    if (!internship.currently_working && internship.start_date && internship.end_date) {
      if (new Date(internship.end_date) < new Date(internship.start_date)) {
        addIssue(errors, {
          level: "RECORD",
          section: "internships",
          field: "end_date",
          record_id: internship._id,
          code: PROFILE_VALIDATION_CODES.INVALID_DATE_RANGE,
          message: `Internship at '${internship.organization_name || "Organization"}' has end_date before start_date.`,
          severity: VALIDATION_SEVERITY.ERROR,
        });
      }
    }
  }

  // 7. Resume & Document Validation (S1-08 + S1-09)
  const nonDeletedDocs = (documents || []).filter((d) => d && d.is_deleted !== true);
  for (const doc of nonDeletedDocs) {
    if (doc.document_type === DOCUMENT_TYPES.RESUME && doc.malware_scan_status === "Infected") {
      addIssue(errors, {
        level: "RECORD",
        section: "resume_readiness",
        field: "malware_scan_status",
        record_id: doc._id,
        code: PROFILE_VALIDATION_CODES.UNSUPPORTED_STATE,
        message: "An uploaded resume document failed safety scan and must be replaced or deleted.",
        severity: VALIDATION_SEVERITY.ERROR,
      });
    }
  }

  const validVersions = filterValidResumeVersions(resumeVersions);
  const validDocs = filterValidResumeDocuments(nonDeletedDocs);
  if (validVersions.length === 0 && validDocs.length === 0) {
    addIssue(warnings, {
      level: "SECTION",
      section: "resume_readiness",
      code: PROFILE_VALIDATION_CODES.MISSING_RECOMMENDATION,
      message: "Create a tailored resume version or upload a resume document for job applications.",
      severity: VALIDATION_SEVERITY.WARNING,
    });
  }

  const completeness =
    completenessSnapshot ||
    calculateUnifiedProfileCompleteness({
      student: safeStudent,
      role: safeStudent.role || "Student",
      activeAcademicHistoryCount,
      studentSkills,
      projects,
      projectLinks,
      certifications,
      internships,
      resumeVersions,
      documents,
    });

  const valid = errors.length === 0;
  const isSuspended =
    safeStudent.visibility_override === PROFILE_VISIBILITY_OVERRIDE.SUSPENDED ||
    safeStudent.is_deleted === true ||
    safeStudent.academic_status === ACADEMIC_STATUS.DROPPED;
  const publishable = valid && !isSuspended;

  let profileState;
  if (isSuspended) {
    profileState = PROFILE_LIFECYCLE_STATES.SUSPENDED;
  } else if (!valid) {
    profileState = PROFILE_LIFECYCLE_STATES.INVALID;
  } else if (safeStudent.is_published) {
    profileState = PROFILE_LIFECYCLE_STATES.PUBLISHED;
  } else {
    profileState = PROFILE_LIFECYCLE_STATES.VALID;
  }

  const errorsBySection = errors.reduce((acc, item) => {
    acc[item.section] = (acc[item.section] || 0) + 1;
    return acc;
  }, {});

  const warningsBySection = warnings.reduce((acc, item) => {
    acc[item.section] = (acc[item.section] || 0) + 1;
    return acc;
  }, {});

  const sectionStates = {};
  for (const key of Object.keys(SECTION_NAVIGATION_ACTIONS)) {
    const errCount = errorsBySection[key] || 0;
    const warnCount = warningsBySection[key] || 0;
    sectionStates[key] = {
      valid: errCount === 0,
      error_count: errCount,
      warning_count: warnCount,
    };
  }

  return {
    policy_version: PROFILE_POLICY_VERSION,
    valid,
    publishable,
    profile_state: profileState,
    completeness_percentage: completeness.percentage,
    valid_counts: {
      skills: validSkills.length,
      projects: validProjects.length,
      certifications: filterValidCertifications(activeCerts).length,
      internships: filterValidInternships(activeInternships).length,
      resume_versions: validVersions.length,
      resume_documents: validDocs.length,
    },
    section_states: sectionStates,
    errors,
    warnings,
    blocking_reasons: errors.map((e) => ({
      code: e.code,
      section: e.section,
      field: e.field,
      message: e.message,
    })),
    evaluated_at: new Date().toISOString(),
  };
};
