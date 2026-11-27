import {
  CERTIFICATION_STATUS,
  DOCUMENT_STATUS,
  DOCUMENT_TYPES,
  INTERNSHIP_STATUS,
  PROJECT_STATUS,
  RESUME_VERSION_STATUS,
  SKILL_PROFICIENCY,
} from "../../utils/constants.js";
import { calculateAcademicCompletion } from "../academicProfile/academicProfile.completion.js";
import {
  PROFILE_COMPLETENESS_BANDS,
  PROFILE_COMPLETENESS_FORMULA_VERSION,
  PROFILE_COMPLETENESS_SECTIONS,
} from "./profileCompleteness.config.js";

const VALID_PROFICIENCY_CODES = new Set(Object.values(SKILL_PROFICIENCY));

const hasNonEmptyString = (value, minLength = 1) =>
  typeof value === "string" && value.trim().length >= minLength;

const isValidDateValue = (value) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const roundTo2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const resolveBand = (percentage, applicableWeight) => {
  if (applicableWeight <= 0) {
    return { key: "NOT_APPLICABLE", label: "Not Applicable" };
  }
  const match = PROFILE_COMPLETENESS_BANDS.find((band) => percentage >= band.min);
  return match ? { key: match.key, label: match.label } : { key: "EMPTY", label: "Empty" };
};

const normalizeRole = (student, overrideRole = null) => {
  if (overrideRole) return String(overrideRole);
  if (student && student.role) return String(student.role);
  return "Student";
};

/**
 * Filter active, domain-valid S1-02/S1-03 student skill entries.
 * Excludes soft-deleted records, orphan/inactive/deleted canonical skill entries,
 * and skills without a canonical proficiency level.
 */
export const filterValidSkills = (studentSkills = []) => {
  if (!Array.isArray(studentSkills)) return [];
  return studentSkills.filter((entry) => {
    if (!entry || entry.is_deleted === true) return false;
    const skillObj = entry.skill_id;
    if (skillObj && typeof skillObj === "object") {
      if (skillObj.is_deleted === true || skillObj.is_active === false) return false;
      if (!hasNonEmptyString(skillObj.name)) return false;
    } else if (!skillObj) {
      return false;
    }
    return VALID_PROFICIENCY_CODES.has(entry.proficiency);
  });
};

/**
 * Filter active, domain-valid S1-04 projects.
 * Excludes soft-deleted and archived projects as well as incomplete drafts lacking title/description.
 */
export const filterValidProjects = (projects = []) => {
  if (!Array.isArray(projects)) return [];
  return projects.filter((proj) => {
    if (!proj || proj.is_deleted === true) return false;
    if (proj.status === PROJECT_STATUS.ARCHIVED) return false;
    return hasNonEmptyString(proj.title) && hasNonEmptyString(proj.description);
  });
};

/**
 * Filter active, domain-valid S1-05 project links attached to active valid projects.
 */
export const filterValidProjectLinks = (projectLinks = [], validProjectIds = new Set()) => {
  if (!Array.isArray(projectLinks)) return [];
  return projectLinks.filter((link) => {
    if (!link || link.is_deleted === true) return false;
    const pid = link.project_id?._id ? String(link.project_id._id) : String(link.project_id || "");
    if (validProjectIds.size > 0 && !validProjectIds.has(pid)) return false;
    return hasNonEmptyString(link.url);
  });
};

/**
 * Filter active, domain-valid S1-06 certifications.
 * Excludes soft-deleted, archived, and incomplete certification entries.
 */
export const filterValidCertifications = (certifications = []) => {
  if (!Array.isArray(certifications)) return [];
  return certifications.filter((cert) => {
    if (!cert || cert.is_deleted === true) return false;
    if (cert.status === CERTIFICATION_STATUS.ARCHIVED) return false;
    return (
      hasNonEmptyString(cert.title) &&
      hasNonEmptyString(cert.issuing_organization) &&
      isValidDateValue(cert.issue_date)
    );
  });
};

/**
 * Filter active, domain-valid S1-07 internships.
 * Excludes soft-deleted, archived, and incomplete internship entries.
 */
export const filterValidInternships = (internships = []) => {
  if (!Array.isArray(internships)) return [];
  return internships.filter((item) => {
    if (!item || item.is_deleted === true) return false;
    if (item.status === INTERNSHIP_STATUS.ARCHIVED) return false;
    return (
      hasNonEmptyString(item.role_title) &&
      hasNonEmptyString(item.organization_name) &&
      isValidDateValue(item.start_date)
    );
  });
};

/**
 * Filter active, domain-valid S1-08 resume versions.
 */
export const filterValidResumeVersions = (resumeVersions = []) => {
  if (!Array.isArray(resumeVersions)) return [];
  return resumeVersions.filter((ver) => {
    if (!ver || ver.is_deleted === true) return false;
    if (ver.status === RESUME_VERSION_STATUS.ARCHIVED) return false;
    return hasNonEmptyString(ver.name);
  });
};

