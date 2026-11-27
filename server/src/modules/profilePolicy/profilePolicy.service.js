import mongoose from "mongoose";
import tbl_student from "../student/student.model.js";
import tbl_academic_history from "../academicProfile/academicHistory.model.js";
import tbl_student_skill from "../skills/studentSkill.model.js";
import tbl_project from "../projects/project.model.js";
import tbl_project_link from "../projects/projectLink.model.js";
import tbl_certification from "../certifications/certification.model.js";
import tbl_internship from "../internships/internship.model.js";
import tbl_resume_version from "../resumeVersions/resumeVersion.model.js";
import tbl_document from "../documents/document.model.js";
import tbl_audit_log from "../audit/auditLog.model.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { academicProfileService } from "../academicProfile/academicProfile.service.js";
import { calculateUnifiedProfileCompleteness } from "../profileCompleteness/profileCompleteness.calculator.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "../../errors/customErrors.js";
import {
  PROFILE_VALIDATION_CODES,
  PROFILE_VISIBILITY,
  PROFILE_VISIBILITY_OVERRIDE,
} from "../../utils/constants.js";
import {
  PROFILE_POLICY_VERSION,
  PROFILE_VISIBILITY_META,
  PUBLIC_PROFILE_ALLOWLIST,
} from "./profilePolicy.config.js";
import { evaluateProfileValidation } from "./profilePolicy.validatorEngine.js";
import { projectProfileByAudience, resolveViewAudiencePolicy } from "./profilePolicy.visibility.js";

const PROTECTED_MASS_ASSIGNMENT_KEYS = [
  "is_valid",
  "valid",
  "is_publishable",
  "publishable",
  "validation_status",
  "verification_status",
  "isVerifiedByTPO",
  "owner_id",
  "user_id",
  "student_id",
  "institute_id",
  "visibility_override",
  "is_published",
  "published_at",
];

