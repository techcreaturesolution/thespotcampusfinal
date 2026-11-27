import mongoose from "mongoose";
import tbl_internship from "./internship.model.js";
import tbl_skill from "../skills/skill.model.js";
import tbl_project from "../projects/project.model.js";
import tbl_student from "../student/student.model.js";
import tbl_audit_log from "../audit/auditLog.model.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { academicProfileService } from "../academicProfile/academicProfile.service.js";
import {
  sanitizePlainText,
  validateAndNormalizeProjectUrl,
} from "../projects/projects.service.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/customErrors.js";
import {
  INTERNSHIP_LINK_TYPES,
  INTERNSHIP_STATUS,
  INTERNSHIP_VISIBILITY,
  JOB_TYPE,
  PROJECT_VISIBILITY,
  WORK_MODE,
} from "../../utils/constants.js";

const PROTECTED_PAYLOAD_FIELDS = [
  "student_id",
  "institute_id",
  "college_id",
  "university_id",
  "verification_status",
  "created_by",
  "is_deleted",
  "deleted_at",
  "deleted_by_id",
  "deleted_by_role",
];

const escapeRegex = (val) => String(val).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const validateInternshipDates = (startRaw, endRaw, currentlyWorking) => {
  if (!startRaw) {
    throw new BadRequestError("start_date is required");
  }
  const startDate = new Date(startRaw);
  if (Number.isNaN(startDate.getTime())) {
    throw new BadRequestError("Invalid start_date");
  }

  if (currentlyWorking) {
    return { start_date: startDate, end_date: null };
  }

  if (!endRaw) {
    throw new BadRequestError("end_date is required when currently_working is false");
  }
  const endDate = new Date(endRaw);
  if (Number.isNaN(endDate.getTime())) {
    throw new BadRequestError("Invalid end_date");
  }
  if (endDate < startDate) {
    throw new BadRequestError("end_date cannot be earlier than start_date");
  }

  return { start_date: startDate, end_date: endDate };
};

export const validateAndNormalizeInternshipLinks = (rawLinks = []) => {
  if (!Array.isArray(rawLinks)) {
    throw new BadRequestError("links must be an array");
  }
  const allowedTypes = new Set(Object.values(INTERNSHIP_LINK_TYPES));
  const seenUrls = new Set();
  const cleaned = [];

  for (const item of rawLinks.slice(0, 10)) {
    if (!item || typeof item !== "object") {
      throw new BadRequestError("Each link must be an object");
    }
    const linkType = item.link_type || INTERNSHIP_LINK_TYPES.OTHER;
    if (!allowedTypes.has(linkType)) {
      throw new BadRequestError(`Unsupported internship link type: ${linkType}`);
    }
    const normalizedUrl = validateAndNormalizeProjectUrl(item.url, "Experience link URL");
    if (!normalizedUrl) {
      throw new BadRequestError("Link URL is required");
    }
    const dedupeKey = normalizedUrl.toLowerCase().replace(/\/+$/, "");
    if (seenUrls.has(dedupeKey)) {
      throw new BadRequestError(`Duplicate internship link URL: ${normalizedUrl}`);
    }
    seenUrls.add(dedupeKey);
    cleaned.push({
      link_type: linkType,
      url: normalizedUrl,
      label: sanitizePlainText(item.label).slice(0, 80),
    });
  }

  return cleaned;
};