/**
 * Filter active, clean, available S1-09 resume documents.
 */
export const filterValidResumeDocuments = (documents = []) => {
  if (!Array.isArray(documents)) return [];
  return documents.filter((doc) => {
    if (!doc || doc.is_deleted === true) return false;
    if (doc.document_type !== DOCUMENT_TYPES.RESUME) return false;
    if (doc.status !== DOCUMENT_STATUS.AVAILABLE) return false;
    if (doc.malware_scan_status === "Infected") return false;
    return Number(doc.file_size) > 0 && hasNonEmptyString(doc.original_filename || doc.title);
  });
};

const evaluateBasicIdentity = (sectionMeta, student) => {
  const checkpoints = [
    { key: "student_name", label: "Full Name", done: hasNonEmptyString(student?.student_name) },
    {
      key: "student_email",
      label: "Email Address",
      done: hasNonEmptyString(student?.student_email) && student.student_email.includes("@"),
    },
    {
      key: "student_contact",
      label: "Contact Number",
      done:
        student?.student_contact !== null &&
        student?.student_contact !== undefined &&
        String(student.student_contact).trim().length >= 7,
    },
  ];

  const completedItems = checkpoints.filter((c) => c.done).length;
  const totalItems = checkpoints.length;
  const ratio = completedItems / totalItems;

  return {
    earned_weight: roundTo2(sectionMeta.weight * ratio),
    percentage: Math.round(ratio * 100),
    is_complete: completedItems === totalItems,
    completed_items: completedItems,
    total_items: totalItems,
    counts: { completed: completedItems, total: totalItems },
    missing_items: checkpoints
      .filter((c) => !c.done)
      .map((c) => ({
        section_key: sectionMeta.key,
        key: c.key,
        label: c.label,
        action: sectionMeta.action,
      })),
  };
};

const evaluateAcademicProfile = (sectionMeta, student, activeHistoryCount) => {
  const academicCompletion = calculateAcademicCompletion(student || {}, activeHistoryCount);
  const ratio =
    academicCompletion.total_fields > 0
      ? academicCompletion.completed_count / academicCompletion.total_fields
      : 0;

  return {
    earned_weight: roundTo2(sectionMeta.weight * ratio),
    percentage: academicCompletion.percentage,
    is_complete: academicCompletion.is_complete,
    completed_items: academicCompletion.completed_count,
    total_items: academicCompletion.total_fields,
    counts: {
      completed_checkpoints: academicCompletion.completed_count,
      total_checkpoints: academicCompletion.total_fields,
      active_history_count: activeHistoryCount,
    },
    missing_items: (academicCompletion.missing_fields || []).map((item) => ({
      section_key: sectionMeta.key,
      key: item.key,
      label: item.label,
      action: sectionMeta.action,
    })),
    academic_completion: academicCompletion,
  };
};

const evaluateTechnicalSkills = (sectionMeta, validSkills) => {
  const count = validSkills.length;
  const hasOneSkill = count >= 1;
  const hasRecommendedBreadth = count >= 3;
  const completedItems = (hasOneSkill ? 1 : 0) + (hasRecommendedBreadth ? 1 : 0);
  const totalItems = 2;
  const ratio = completedItems / totalItems;

  const missing = [];
  if (!hasOneSkill) {
    missing.push({
      section_key: sectionMeta.key,
      key: "skills_minimum",
      label: "Add at least 1 technical skill with proficiency",
      action: sectionMeta.action,
    });
  } else if (!hasRecommendedBreadth) {
    missing.push({
      section_key: sectionMeta.key,
      key: "skills_breadth",
      label: `Add ${3 - count} more technical skill${3 - count === 1 ? "" : "s"} (3+ recommended)`,
      action: sectionMeta.action,
    });
  }

  return {
    earned_weight: roundTo2(sectionMeta.weight * ratio),
    percentage: Math.round(ratio * 100),
    is_complete: completedItems === totalItems,
    completed_items: completedItems,
    total_items: totalItems,
    counts: { active_skills: count, minimum_target: 3 },
    missing_items: missing,
  };
};