const escapeRegex = (val) => String(val).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createProfilePolicyService = ({
  studentModel = tbl_student,
  academicHistoryModel = tbl_academic_history,
  studentSkillModel = tbl_student_skill,
  projectModel = tbl_project,
  projectLinkModel = tbl_project_link,
  certificationModel = tbl_certification,
  internshipModel = tbl_internship,
  resumeVersionModel = tbl_resume_version,
  documentModel = tbl_document,
  auditLogModel = tbl_audit_log,
  isValidObjectId = mongoose.isValidObjectId,
  resolveActorScope = academicProfileService.resolveActorScope,
  assertCanAccessStudent = academicProfileService.assertCanAccessStudent,
  resolveStudentInstituteId = academicProfileService.resolveStudentInstituteId,
  resolveActorInstituteId = academicProfileService.resolveActorInstituteId,
} = {}) => {
  const assertNoMassAssignment = (payload) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestError("Request body must be a JSON object");
    }
    for (const key of PROTECTED_MASS_ASSIGNMENT_KEYS) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        throw new UnauthorizedError(`Protected policy field '${key}' cannot be client-controlled`);
      }
    }
  };

  const resolveOptionalActor = async (actor) => {
    if (!actor || !actor.userId || !actor.role) return null;
    if (actor.role === "Company") return actor;
    return resolveActorScope(actor);
  };

  const loadProfileEvaluationSnapshot = async (studentId) => {
    if (!studentId || !isValidObjectId(studentId)) {
      throw new BadRequestError("Invalid student ID format");
    }

    const student = await studentModel
      .findById(studentId)
      .populate("degree_id", "degree_name degree_code")
      .populate("branch_id", "branch_name")
      .populate("university_id", "university_name")
      .lean();

    if (!student || student.is_deleted === true) {
      throw new NotFoundError("Student profile not found");
    }

    const sid = student._id;
    const instituteId = resolveStudentInstituteId(student);

    const [
      activeAcademicHistoryCount,
      studentSkills,
      projects,
      projectLinks,
      certifications,
      internships,
      resumeVersions,
      documents,
    ] = await Promise.all([
      academicHistoryModel.countDocuments({ student_id: sid, is_deleted: false }),
      studentSkillModel
        .find({ student_id: sid, is_deleted: false })
        .select("skill_id proficiency is_deleted")
        .populate("skill_id", "name category is_active is_deleted")
        .lean(),
      projectModel
        .find({ student_id: sid, is_deleted: false })
        .select(
          "_id title description role status visibility is_ongoing start_date end_date project_url repository_url live_demo_url is_deleted",
        )
        .lean(),
      projectLinkModel
        .find({ student_id: sid, is_deleted: false })
        .select("_id project_id link_type url label is_deleted")
        .lean(),
      certificationModel
        .find({ student_id: sid, is_deleted: false })
        .select(
          "_id title issuing_organization category credential_url issue_date expiry_date does_not_expire status visibility certificate_file is_deleted",
        )
        .lean(),
      internshipModel
        .find({ student_id: sid, is_deleted: false })
        .select(
          "_id role_title organization_name employment_type work_mode location start_date end_date currently_working description achievements status visibility is_deleted",
        )
        .lean(),
      resumeVersionModel
        .find({ student_id: sid, is_deleted: false })
        .select("_id name status is_default is_deleted")
        .lean(),
      documentModel
        .find({ owner_id: sid, is_deleted: false })
        .select("_id document_type status malware_scan_status file_size original_filename title is_deleted")
        .lean(),
    ]);

    const completeness = calculateUnifiedProfileCompleteness({
      student,
      role: student.role || "Student",
      activeAcademicHistoryCount,
      studentSkills,
      projects,
      projectLinks,
      certifications,
      internships,
      resumeVersions,
      documents,
    });

    const validation = evaluateProfileValidation({
      student,
      institute_id: instituteId,
      activeAcademicHistoryCount,
      studentSkills,
      projects,
      projectLinks,
      certifications,
      internships,
      resumeVersions,
      documents,
      completenessSnapshot: completeness,
    });

    const requiresRepublishReview =
      Boolean(student.is_published) && !validation.publishable;

    return {
      student,
      institute_id: instituteId,
      activeAcademicHistoryCount,
      studentSkills,
      projects,
      projectLinks,
      certifications,
      internships,
      resumeVersions,
      documents,
      completeness,
      validation,
      visibility: {
        profile_visibility: student.profile_visibility || PROFILE_VISIBILITY.PRIVATE,
        is_published: Boolean(student.is_published),
        published_at: student.published_at || null,
        visibility_updated_at: student.visibility_updated_at || null,
        visibility_override: student.visibility_override || PROFILE_VISIBILITY_OVERRIDE.NONE,
        visibility_override_reason: student.visibility_override_reason || "",
        requires_republish_review: requiresRepublishReview,
        effective_publicly_discoverable:
          Boolean(student.is_published) &&
          student.profile_visibility === PROFILE_VISIBILITY.PUBLIC &&
          student.visibility_override !== PROFILE_VISIBILITY_OVERRIDE.SUSPENDED &&
          student.visibility_override !== PROFILE_VISIBILITY_OVERRIDE.RESTRICTED_PRIVATE &&
          validation.publishable,
      },
    };
  };

  const getMyPolicyStatus = async (actor) => {
    if (!actor || actor.role !== "Student" || !actor.userId) {
      throw new UnauthorizedError("Only authenticated students can manage their own profile policy");
    }
    const snapshot = await loadProfileEvaluationSnapshot(actor.userId);
    return {
      student_id: snapshot.student._id,
      institute_id: snapshot.institute_id,
      validation: snapshot.validation,
      visibility: snapshot.visibility,
      completeness_percentage: snapshot.completeness.percentage,
    };
  };

  const getStudentPolicyStatus = async (actor, targetStudentId) => {
    const scopedActor = await resolveActorScope(actor);
    const snapshot = await loadProfileEvaluationSnapshot(targetStudentId);
    assertCanAccessStudent(scopedActor, snapshot.student, "read");
    return {
      student_id: snapshot.student._id,
      institute_id: snapshot.institute_id,
      validation: snapshot.validation,
      visibility: snapshot.visibility,
      completeness_percentage: snapshot.completeness.percentage,
    };
  };

  const publishMyProfile = async (actor, body = {}, reqMeta = {}) => {
    if (!actor || actor.role !== "Student" || !actor.userId) {
      throw new UnauthorizedError("Only students can publish their own profile");
    }
    assertNoMassAssignment(body);

    const requestedVisibility = body.visibility || PROFILE_VISIBILITY.INSTITUTE_ONLY;
    if (
      ![PROFILE_VISIBILITY.INSTITUTE_ONLY, PROFILE_VISIBILITY.PUBLIC].includes(requestedVisibility)
    ) {
      throw new BadRequestError(
        "Publishing requires visibility to be 'Institute Only' or 'Public'",
        PROFILE_VALIDATION_CODES.UNSUPPORTED_STATE,
      );
    }

    const snapshot = await loadProfileEvaluationSnapshot(actor.userId);
    if (!snapshot.validation.publishable) {
      throw new UnprocessableEntityError(
        "Profile cannot be published until all blocking validation errors are resolved",
        PROFILE_VALIDATION_CODES.NOT_PUBLISHABLE,
        snapshot.validation,
      );
    }

    const now = new Date();
    const updated = await studentModel.findOneAndUpdate(
      {
        _id: snapshot.student._id,
        is_deleted: { $ne: true },
        visibility_override: { $ne: PROFILE_VISIBILITY_OVERRIDE.SUSPENDED },
      },
      {
        $set: {
          is_published: true,
          profile_visibility: requestedVisibility,
          published_at: snapshot.student.published_at || now,
          visibility_updated_at: now,
        },
      },
      { new: true },
    );

    if (!updated) {
      throw new UnauthorizedError("Profile cannot be published in its current account state");
    }

    await recordAuditLog(
      {
        actorId: actor.userId,
        actorRole: actor.role,
        targetUserId: updated._id,
        targetModel: "tbl_student",
        targetId: updated._id,
        action: "PUBLISH_PROFILE",
        changedFields: ["is_published", "profile_visibility", "published_at"],
        previousValues: {
          is_published: Boolean(snapshot.student.is_published),
          profile_visibility: snapshot.student.profile_visibility || PROFILE_VISIBILITY.PRIVATE,
        },
        newValues: {
          is_published: true,
          profile_visibility: requestedVisibility,
        },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      auditLogModel,
    );

    return getMyPolicyStatus(actor);
  };

  const unpublishMyProfile = async (actor, reqMeta = {}) => {
    if (!actor || actor.role !== "Student" || !actor.userId) {
      throw new UnauthorizedError("Only students can unpublish their own profile");
    }

    const snapshot = await loadProfileEvaluationSnapshot(actor.userId);
    const now = new Date();
    await studentModel.findOneAndUpdate(
      { _id: snapshot.student._id, is_deleted: { $ne: true } },
      {
        $set: {
          is_published: false,
          profile_visibility: PROFILE_VISIBILITY.PRIVATE,
          visibility_updated_at: now,
        },
      },
      { new: true },
    );

    await recordAuditLog(
      {
        actorId: actor.userId,
        actorRole: actor.role,
        targetUserId: snapshot.student._id,
        targetModel: "tbl_student",
        targetId: snapshot.student._id,
        action: "UNPUBLISH_PROFILE",
        changedFields: ["is_published", "profile_visibility"],
        previousValues: {
          is_published: Boolean(snapshot.student.is_published),
          profile_visibility: snapshot.student.profile_visibility || PROFILE_VISIBILITY.PRIVATE,
        },
        newValues: {
          is_published: false,
          profile_visibility: PROFILE_VISIBILITY.PRIVATE,
        },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      auditLogModel,
    );

    return getMyPolicyStatus(actor);
  };

  const updateMyVisibility = async (actor, body = {}, reqMeta = {}) => {
    if (!actor || actor.role !== "Student" || !actor.userId) {
      throw new UnauthorizedError("Only students can update their profile visibility");
    }
    assertNoMassAssignment(body);

    const requestedVisibility = body.visibility;
    if (!Object.values(PROFILE_VISIBILITY).includes(requestedVisibility)) {
      throw new BadRequestError(
        "Visibility must be Private, Institute Only, or Public",
        PROFILE_VALIDATION_CODES.UNSUPPORTED_STATE,
      );
    }

    if (requestedVisibility === PROFILE_VISIBILITY.PRIVATE) {
      return unpublishMyProfile(actor, reqMeta);
    }

    const snapshot = await loadProfileEvaluationSnapshot(actor.userId);
    if (
      snapshot.student.visibility_override === PROFILE_VISIBILITY_OVERRIDE.RESTRICTED_PRIVATE ||
      snapshot.student.visibility_override === PROFILE_VISIBILITY_OVERRIDE.SUSPENDED
    ) {
      throw new UnauthorizedError(
        "Visibility changes are restricted by platform administration",
        PROFILE_VALIDATION_CODES.ACCOUNT_RESTRICTED,
      );
    }

    if (!snapshot.validation.publishable) {
      throw new UnprocessableEntityError(
        `Cannot set visibility to '${requestedVisibility}' while blocking validation errors exist`,
        PROFILE_VALIDATION_CODES.NOT_PUBLISHABLE,
        snapshot.validation,
      );
    }

    const now = new Date();
    const updated = await studentModel.findOneAndUpdate(
      {
        _id: snapshot.student._id,
        is_deleted: { $ne: true },
        visibility_override: PROFILE_VISIBILITY_OVERRIDE.NONE,
      },
      {
        $set: {
          profile_visibility: requestedVisibility,
          is_published: true,
          published_at: snapshot.student.published_at || now,
          visibility_updated_at: now,
        },
      },
      { new: true },
    );

    if (!updated) {
      throw new UnauthorizedError("Visibility update blocked due to account state");
    }

    await recordAuditLog(
      {
        actorId: actor.userId,
        actorRole: actor.role,
        targetUserId: updated._id,
        targetModel: "tbl_student",
        targetId: updated._id,
        action: "UPDATE_PROFILE_VISIBILITY",
        changedFields: ["profile_visibility", "is_published"],
        previousValues: {
          profile_visibility: snapshot.student.profile_visibility || PROFILE_VISIBILITY.PRIVATE,
        },
        newValues: {
          profile_visibility: requestedVisibility,
        },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      auditLogModel,
    );

    return getMyPolicyStatus(actor);
  };

  const adminOverrideStudentVisibility = async (actor, targetStudentId, body = {}, reqMeta = {}) => {
    if (!actor || actor.role !== "Admin") {
      throw new UnauthorizedError("Only administrators can override profile visibility");
    }

    const overrideState = body.visibility_override;
    if (!Object.values(PROFILE_VISIBILITY_OVERRIDE).includes(overrideState)) {
      throw new BadRequestError("Invalid visibility_override value");
    }

    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : "";
    const snapshot = await loadProfileEvaluationSnapshot(targetStudentId);

    const updates = {
      visibility_override: overrideState,
      visibility_override_reason: reason,
      visibility_updated_at: new Date(),
    };
    if (overrideState !== PROFILE_VISIBILITY_OVERRIDE.NONE) {
      updates.profile_visibility = PROFILE_VISIBILITY.PRIVATE;
      updates.is_published = false;
    }

    await studentModel.findByIdAndUpdate(snapshot.student._id, { $set: updates });

    await recordAuditLog(
      {
        actorId: actor.userId,
        actorRole: actor.role,
        targetUserId: snapshot.student._id,
        targetModel: "tbl_student",
        targetId: snapshot.student._id,
        action: "ADMIN_OVERRIDE_PROFILE_VISIBILITY",
        changedFields: ["visibility_override", "visibility_override_reason"],
        previousValues: {
          visibility_override:
            snapshot.student.visibility_override || PROFILE_VISIBILITY_OVERRIDE.NONE,
          profile_visibility: snapshot.student.profile_visibility || PROFILE_VISIBILITY.PRIVATE,
        },
        newValues: {
          visibility_override: overrideState,
          reason,
        },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      auditLogModel,
    );

    return getStudentPolicyStatus(actor, targetStudentId);
  };

  const viewProfileWithPolicy = async (actor, targetStudentId, { previewAudience = null } = {}) => {
    const scopedActor = await resolveOptionalActor(actor);
    const snapshot = await loadProfileEvaluationSnapshot(targetStudentId);

    const policyDecision = resolveViewAudiencePolicy({
      scopedActor,
      student: snapshot.student,
      studentInstituteId: snapshot.institute_id,
      actorInstituteId: scopedActor ? resolveActorInstituteId(scopedActor) : null,
      validation: snapshot.validation,
      requestedPreviewAudience: previewAudience,
    });

    const projection = projectProfileByAudience({
      student: snapshot.student,
      institute_id: snapshot.institute_id,
      studentSkills: snapshot.studentSkills,
      projects: snapshot.projects,
      projectLinks: snapshot.projectLinks,
      certifications: snapshot.certifications,
      internships: snapshot.internships,
      audience: policyDecision.audience,
      validation: snapshot.validation,
    });

    return {
      ...projection,
      effective_visibility: policyDecision.effective_visibility,
      is_owner: policyDecision.is_owner,
    };
  };

  const discoverPublicProfiles = async ({ search = "", page = 1, limit = 20 } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const query = {
      is_deleted: { $ne: true },
      is_published: true,
      profile_visibility: PROFILE_VISIBILITY.PUBLIC,
      visibility_override: {
        $nin: [PROFILE_VISIBILITY_OVERRIDE.SUSPENDED, PROFILE_VISIBILITY_OVERRIDE.RESTRICTED_PRIVATE],
      },
    };

    const trimmedSearch = typeof search === "string" ? search.trim() : "";
    if (trimmedSearch) {
      query.student_name = { $regex: escapeRegex(trimmedSearch), $options: "i" };
    }

    const candidates = await studentModel
      .find(query)
      .select("_id")
      .sort({ published_at: -1, updatedAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    const evaluated = await Promise.all(
      candidates.map(async (c) => {
        try {
          const snapshot = await loadProfileEvaluationSnapshot(c._id);
          if (!snapshot.visibility.effective_publicly_discoverable) return null;
          return projectProfileByAudience({
            student: snapshot.student,
            institute_id: snapshot.institute_id,
            studentSkills: snapshot.studentSkills,
            projects: snapshot.projects,
            projectLinks: snapshot.projectLinks,
            certifications: snapshot.certifications,
            internships: snapshot.internships,
            audience: "PUBLIC",
            validation: snapshot.validation,
          }).profile;
        } catch {
          return null;
        }
      }),
    );

    const profiles = evaluated.filter(Boolean);
    return {
      profiles,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: profiles.length,
      },
    };
  };

  const getPolicyMetadata = () => ({
    policy_version: PROFILE_POLICY_VERSION,
    visibility_levels: PROFILE_VISIBILITY_META,
    public_allowlist: PUBLIC_PROFILE_ALLOWLIST,
  });

  return {
    getPolicyMetadata,
    getMyPolicyStatus,
    getStudentPolicyStatus,
    publishMyProfile,
    unpublishMyProfile,
    updateMyVisibility,
    adminOverrideStudentVisibility,
    viewProfileWithPolicy,
    discoverPublicProfiles,
  };
};

export const profilePolicyService = createProfilePolicyService();
