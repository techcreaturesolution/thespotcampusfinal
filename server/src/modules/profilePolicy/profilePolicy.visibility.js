import { NotFoundError, UnauthorizedError } from "../../errors/customErrors.js";
import {
  CERTIFICATION_STATUS,
  CERTIFICATION_VISIBILITY,
  INTERNSHIP_STATUS,
  INTERNSHIP_VISIBILITY,
  PROFILE_VISIBILITY,
  PROFILE_VISIBILITY_OVERRIDE,
  PROJECT_STATUS,
  PROJECT_VISIBILITY,
} from "../../utils/constants.js";
import { filterValidSkills } from "../profileCompleteness/profileCompleteness.calculator.js";

export const VIEWER_AUDIENCE = Object.freeze({
  OWNER: "OWNER",
  INSTITUTE: "INSTITUTE",
  PUBLIC: "PUBLIC",
});

/**
 * Determine viewer access and resulting projection audience for a student profile.
 * Never trusts client flags; enforces least-privilege object-level & institute isolation.
 */
export const resolveViewAudiencePolicy = ({
  scopedActor = null,
  student = null,
  studentInstituteId = null,
  actorInstituteId = null,
  validation = null,
  requestedPreviewAudience = null,
} = {}) => {
  if (!student || student.is_deleted === true) {
    throw new NotFoundError("Profile not found");
  }

  const effectiveVisibility =
    student.visibility_override === PROFILE_VISIBILITY_OVERRIDE.SUSPENDED ||
    student.visibility_override === PROFILE_VISIBILITY_OVERRIDE.RESTRICTED_PRIVATE
      ? PROFILE_VISIBILITY.PRIVATE
      : student.profile_visibility || PROFILE_VISIBILITY.PRIVATE;

  const isSuspended = student.visibility_override === PROFILE_VISIBILITY_OVERRIDE.SUSPENDED;
  const actorRole = scopedActor?.role || "Anonymous";
  const actorId = scopedActor?.userId ? String(scopedActor.userId) : null;
  const studentId = String(student._id);

  // 1. Owner access (always allowed to read/manage own profile; may preview target audience)
  if (actorRole === "Student" && actorId === studentId) {
    if (
      requestedPreviewAudience &&
      Object.values(VIEWER_AUDIENCE).includes(requestedPreviewAudience)
    ) {
      return {
        authorized: true,
        is_owner: true,
        audience: requestedPreviewAudience,
        effective_visibility: effectiveVisibility,
        institute_id: studentInstituteId,
      };
    }
    return {
      authorized: true,
      is_owner: true,
      audience: VIEWER_AUDIENCE.OWNER,
      effective_visibility: effectiveVisibility,
      institute_id: studentInstituteId,
    };
  }

  // 2. Platform Admin
  if (actorRole === "Admin") {
    return {
      authorized: true,
      is_owner: false,
      audience:
        requestedPreviewAudience === VIEWER_AUDIENCE.PUBLIC
          ? VIEWER_AUDIENCE.PUBLIC
          : VIEWER_AUDIENCE.OWNER,
      effective_visibility: effectiveVisibility,
      institute_id: studentInstituteId,
    };
  }

  // All non-owner, non-Admin viewers are blocked if account is suspended
  if (isSuspended) {
    throw new NotFoundError("Profile not found");
  }

  // 3. Institute Staff (College / TPO)
  if (actorRole === "College" || actorRole === "TPO") {
    if (!studentInstituteId || !actorInstituteId || String(studentInstituteId) !== String(actorInstituteId)) {
      throw new UnauthorizedError("Cross-institute profile access is denied");
    }
    if (actorRole === "TPO" && scopedActor?.tpoDegreeId) {
      const studentDegreeId = student.degree_id?._id
        ? String(student.degree_id._id)
        : student.degree_id
          ? String(student.degree_id)
          : null;
      if (studentDegreeId !== String(scopedActor.tpoDegreeId)) {
        throw new UnauthorizedError("Cross-program profile access is denied");
      }
    }

    // Respect RESTRICTED_PRIVATE override for non-admin staff when explicitly locked
    if (student.visibility_override === PROFILE_VISIBILITY_OVERRIDE.RESTRICTED_PRIVATE) {
      throw new UnauthorizedError("Profile is restricted by platform administration");
    }

    return {
      authorized: true,
      is_owner: false,
      audience: VIEWER_AUDIENCE.INSTITUTE,
      effective_visibility: effectiveVisibility,
      institute_id: studentInstituteId,
    };
  }

  // 4. Affiliated University (read-only within university scope)
  if (actorRole === "University") {
    const studentUniversityId = student.university_id?._id
      ? String(student.university_id._id)
      : student.university_id
        ? String(student.university_id)
        : null;
    if (!studentUniversityId || studentUniversityId !== String(actorId)) {
      throw new UnauthorizedError("Cross-university profile access is denied");
    }
    return {
      authorized: true,
      is_owner: false,
      audience: VIEWER_AUDIENCE.INSTITUTE,
      effective_visibility: effectiveVisibility,
      institute_id: studentInstituteId,
    };
  }

  // 5. External authenticated (Company / Peer Student) or Anonymous viewers -> STRICTLY Public + Published + Publishable!
  const isPubliclyAccessible =
    Boolean(student.is_published) &&
    effectiveVisibility === PROFILE_VISIBILITY.PUBLIC &&
    Boolean(validation?.publishable);

  if (!isPubliclyAccessible) {
    // Return 404 to prevent enumerating existence of private/unpublished/invalid profiles
    throw new NotFoundError("Public profile is not available");
  }

  return {
    authorized: true,
    is_owner: false,
    audience: VIEWER_AUDIENCE.PUBLIC,
    effective_visibility: effectiveVisibility,
    institute_id: studentInstituteId,
  };
};