const evaluateProjects = (sectionMeta, validProjects, validProjectLinks) => {
  const projectCount = validProjects.length;
  const hasProject = projectCount >= 1;

  const projectIdsWithExternalLinks = new Set(
    validProjectLinks.map((link) =>
      link.project_id?._id ? String(link.project_id._id) : String(link.project_id),
    ),
  );

  const projectsWithEmbeddedOrLinkedUrls = validProjects.filter((proj) => {
    const pid = String(proj._id || "");
    if (projectIdsWithExternalLinks.has(pid)) return true;
    return (
      hasNonEmptyString(proj.repository_url) ||
      hasNonEmptyString(proj.live_demo_url) ||
      hasNonEmptyString(proj.project_url)
    );
  });

  const hasLinkedProject = projectsWithEmbeddedOrLinkedUrls.length >= 1;
  const completedItems = (hasProject ? 1 : 0) + (hasLinkedProject ? 1 : 0);
  const totalItems = 2;
  const ratio = completedItems / totalItems;

  const missing = [];
  if (!hasProject) {
    missing.push({
      section_key: sectionMeta.key,
      key: "project_minimum",
      label: "Add at least 1 academic or personal project",
      action: sectionMeta.action,
    });
  }
  if (!hasLinkedProject) {
    missing.push({
      section_key: sectionMeta.key,
      key: "project_external_link",
      label: "Attach a GitHub repository or live demo link to a project",
      action: sectionMeta.action,
    });
  }

  return {
    earned_weight: roundTo2(sectionMeta.weight * ratio),
    percentage: Math.round(ratio * 100),
    is_complete: completedItems === totalItems,
    completed_items: completedItems,
    total_items: totalItems,
    counts: {
      active_projects: projectCount,
      linked_projects: projectsWithEmbeddedOrLinkedUrls.length,
      active_links: validProjectLinks.length,
    },
    missing_items: missing,
  };
};

const evaluateResumeReadiness = (sectionMeta, validResumeVersions, validResumeDocuments) => {
  const hasVersion = validResumeVersions.length >= 1;
  const hasUploadedDocument = validResumeDocuments.length >= 1;
  const completedItems = (hasVersion ? 1 : 0) + (hasUploadedDocument ? 1 : 0);
  const totalItems = 2;
  const ratio = completedItems / totalItems;

  const missing = [];
  if (!hasVersion) {
    missing.push({
      section_key: sectionMeta.key,
      key: "resume_version",
      label: "Create at least 1 active resume version (S1-08)",
      action: {
        label: "Manage Resume Versions",
        web_path: "/dashboard/student/resume-versions",
        mobile_route: "/resume-versions",
      },
    });
  }
  if (!hasUploadedDocument) {
    missing.push({
      section_key: sectionMeta.key,
      key: "resume_document",
      label: "Upload a PDF/DOCX resume document (S1-09)",
      action: {
        label: "Upload Resume Document",
        web_path: "/dashboard/student/documents",
        mobile_route: "/documents",
      },
    });
  }

  return {
    earned_weight: roundTo2(sectionMeta.weight * ratio),
    percentage: Math.round(ratio * 100),
    is_complete: completedItems === totalItems,
    completed_items: completedItems,
    total_items: totalItems,
    counts: {
      active_resume_versions: validResumeVersions.length,
      available_resume_documents: validResumeDocuments.length,
    },
    missing_items: missing,
  };
};

const evaluateOptionalSection = (sectionMeta, validItems, singularLabel) => {
  const count = validItems.length;
  const hasItem = count >= 1;
  return {
    earned_weight: 0,
    percentage: hasItem ? 100 : 0,
    is_complete: hasItem,
    completed_items: hasItem ? 1 : 0,
    total_items: 1,
    counts: { active_count: count },
    missing_items: [],
    recommendation: hasItem
      ? null
      : {
          section_key: sectionMeta.key,
          key: `${sectionMeta.key}_optional`,
          label: `Optional: Add ${singularLabel} to strengthen your placement profile`,
          action: sectionMeta.action,
        },
  };
};

/**
 * Compute deterministic unified profile completeness from canonical domain entities.
 * Does NOT trust client input or persist redundant percentage state.
 */