const formatInternshipResponse = (
  doc,
  skillMap = new Map(),
  projectMap = new Map(),
  { canViewPrivateProjects = false } = {},
) => {
  const skills = (doc.skill_ids || [])
    .map((id) => skillMap.get(String(id?._id || id)))
    .filter(Boolean)
    .map((s) => ({
      id: s._id,
      name: s.name,
      category: s.category,
      is_active: Boolean(s.is_active),
    }));

  const projects = (doc.project_ids || [])
    .map((id) => projectMap.get(String(id?._id || id)))
    .filter((p) => p && (canViewPrivateProjects || p.visibility !== PROJECT_VISIBILITY.PRIVATE))
    .map((p) => ({
      id: p._id,
      title: p.title,
      status: p.status,
      visibility: p.visibility,
    }));

  const currentlyWorking = Boolean(doc.currently_working);
  return {
    id: doc._id,
    student_id: doc.student_id,
    role_title: doc.role_title,
    organization_name: doc.organization_name,
    employment_type: doc.employment_type || JOB_TYPE.INTERNSHIP,
    work_mode: doc.work_mode || WORK_MODE.HYBRID,
    location: doc.location || "",
    start_date: doc.start_date || null,
    end_date: currentlyWorking ? null : doc.end_date || null,
    currently_working: currentlyWorking,
    description: doc.description || "",
    responsibilities: doc.responsibilities || "",
    achievements: doc.achievements || "",
    company_website: doc.company_website || "",
    links: Array.isArray(doc.links) ? doc.links : [],
    skill_ids: skills.map((s) => s.id),
    skills,
    project_ids: projects.map((p) => p.id),
    projects,
    visibility: doc.visibility || INTERNSHIP_VISIBILITY.PUBLIC,
    status: doc.status || INTERNSHIP_STATUS.ACTIVE,
    display_order: doc.display_order ?? 0,
    created_at: doc.createdAt || null,
    updated_at: doc.updatedAt || null,
  };
};