const isProjectVisibleForAudience = (project, audience) => {
  if (!project || project.is_deleted === true) return false;
  if (project.status === PROJECT_STATUS.ARCHIVED && audience !== VIEWER_AUDIENCE.OWNER) return false;
  if (audience === VIEWER_AUDIENCE.OWNER) return true;
  if (audience === VIEWER_AUDIENCE.INSTITUTE) {
    return project.visibility !== PROJECT_VISIBILITY.PRIVATE;
  }
  return project.visibility === PROJECT_VISIBILITY.PUBLIC;
};

const isCertificationVisibleForAudience = (cert, audience) => {
  if (!cert || cert.is_deleted === true) return false;
  if (cert.status === CERTIFICATION_STATUS.ARCHIVED && audience !== VIEWER_AUDIENCE.OWNER) return false;
  if (audience === VIEWER_AUDIENCE.OWNER) return true;
  if (audience === VIEWER_AUDIENCE.INSTITUTE) {
    return cert.visibility !== CERTIFICATION_VISIBILITY.PRIVATE;
  }
  return cert.visibility === CERTIFICATION_VISIBILITY.PUBLIC;
};

const isInternshipVisibleForAudience = (internship, audience) => {
  if (!internship || internship.is_deleted === true) return false;
  if (internship.status === INTERNSHIP_STATUS.ARCHIVED && audience !== VIEWER_AUDIENCE.OWNER) return false;
  if (audience === VIEWER_AUDIENCE.OWNER) return true;
  if (audience === VIEWER_AUDIENCE.INSTITUTE) {
    return internship.visibility !== INTERNSHIP_VISIBILITY.PRIVATE;
  }
  return internship.visibility === INTERNSHIP_VISIBILITY.PUBLIC;
};

/**
 * Transform canonical profile snapshot into strict audience-filtered DTO.
 * Public views strictly use PUBLIC_PROFILE_ALLOWLIST and never leak contact info,
 * private attachments, resume documents, or internal institute IDs.
 */