export const calculateUnifiedProfileCompleteness = ({
  student = null,
  role = null,
  activeAcademicHistoryCount = 0,
  studentSkills = [],
  projects = [],
  projectLinks = [],
  certifications = [],
  internships = [],
  resumeVersions = [],
  documents = [],
  sectionConfig = PROFILE_COMPLETENESS_SECTIONS,
} = {}) => {
  const targetRole = normalizeRole(student, role);
  const safeHistoryCount = Math.max(0, Number(activeAcademicHistoryCount) || 0);

  const validSkills = filterValidSkills(studentSkills);
  const validProjects = filterValidProjects(projects);
  const validProjectIds = new Set(validProjects.map((p) => String(p._id || "")).filter(Boolean));
  const validProjectLinks = filterValidProjectLinks(projectLinks, validProjectIds);
  const validCertifications = filterValidCertifications(certifications);
  const validInternships = filterValidInternships(internships);
  const validResumeVersions = filterValidResumeVersions(resumeVersions);
  const validResumeDocuments = filterValidResumeDocuments(documents);

  const sections = [];
  const missingItems = [];
  const recommendations = [];

  let earnedWeight = 0;
  let applicableWeight = 0;
  let totalPossibleWeight = 0;
  let completedRequiredSections = 0;
  let totalRequiredApplicableSections = 0;
  let academicCompletionSnapshot = null;

  for (const sectionMeta of sectionConfig) {
    totalPossibleWeight += Number(sectionMeta.weight) || 0;
    const isApplicable =
      Array.isArray(sectionMeta.applicable_roles) &&
      sectionMeta.applicable_roles.includes(targetRole);

    if (!isApplicable) {
      sections.push({
        key: sectionMeta.key,
        title: sectionMeta.title,
        feature_refs: sectionMeta.feature_refs,
        weight: sectionMeta.weight,
        earned_weight: 0,
        percentage: 0,
        applicable: false,
        required: sectionMeta.required,
        is_optional: sectionMeta.is_optional,
        is_complete: false,
        status: "Not Applicable",
        completed_items: 0,
        total_items: 0,
        criteria_summary: sectionMeta.criteria_summary,
        counts: {},
        missing_items: [],
        action: sectionMeta.action,
      });
      continue;
    }

    let result;
    switch (sectionMeta.key) {
      case "basic_identity":
        result = evaluateBasicIdentity(sectionMeta, student);
        break;
      case "academic_profile":
        result = evaluateAcademicProfile(sectionMeta, student, safeHistoryCount);
        academicCompletionSnapshot = result.academic_completion;
        break;
      case "technical_skills":
        result = evaluateTechnicalSkills(sectionMeta, validSkills);
        break;
      case "projects":
        result = evaluateProjects(sectionMeta, validProjects, validProjectLinks);
        break;
      case "resume_readiness":
        result = evaluateResumeReadiness(sectionMeta, validResumeVersions, validResumeDocuments);
        break;
      case "certifications":
        result = evaluateOptionalSection(sectionMeta, validCertifications, "a certification");
        break;
      case "internships":
        result = evaluateOptionalSection(
          sectionMeta,
          validInternships,
          "internship or work experience",
        );
        break;
      default:
        result = {
          earned_weight: 0,
          percentage: 0,
          is_complete: false,
          completed_items: 0,
          total_items: 0,
          counts: {},
          missing_items: [],
        };
    }

    if (!sectionMeta.is_optional && sectionMeta.weight > 0) {
      applicableWeight += sectionMeta.weight;
      earnedWeight += result.earned_weight;
      totalRequiredApplicableSections += 1;
      if (result.is_complete) {
        completedRequiredSections += 1;
      }
    }

    if (Array.isArray(result.missing_items) && result.missing_items.length > 0) {
      missingItems.push(...result.missing_items);
    }
    if (result.recommendation) {
      recommendations.push(result.recommendation);
    }

    let statusLabel;
    if (sectionMeta.is_optional) {
      statusLabel = result.is_complete ? "Added (Optional)" : "Optional";
    } else if (result.is_complete) {
      statusLabel = "Complete";
    } else if (result.percentage > 0) {
      statusLabel = "In Progress";
    } else {
      statusLabel = "Incomplete";
    }

    sections.push({
      key: sectionMeta.key,
      title: sectionMeta.title,
      feature_refs: sectionMeta.feature_refs,
      weight: sectionMeta.weight,
      earned_weight: result.earned_weight,
      percentage: result.percentage,
      applicable: true,
      required: sectionMeta.required,
      is_optional: sectionMeta.is_optional,
      is_complete: result.is_complete,
      status: statusLabel,
      completed_items: result.completed_items,
      total_items: result.total_items,
      criteria_summary: sectionMeta.criteria_summary,
      counts: result.counts,
      missing_items: result.missing_items,
      action: sectionMeta.action,
    });
  }

  const normalizedEarnedWeight = roundTo2(earnedWeight);
  const rawPercentage =
    applicableWeight > 0 ? roundTo2((normalizedEarnedWeight / applicableWeight) * 100) : 0;
  const percentage =
    applicableWeight > 0 ? Math.min(100, Math.max(0, Math.round(rawPercentage))) : 0;

  const band = resolveBand(percentage, applicableWeight);

  return {
    formula_version: PROFILE_COMPLETENESS_FORMULA_VERSION,
    target_role: targetRole,
    percentage,
    raw_percentage: rawPercentage,
    earned_weight: normalizedEarnedWeight,
    applicable_weight: applicableWeight,
    total_possible_weight: totalPossibleWeight,
    is_complete: applicableWeight > 0 && percentage === 100,
    status_band: band.key,
    status_label: band.label,
    completed_sections: completedRequiredSections,
    total_applicable_sections: totalRequiredApplicableSections,
    sections,
    missing_items: missingItems,
    recommendations,
    academic_completion: academicCompletionSnapshot,
    calculated_at: new Date().toISOString(),
  };
};