export const createInternshipService = (deps = {}) => {
  const Internship = deps.Internship || tbl_internship;
  const Skill = deps.Skill || tbl_skill;
  const Project = deps.Project || tbl_project;
  const Student = deps.Student || tbl_student;
  const AuditLog = deps.AuditLog || tbl_audit_log;
  const accessService = deps.accessService || academicProfileService;
  const isValidObjectId = deps.isValidObjectId || mongoose.isValidObjectId;

  const assertValidId = (id, label = "ID") => {
    if (!id || !isValidObjectId(id)) {
      throw new BadRequestError(`Invalid ${label} format`);
    }
  };

  const assertWritablePayloadSafe = (payload) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestError("Request body must be a JSON object");
    }
    for (const key of PROTECTED_PAYLOAD_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        throw new UnauthorizedError(`Field '${key}' cannot be supplied by client`);
      }
    }
  };

  const loadTargetStudent = async (studentId) => {
    assertValidId(studentId, "student ID");
    const student = await Student.findById(studentId);
    if (!student || student.is_deleted) {
      throw new NotFoundError(`No student found with id: ${studentId}`);
    }
    return student;
  };

  const assertVisibleToActor = (scopedActor, studentId, item) => {
    if (scopedActor.role === "Admin" || String(scopedActor.userId) === String(studentId)) {
      return true;
    }
    return item.visibility !== INTERNSHIP_VISIBILITY.PRIVATE;
  };

  const validateSkillIds = async (skillIds = []) => {
    if (!Array.isArray(skillIds)) {
      throw new BadRequestError("skill_ids must be an array");
    }
    const unique = [...new Set(skillIds.map((id) => String(id).trim()).filter(Boolean))];
    if (unique.length === 0) return [];
    for (const id of unique) assertValidId(id, "skill ID");
    const found = await Skill.find({
      _id: { $in: unique },
      is_deleted: false,
      is_active: true,
    });
    if (found.length !== unique.length) {
      throw new BadRequestError("One or more selected skills do not exist or are inactive");
    }
    return unique;
  };

  const validateOwnedProjectIds = async (studentId, projectIds = []) => {
    if (!Array.isArray(projectIds)) {
      throw new BadRequestError("project_ids must be an array");
    }
    const unique = [...new Set(projectIds.map((id) => String(id).trim()).filter(Boolean))];
    if (unique.length === 0) return [];
    for (const id of unique) assertValidId(id, "project ID");
    const found = await Project.find({
      _id: { $in: unique },
      student_id: studentId,
      is_deleted: false,
    });
    if (found.length !== unique.length) {
      throw new BadRequestError(
        "One or more selected projects do not belong to the student or do not exist",
      );
    }
    return unique;
  };

  const batchLoadRelations = async (studentId, docs) => {
    const allSkillIds = [
      ...new Set(docs.flatMap((d) => (d.skill_ids || []).map((id) => String(id?._id || id)))),
    ];
    const allProjectIds = [
      ...new Set(docs.flatMap((d) => (d.project_ids || []).map((id) => String(id?._id || id)))),
    ];

    const [skills, projects] = await Promise.all([
      allSkillIds.length
        ? Skill.find({ _id: { $in: allSkillIds }, is_deleted: false })
        : Promise.resolve([]),
      allProjectIds.length
        ? Project.find({ _id: { $in: allProjectIds }, student_id: studentId, is_deleted: false })
        : Promise.resolve([]),
    ]);

    const skillMap = new Map(skills.map((s) => [String(s._id), s]));
    const projectMap = new Map(projects.map((p) => [String(p._id), p]));
    return { skillMap, projectMap };
  };

  const ensureNoDuplicate = async (
    studentId,
    { normalizedOrganization, normalizedRole, startDate, endDate, currentlyWorking },
    excludeId = null,
  ) => {
    const filter = {
      student_id: studentId,
      is_deleted: false,
      normalized_organization: normalizedOrganization,
      normalized_role: normalizedRole,
      start_date: startDate,
      currently_working: currentlyWorking,
      end_date: currentlyWorking ? null : endDate,
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const dup = await Internship.findOne(filter);
    if (dup) {
      throw new BadRequestError(
        "An identical internship experience record already exists for these dates",
      );
    }
  };

  const getMetadata = () => ({
    employment_types: Object.values(JOB_TYPE),
    work_modes: Object.values(WORK_MODE),
    statuses: Object.values(INTERNSHIP_STATUS),
    visibilities: Object.values(INTERNSHIP_VISIBILITY),
    link_types: Object.values(INTERNSHIP_LINK_TYPES),
  });

  const listStudentInternships = async (
    actor,
    targetStudentId,
    { status = "", work_mode = "", search = "", sort = "display_order", page = 1, limit = 20 } = {},
  ) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const filter = { student_id: student._id, is_deleted: false };

    if (status) {
      if (!Object.values(INTERNSHIP_STATUS).includes(status)) {
        throw new BadRequestError("Invalid internship status filter");
      }
      filter.status = status;
    }

    if (work_mode) {
      if (!Object.values(WORK_MODE).includes(work_mode)) {
        throw new BadRequestError("Invalid work_mode filter");
      }
      filter.work_mode = work_mode;
    }

    const cleanSearch = sanitizePlainText(search).slice(0, 100);
    if (cleanSearch) {
      const rx = new RegExp(escapeRegex(cleanSearch), "i");
      filter.$or = [{ role_title: rx }, { organization_name: rx }, { location: rx }];
    }

    const isOwnerOrAdmin =
      scopedActor.role === "Admin" || String(scopedActor.userId) === String(student._id);
    if (!isOwnerOrAdmin) {
      filter.visibility = { $ne: INTERNSHIP_VISIBILITY.PRIVATE };
    }

    const sortSpec =
      sort === "timeline"
        ? { currently_working: -1, start_date: -1, end_date: -1, createdAt: -1 }
        : { display_order: 1, currently_working: -1, start_date: -1, createdAt: -1 };

    const [internships, total] = await Promise.all([
      Internship.find(filter)
        .sort(sortSpec)
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Internship.countDocuments(filter),
    ]);

    const visibleItems = internships.filter((item) =>
      assertVisibleToActor(scopedActor, student._id, item),
    );
    const { skillMap, projectMap } = await batchLoadRelations(student._id, visibleItems);

    return {
      student_id: student._id,
      internships: visibleItems.map((item) =>
        formatInternshipResponse(item, skillMap, projectMap, {
          canViewPrivateProjects: isOwnerOrAdmin,
        }),
      ),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        total_pages: Math.ceil(total / safeLimit) || 1,
      },
      ...getMetadata(),
    };
  };

  const getInternshipById = async (actor, targetStudentId, internshipId) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");
    assertValidId(internshipId, "internship ID");

    const item = await Internship.findOne({
      _id: internshipId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!item) {
      throw new NotFoundError("Internship experience not found");
    }
    if (!assertVisibleToActor(scopedActor, student._id, item)) {
      throw new UnauthorizedError("This internship experience is private");
    }

    const isOwnerOrAdmin =
      scopedActor.role === "Admin" || String(scopedActor.userId) === String(student._id);
    const { skillMap, projectMap } = await batchLoadRelations(student._id, [item]);

    return {
      internship: formatInternshipResponse(item, skillMap, projectMap, {
        canViewPrivateProjects: isOwnerOrAdmin,
      }),
    };
  };

  const createInternship = async (actor, targetStudentId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertWritablePayloadSafe(payload);

    const roleTitle = sanitizePlainText(payload.role_title);
    if (roleTitle.length < 2 || roleTitle.length > 120) {
      throw new BadRequestError("Role / job title must be between 2 and 120 characters");
    }

    const organizationName = sanitizePlainText(payload.organization_name);
    if (organizationName.length < 2 || organizationName.length > 120) {
      throw new BadRequestError("Organization name must be between 2 and 120 characters");
    }

    const employmentType = payload.employment_type || JOB_TYPE.INTERNSHIP;
    if (!Object.values(JOB_TYPE).includes(employmentType)) {
      throw new BadRequestError("Invalid employment_type");
    }

    const workMode = payload.work_mode || WORK_MODE.HYBRID;
    if (!Object.values(WORK_MODE).includes(workMode)) {
      throw new BadRequestError("Invalid work_mode");
    }

    const visibility = payload.visibility || INTERNSHIP_VISIBILITY.PUBLIC;
    if (!Object.values(INTERNSHIP_VISIBILITY).includes(visibility)) {
      throw new BadRequestError("Invalid visibility");
    }

    const status = payload.status || INTERNSHIP_STATUS.ACTIVE;
    if (!Object.values(INTERNSHIP_STATUS).includes(status)) {
      throw new BadRequestError("Invalid status");
    }

    const currentlyWorking = Boolean(payload.currently_working);
    const { start_date, end_date } = validateInternshipDates(
      payload.start_date,
      payload.end_date,
      currentlyWorking,
    );

    const location = sanitizePlainText(payload.location).slice(0, 120);
    const description = sanitizePlainText(payload.description).slice(0, 2000);
    const responsibilities = sanitizePlainText(payload.responsibilities).slice(0, 2000);
    const achievements = sanitizePlainText(payload.achievements).slice(0, 1500);
    const companyWebsite = validateAndNormalizeProjectUrl(
      payload.company_website,
      "Company website",
    );
    const links =
      payload.links !== undefined ? validateAndNormalizeInternshipLinks(payload.links) : [];

    const [skillIds, projectIds] = await Promise.all([
      payload.skill_ids !== undefined ? validateSkillIds(payload.skill_ids) : Promise.resolve([]),
      payload.project_ids !== undefined
        ? validateOwnedProjectIds(student._id, payload.project_ids)
        : Promise.resolve([]),
    ]);

    const normalizedRole = roleTitle.toLowerCase();
    const normalizedOrg = organizationName.toLowerCase();

    await ensureNoDuplicate(student._id, {
      normalizedOrganization: normalizedOrg,
      normalizedRole,
      startDate: start_date,
      endDate: end_date,
      currentlyWorking,
    });

    const currentCount = await Internship.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });

    const created = await Internship.create({
      student_id: student._id,
      role_title: roleTitle,
      normalized_role: normalizedRole,
      organization_name: organizationName,
      normalized_organization: normalizedOrg,
      employment_type: employmentType,
      work_mode: workMode,
      location,
      start_date,
      end_date,
      currently_working: currentlyWorking,
      description,
      responsibilities,
      achievements,
      company_website: companyWebsite,
      links,
      skill_ids: skillIds,
      project_ids: projectIds,
      visibility,
      status,
      display_order: currentCount,
      is_deleted: false,
    });

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_internship",
        targetId: created._id,
        action: "CREATE_INTERNSHIP",
        changedFields: Object.keys(payload),
        previousValues: {},
        newValues: {
          role_title: roleTitle,
          organization_name: organizationName,
          currently_working: currentlyWorking,
          visibility,
        },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const { skillMap, projectMap } = await batchLoadRelations(student._id, [created]);
    return {
      msg: "Internship experience added",
      internship: formatInternshipResponse(created, skillMap, projectMap, {
        canViewPrivateProjects: true,
      }),
    };
  };

  const updateInternship = async (actor, targetStudentId, internshipId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(internshipId, "internship ID");
    assertWritablePayloadSafe(payload);

    const existing = await Internship.findOne({
      _id: internshipId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Internship experience not found");
    }

    const previousSnapshot = {
      role_title: existing.role_title,
      organization_name: existing.organization_name,
      currently_working: existing.currently_working,
      visibility: existing.visibility,
      status: existing.status,
    };
    const changedFields = [];

    if (payload.role_title !== undefined) {
      const nextRole = sanitizePlainText(payload.role_title);
      if (nextRole.length < 2 || nextRole.length > 120) {
        throw new BadRequestError("Role / job title must be between 2 and 120 characters");
      }
      existing.role_title = nextRole;
      existing.normalized_role = nextRole.toLowerCase();
      changedFields.push("role_title");
    }

    if (payload.organization_name !== undefined) {
      const nextOrg = sanitizePlainText(payload.organization_name);
      if (nextOrg.length < 2 || nextOrg.length > 120) {
        throw new BadRequestError("Organization name must be between 2 and 120 characters");
      }
      existing.organization_name = nextOrg;
      existing.normalized_organization = nextOrg.toLowerCase();
      changedFields.push("organization_name");
    }

    if (payload.employment_type !== undefined) {
      if (!Object.values(JOB_TYPE).includes(payload.employment_type)) {
        throw new BadRequestError("Invalid employment_type");
      }
      existing.employment_type = payload.employment_type;
      changedFields.push("employment_type");
    }

    if (payload.work_mode !== undefined) {
      if (!Object.values(WORK_MODE).includes(payload.work_mode)) {
        throw new BadRequestError("Invalid work_mode");
      }
      existing.work_mode = payload.work_mode;
      changedFields.push("work_mode");
    }

    if (payload.visibility !== undefined) {
      if (!Object.values(INTERNSHIP_VISIBILITY).includes(payload.visibility)) {
        throw new BadRequestError("Invalid visibility");
      }
      existing.visibility = payload.visibility;
      changedFields.push("visibility");
    }

    if (payload.status !== undefined) {
      if (!Object.values(INTERNSHIP_STATUS).includes(payload.status)) {
        throw new BadRequestError("Invalid status");
      }
      existing.status = payload.status;
      changedFields.push("status");
    }

    if (payload.location !== undefined) {
      existing.location = sanitizePlainText(payload.location).slice(0, 120);
      changedFields.push("location");
    }
    if (payload.description !== undefined) {
      existing.description = sanitizePlainText(payload.description).slice(0, 2000);
      changedFields.push("description");
    }
    if (payload.responsibilities !== undefined) {
      existing.responsibilities = sanitizePlainText(payload.responsibilities).slice(0, 2000);
      changedFields.push("responsibilities");
    }
    if (payload.achievements !== undefined) {
      existing.achievements = sanitizePlainText(payload.achievements).slice(0, 1500);
      changedFields.push("achievements");
    }
    if (payload.company_website !== undefined) {
      existing.company_website = validateAndNormalizeProjectUrl(
        payload.company_website,
        "Company website",
      );
      changedFields.push("company_website");
    }
    if (payload.links !== undefined) {
      existing.links = validateAndNormalizeInternshipLinks(payload.links);
      changedFields.push("links");
    }
    if (payload.skill_ids !== undefined) {
      existing.skill_ids = await validateSkillIds(payload.skill_ids);
      changedFields.push("skill_ids");
    }
    if (payload.project_ids !== undefined) {
      existing.project_ids = await validateOwnedProjectIds(student._id, payload.project_ids);
      changedFields.push("project_ids");
    }

    const nextCurrentlyWorking =
      payload.currently_working !== undefined
        ? Boolean(payload.currently_working)
        : Boolean(existing.currently_working);
    const nextStartRaw = payload.start_date !== undefined ? payload.start_date : existing.start_date;
    const nextEndRaw = nextCurrentlyWorking
      ? null
      : payload.end_date !== undefined
        ? payload.end_date
        : existing.end_date;

    const { start_date, end_date } = validateInternshipDates(
      nextStartRaw,
      nextEndRaw,
      nextCurrentlyWorking,
    );
    existing.currently_working = nextCurrentlyWorking;
    existing.start_date = start_date;
    existing.end_date = end_date;
    if (
      payload.start_date !== undefined ||
      payload.end_date !== undefined ||
      payload.currently_working !== undefined
    ) {
      changedFields.push("dates");
    }

    await ensureNoDuplicate(
      student._id,
      {
        normalizedOrganization: existing.normalized_organization,
        normalizedRole: existing.normalized_role,
        startDate: existing.start_date,
        endDate: existing.end_date,
        currentlyWorking: existing.currently_working,
      },
      existing._id,
    );

    await existing.save();

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_internship",
        targetId: existing._id,
        action: "UPDATE_INTERNSHIP",
        changedFields,
        previousValues: previousSnapshot,
        newValues: {
          role_title: existing.role_title,
          organization_name: existing.organization_name,
          currently_working: existing.currently_working,
          visibility: existing.visibility,
          status: existing.status,
        },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const { skillMap, projectMap } = await batchLoadRelations(student._id, [existing]);
    return {
      msg: "Internship experience updated",
      internship: formatInternshipResponse(existing, skillMap, projectMap, {
        canViewPrivateProjects: true,
      }),
    };
  };

  const deleteInternship = async (actor, targetStudentId, internshipId, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(internshipId, "internship ID");

    const existing = await Internship.findOne({
      _id: internshipId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Internship experience not found");
    }

    existing.is_deleted = true;
    existing.deleted_at = new Date();
    existing.deleted_by_id = scopedActor.userId;
    existing.deleted_by_role = scopedActor.role;
    await existing.save();

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_internship",
        targetId: existing._id,
        action: "DELETE_INTERNSHIP",
        changedFields: ["is_deleted"],
        previousValues: {
          role_title: existing.role_title,
          organization_name: existing.organization_name,
        },
        newValues: { is_deleted: true },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { msg: "Internship experience removed" };
  };

  const reorderInternships = async (actor, targetStudentId, orders = [], reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");

    if (!Array.isArray(orders) || orders.length === 0) {
      throw new BadRequestError("orders must be a non-empty array");
    }

    const active = await Internship.find({ student_id: student._id, is_deleted: false });
    const ownedIds = new Set(active.map((i) => String(i._id)));

    for (const item of orders) {
      assertValidId(item?.internship_id, "internship ID");
      if (!ownedIds.has(String(item.internship_id))) {
        throw new BadRequestError("All internship_id values must belong to the student");
      }
      if (!Number.isInteger(Number(item.display_order)) || Number(item.display_order) < 0) {
        throw new BadRequestError("display_order must be a non-negative integer");
      }
    }

    await Promise.all(
      orders.map((item) =>
        Internship.findByIdAndUpdate(
          item.internship_id,
          { $set: { display_order: Number(item.display_order) } },
          { new: true },
        ),
      ),
    );

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_internship",
        targetId: student._id,
        action: "REORDER_INTERNSHIPS",
        changedFields: ["display_order"],
        previousValues: {},
        newValues: { count: orders.length },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return listStudentInternships(actor, student._id);
  };

  return {
    getMetadata,
    listStudentInternships,
    getInternshipById,
    createInternship,
    updateInternship,
    deleteInternship,
    reorderInternships,
  };
};

export const internshipService = createInternshipService();