export const projectProfileByAudience = ({
  student,
  institute_id = null,
  studentSkills = [],
  projects = [],
  projectLinks = [],
  certifications = [],
  internships = [],
  audience = VIEWER_AUDIENCE.PUBLIC,
  validation = null,
} = {}) => {
  const validSkills = filterValidSkills(studentSkills).map((s) => ({
    name: s.skill_id?.name || "",
    category: s.skill_id?.category || "Other",
    proficiency: s.proficiency,
  }));

  const linksByProject = new Map();
  for (const link of projectLinks || []) {
    if (!link || link.is_deleted === true) continue;
    const pid = link.project_id?._id ? String(link.project_id._id) : String(link.project_id || "");
    if (!linksByProject.has(pid)) linksByProject.set(pid, []);
    linksByProject.get(pid).push({
      link_type: link.link_type,
      url: link.url,
      label: link.label || "",
    });
  }

  const visibleProjects = (projects || [])
    .filter((p) => isProjectVisibleForAudience(p, audience))
    .map((p) => ({
      id: p._id,
      title: p.title,
      description: p.description,
      role: p.role || "",
      status: p.status,
      visibility: p.visibility,
      is_ongoing: Boolean(p.is_ongoing),
      start_date: p.start_date || null,
      end_date: p.end_date || null,
      links: linksByProject.get(String(p._id || "")) || [],
    }));

  const visibleCertifications = (certifications || [])
    .filter((c) => isCertificationVisibleForAudience(c, audience))
    .map((c) => ({
      id: c._id,
      title: c.title,
      issuing_organization: c.issuing_organization,
      category: c.category || "Technical",
      issue_date: c.issue_date || null,
      expiry_date: c.does_not_expire ? null : c.expiry_date || null,
      does_not_expire: Boolean(c.does_not_expire),
      credential_url: c.credential_url || "",
      // Private certificate attachments are NEVER projected into public responses
      has_attachment: audience === VIEWER_AUDIENCE.PUBLIC ? false : Boolean(c.certificate_file?.filename),
    }));

  const visibleInternships = (internships || [])
    .filter((i) => isInternshipVisibleForAudience(i, audience))
    .map((i) => ({
      id: i._id,
      role_title: i.role_title,
      organization_name: i.organization_name,
      employment_type: i.employment_type,
      work_mode: i.work_mode,
      location: i.location || "",
      start_date: i.start_date || null,
      end_date: i.currently_working ? null : i.end_date || null,
      currently_working: Boolean(i.currently_working),
      description: i.description || "",
      ...(audience === VIEWER_AUDIENCE.PUBLIC ? {} : { achievements: i.achievements || "" }),
    }));

  if (audience === VIEWER_AUDIENCE.PUBLIC) {
    return {
      audience: VIEWER_AUDIENCE.PUBLIC,
      profile: {
        id: student._id,
        student_name: student.student_name || "",
        degree_name: student.degree_id?.degree_name || null,
        branch_name: student.branch_id?.branch_name || null,
        academic_batch: student.academic_batch || null,
        expected_graduation_year: student.expected_graduation_year || null,
        verified_by_institute: Boolean(student.isVerifiedByTPO),
        visibility: student.profile_visibility || PROFILE_VISIBILITY.PRIVATE,
        published_at: student.published_at || null,
        skills: validSkills,
        projects: visibleProjects,
        certifications: visibleCertifications,
        internships: visibleInternships,
      },
    };
  }

  return {
    audience,
    profile: {
      id: student._id,
      institute_id: institute_id || null,
      student_name: student.student_name || "",
      student_email: student.student_email || "",
      student_contact: student.student_contact || "",
      student_enrollment: student.student_enrollment || "",
      student_current_sem: student.student_current_sem || "",
      degree_name: student.degree_id?.degree_name || null,
      branch_name: student.branch_id?.branch_name || null,
      academic_batch: student.academic_batch || null,
      academic_year: student.academic_year || null,
      academic_status: student.academic_status || "Active",
      cgpa: student.cgpa ?? null,
      percentage: student.percentage ?? null,
      verified_by_institute: Boolean(student.isVerifiedByTPO),
      visibility: student.profile_visibility || PROFILE_VISIBILITY.PRIVATE,
      is_published: Boolean(student.is_published),
      published_at: student.published_at || null,
      visibility_override: student.visibility_override || PROFILE_VISIBILITY_OVERRIDE.NONE,
      profile_state: validation?.profile_state || null,
      skills: validSkills,
      projects: visibleProjects,
      certifications: visibleCertifications,
      internships: visibleInternships,
    },
  };
};
