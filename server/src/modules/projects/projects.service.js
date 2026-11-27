import mongoose from "mongoose";
import tbl_project from "./project.model.js";
import tbl_project_skill from "./projectSkill.model.js";
import tbl_project_link from "./projectLink.model.js";
import tbl_skill from "../skills/skill.model.js";
import tbl_student from "../student/student.model.js";
import tbl_audit_log from "../audit/auditLog.model.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { academicProfileService } from "../academicProfile/academicProfile.service.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/customErrors.js";
import {
  PROJECT_STATUS,
  PROJECT_VISIBILITY,
  PROJECT_LINK_TYPES,
  PROJECT_LINK_TYPE_META,
} from "../../utils/constants.js";

const extractId = (val) => {
  if (!val) return null;
  if (typeof val === "object" && val._id) return val._id.toString();
  return String(val);
};

export const sanitizePlainText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const validateAndNormalizeProjectUrl = (rawUrl, fieldLabel = "URL") => {
  if (rawUrl === undefined || rawUrl === null) return "";
  const trimmed = String(rawUrl).trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    throw new BadRequestError(`${fieldLabel} uses an unsafe protocol`);
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new BadRequestError(`${fieldLabel} must be a valid http or https URL`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new BadRequestError(`${fieldLabel} must use http or https protocol`);
  }
  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    throw new BadRequestError(`${fieldLabel} must contain a valid domain`);
  }

  return parsed.toString();
};

export const normalizeLinkForComparison = (linkType, parsedUrl) => {
  const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, "");
  let pathname = parsedUrl.pathname.replace(/\/+$/, "");
  if (
    [
      PROJECT_LINK_TYPES.GITHUB_REPOSITORY,
      PROJECT_LINK_TYPES.GITLAB_REPOSITORY,
      PROJECT_LINK_TYPES.BITBUCKET_REPOSITORY,
    ].includes(linkType)
  ) {
    pathname = pathname.toLowerCase();
  }
  return `${parsedUrl.protocol.toLowerCase()}//${host}${pathname}${parsedUrl.search}`;
};

export const validateProviderLink = (linkType, rawUrl, rawLabel = "") => {
  const meta = PROJECT_LINK_TYPE_META.find((m) => m.code === linkType);
  if (!meta) {
    throw new BadRequestError("Unsupported project link type");
  }

  const normalizedStr = validateAndNormalizeProjectUrl(rawUrl, meta.label);
  if (!normalizedStr) {
    throw new BadRequestError(`${meta.label} URL is required`);
  }
  if (normalizedStr.length > 500) {
    throw new BadRequestError(`${meta.label} URL must not exceed 500 characters`);
  }

  const parsed = new URL(normalizedStr);
  const host = parsed.hostname.toLowerCase();

  if (meta.allowed_hosts) {
    if (parsed.protocol !== "https:") {
      throw new BadRequestError(`${meta.label} URL must use https:// protocol`);
    }
    if (!meta.allowed_hosts.includes(host)) {
      throw new BadRequestError(
        `${meta.label} URL host must be one of: ${meta.allowed_hosts.join(", ")}`,
      );
    }
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      throw new BadRequestError(
        `${meta.label} URL must point to a valid repository (e.g. https://${meta.allowed_hosts[0]}/owner/repository)`,
      );
    }
  }

  const cleanLabel = sanitizePlainText(rawLabel).slice(0, 80) || meta.label;
  return {
    link_type: meta.code,
    url: normalizedStr,
    normalized_url: normalizeLinkForComparison(meta.code, parsed),
    label: cleanLabel,
  };
};

export const inferRepositoryLinkType = (rawUrl) => {
  try {
    const host = new URL(String(rawUrl).trim()).hostname.toLowerCase();
    if (host === "gitlab.com" || host === "www.gitlab.com") {
      return PROJECT_LINK_TYPES.GITLAB_REPOSITORY;
    }
    if (host === "bitbucket.org" || host === "www.bitbucket.org") {
      return PROJECT_LINK_TYPES.BITBUCKET_REPOSITORY;
    }
  } catch {
    // default to GitHub repository validation
  }
  return PROJECT_LINK_TYPES.GITHUB_REPOSITORY;
};

const formatProjectLink = (doc) => {
  const meta = PROJECT_LINK_TYPE_META.find((m) => m.code === doc.link_type);
  return {
    id: doc._id,
    project_id: doc.project_id,
    link_type: doc.link_type,
    label: doc.label || meta?.label || doc.link_type,
    url: doc.url,
    display_order: doc.display_order ?? 0,
    updated_at: doc.updatedAt || null,
  };
};

const formatProjectResponse = (projectDoc, skillAssociations = [], linkDocs = []) => {
  const formattedLinks = linkDocs.map(formatProjectLink);
  const repoLink = formattedLinks.find((l) =>
    [
      PROJECT_LINK_TYPES.GITHUB_REPOSITORY,
      PROJECT_LINK_TYPES.GITLAB_REPOSITORY,
      PROJECT_LINK_TYPES.BITBUCKET_REPOSITORY,
    ].includes(l.link_type),
  );
  const demoLink = formattedLinks.find((l) => l.link_type === PROJECT_LINK_TYPES.LIVE_DEMO);
  const websiteLink = formattedLinks.find(
    (l) =>
      l.link_type === PROJECT_LINK_TYPES.PROJECT_WEBSITE ||
      l.link_type === PROJECT_LINK_TYPES.DOCUMENTATION,
  );

  return {
    id: projectDoc._id,
    student_id: projectDoc.student_id,
    title: projectDoc.title,
    description: projectDoc.description,
    role: projectDoc.role || "",
    status: projectDoc.status,
    visibility: projectDoc.visibility,
    is_ongoing: Boolean(projectDoc.is_ongoing),
    start_date: projectDoc.start_date || null,
    end_date: projectDoc.end_date || null,
    team_size: projectDoc.team_size ?? 1,
    project_url: websiteLink?.url || projectDoc.project_url || "",
    repository_url: repoLink?.url || projectDoc.repository_url || "",
    live_demo_url: demoLink?.url || projectDoc.live_demo_url || "",
    links: formattedLinks,
    display_order: projectDoc.display_order ?? 0,
    skills: skillAssociations
      .filter((assoc) => assoc.skill_id && typeof assoc.skill_id === "object")
      .map((assoc) => ({
        id: assoc.skill_id._id,
        name: assoc.skill_id.name,
        category: assoc.skill_id.category,
        is_active: Boolean(assoc.skill_id.is_active),
      })),
    created_at: projectDoc.createdAt || null,
    updated_at: projectDoc.updatedAt || null,
  };
};

export const createProjectsService = (deps = {}) => {
  const Project = deps.Project || tbl_project;
  const ProjectSkill = deps.ProjectSkill || tbl_project_skill;
  const ProjectLink = deps.ProjectLink || tbl_project_link;
  const Skill = deps.Skill || tbl_skill;
  const Student = deps.Student || tbl_student;
  const AuditLog = deps.AuditLog || tbl_audit_log;
  const accessService = deps.accessService || academicProfileService;
  const isValidObjectId = deps.isValidObjectId || mongoose.isValidObjectId;

  const assertValidId = (id, label = "ID") => {
    if (!id || !isValidObjectId(id)) {
      throw new BadRequestError(`Invalid ${label} format`);
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

  const validateDates = (startRaw, endRaw, isOngoing) => {
    const startDate = startRaw ? new Date(startRaw) : null;
    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new BadRequestError("Invalid start_date");
    }

    if (isOngoing) {
      return { start_date: startDate, end_date: null };
    }

    const endDate = endRaw ? new Date(endRaw) : null;
    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestError("Invalid end_date");
    }

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestError("end_date cannot be earlier than start_date");
    }

    return { start_date: startDate, end_date: endDate };
  };

  const validateAndDedupeCanonicalSkillIds = async (skillIds = []) => {
    if (!Array.isArray(skillIds)) {
      throw new BadRequestError("skill_ids must be an array");
    }
    const uniqueIds = [...new Set(skillIds.map((id) => String(id).trim()).filter(Boolean))];
    if (uniqueIds.length === 0) return [];

    for (const id of uniqueIds) {
      assertValidId(id, "skill ID");
    }

    const foundSkills = await Skill.find({
      _id: { $in: uniqueIds },
      is_deleted: false,
      is_active: true,
    });
    if (foundSkills.length !== uniqueIds.length) {
      throw new BadRequestError("One or more selected skills do not exist or are inactive");
    }
    return uniqueIds;
  };

  const syncProjectSkills = async (project, studentId, skillIds) => {
    const cleanIds = await validateAndDedupeCanonicalSkillIds(skillIds);
    const existing = await ProjectSkill.find({ project_id: project._id, is_deleted: false });
    const existingSet = new Set(existing.map((e) => String(e.skill_id)));
    const nextSet = new Set(cleanIds);

    const toDelete = existing.filter((e) => !nextSet.has(String(e.skill_id)));
    for (const item of toDelete) {
      item.is_deleted = true;
      item.deleted_at = new Date();
      await item.save();
    }

    const toCreate = cleanIds.filter((id) => !existingSet.has(id));
    for (const skillId of toCreate) {
      await ProjectSkill.create({
        project_id: project._id,
        student_id: studentId,
        skill_id: skillId,
        is_deleted: false,
      });
    }
  };

  const loadSkillsForProjects = async (projectIds) => {
    if (!projectIds.length) return new Map();
    const associations = await ProjectSkill.find({
      project_id: { $in: projectIds },
      is_deleted: false,
    }).populate("skill_id", "name category is_active");

    const map = new Map();
    for (const assoc of associations) {
      const key = String(assoc.project_id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(assoc);
    }
    return map;
  };

  const loadLinksForProjects = async (projectIds) => {
    if (!projectIds.length || !ProjectLink) return new Map();
    const links = await ProjectLink.find({
      project_id: { $in: projectIds },
      is_deleted: false,
    }).sort({ display_order: 1, createdAt: 1 });

    const map = new Map();
    for (const link of links) {
      const key = String(link.project_id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(link);
    }
    return map;
  };

  const validateAndNormalizeLinkList = (rawLinks = []) => {
    if (!Array.isArray(rawLinks)) {
      throw new BadRequestError("links must be an array");
    }
    const seenNormalizedUrls = new Set();
    let githubCount = 0;
    const validated = [];

    for (const item of rawLinks) {
      if (!item || typeof item !== "object") {
        throw new BadRequestError("Each project link must be an object");
      }
      const checked = validateProviderLink(item.link_type, item.url, item.label || "");
      if (seenNormalizedUrls.has(checked.normalized_url)) {
        throw new BadRequestError(`Duplicate project link URL: ${checked.url}`);
      }
      seenNormalizedUrls.add(checked.normalized_url);
      if (checked.link_type === PROJECT_LINK_TYPES.GITHUB_REPOSITORY) {
        githubCount++;
        if (githubCount > 1) {
          throw new BadRequestError("A project can have at most one GitHub repository link");
        }
      }
      validated.push(checked);
    }
    return validated;
  };

  const buildLinksFromLegacyFields = (payload) => {
    const built = [];
    if (payload.repository_url && String(payload.repository_url).trim()) {
      built.push({
        link_type: inferRepositoryLinkType(payload.repository_url),
        url: payload.repository_url,
      });
    }
    if (payload.live_demo_url && String(payload.live_demo_url).trim()) {
      built.push({
        link_type: PROJECT_LINK_TYPES.LIVE_DEMO,
        url: payload.live_demo_url,
      });
    }
    if (payload.project_url && String(payload.project_url).trim()) {
      built.push({
        link_type: PROJECT_LINK_TYPES.PROJECT_WEBSITE,
        url: payload.project_url,
      });
    }
    return built;
  };

  const syncProjectLinks = async (project, studentId, validatedLinks) => {
    if (!ProjectLink) return;
    const existing = await ProjectLink.find({ project_id: project._id, is_deleted: false });
    for (const doc of existing) {
      doc.is_deleted = true;
      doc.deleted_at = new Date();
      await doc.save();
    }

    for (let i = 0; i < validatedLinks.length; i++) {
      const link = validatedLinks[i];
      await ProjectLink.create({
        project_id: project._id,
        student_id: studentId,
        link_type: link.link_type,
        url: link.url,
        normalized_url: link.normalized_url,
        label: link.label,
        display_order: i,
        is_deleted: false,
      });
    }
  };

  const assertVisibleToActor = (scopedActor, studentId, project) => {
    if (scopedActor.role === "Admin" || String(scopedActor.userId) === String(studentId)) {
      return true;
    }
    return project.visibility !== PROJECT_VISIBILITY.PRIVATE;
  };

  const getMetadata = () => ({
    statuses: Object.values(PROJECT_STATUS),
    visibilities: Object.values(PROJECT_VISIBILITY),
    link_types: PROJECT_LINK_TYPE_META.map(({ code, label, single_per_project }) => ({
      code,
      label,
      single_per_project,
    })),
  });

  const listStudentProjects = async (actor, targetStudentId, { status = "", page = 1, limit = 20 } = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));

    const filter = { student_id: student._id, is_deleted: false };
    if (status) {
      if (!Object.values(PROJECT_STATUS).includes(status)) {
        throw new BadRequestError("Invalid project status filter");
      }
      filter.status = status;
    }
    if (scopedActor.role !== "Admin" && String(scopedActor.userId) !== String(student._id)) {
      filter.visibility = { $ne: PROJECT_VISIBILITY.PRIVATE };
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ display_order: 1, createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Project.countDocuments(filter),
    ]);

    const visibleProjects = projects.filter((p) => assertVisibleToActor(scopedActor, student._id, p));
    const visibleIds = visibleProjects.map((p) => p._id);
    const [skillsMap, linksMap] = await Promise.all([
      loadSkillsForProjects(visibleIds),
      loadLinksForProjects(visibleIds),
    ]);

    return {
      student_id: student._id,
      projects: visibleProjects.map((p) =>
        formatProjectResponse(p, skillsMap.get(String(p._id)) || [], linksMap.get(String(p._id)) || []),
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

  const getProjectById = async (actor, targetStudentId, projectId) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");
    assertValidId(projectId, "project ID");

    const project = await Project.findOne({
      _id: projectId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    if (!assertVisibleToActor(scopedActor, student._id, project)) {
      throw new UnauthorizedError("This project is private");
    }

    const [skillsMap, linksMap] = await Promise.all([
      loadSkillsForProjects([project._id]),
      loadLinksForProjects([project._id]),
    ]);
    return {
      project: formatProjectResponse(
        project,
        skillsMap.get(String(project._id)) || [],
        linksMap.get(String(project._id)) || [],
      ),
    };
  };

  const createProject = async (actor, targetStudentId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");

    if (!payload || typeof payload !== "object") {
      throw new BadRequestError("Request body must be a JSON object");
    }
    if (payload.student_id || payload.college_id) {
      throw new UnauthorizedError("Ownership and college identifiers cannot be supplied in payload");
    }

    const title = sanitizePlainText(payload.title);
    const description = sanitizePlainText(payload.description);
    if (title.length < 2 || title.length > 120) {
      throw new BadRequestError("Project title must be between 2 and 120 characters");
    }
    if (description.length < 10 || description.length > 2000) {
      throw new BadRequestError("Project description must be between 10 and 2000 characters");
    }

    const status = payload.status || PROJECT_STATUS.COMPLETED;
    if (!Object.values(PROJECT_STATUS).includes(status)) {
      throw new BadRequestError("Invalid project status");
    }
    const visibility = payload.visibility || PROJECT_VISIBILITY.PUBLIC;
    if (!Object.values(PROJECT_VISIBILITY).includes(visibility)) {
      throw new BadRequestError("Invalid project visibility");
    }

    const isOngoing = Boolean(payload.is_ongoing);
    const { start_date, end_date } = validateDates(payload.start_date, payload.end_date, isOngoing);

    const teamSize = payload.team_size !== undefined && payload.team_size !== null ? Number(payload.team_size) : 1;
    if (!Number.isInteger(teamSize) || teamSize < 1 || teamSize > 100) {
      throw new BadRequestError("team_size must be an integer between 1 and 100");
    }

    const projectUrl = validateAndNormalizeProjectUrl(payload.project_url, "project_url");
    const repoUrl = validateAndNormalizeProjectUrl(payload.repository_url, "repository_url");
    const demoUrl = validateAndNormalizeProjectUrl(payload.live_demo_url, "live_demo_url");

    const rawLinksToCreate =
      payload.links !== undefined
        ? payload.links
        : buildLinksFromLegacyFields({
            project_url: projectUrl,
            repository_url: repoUrl,
            live_demo_url: demoUrl,
          });
    const validatedLinks = validateAndNormalizeLinkList(rawLinksToCreate);

    const cleanSkillIds =
      payload.skill_ids !== undefined ? await validateAndDedupeCanonicalSkillIds(payload.skill_ids) : [];

    const activeCount = await Project.countDocuments({ student_id: student._id, is_deleted: false });

    const created = await Project.create({
      student_id: student._id,
      college_id: extractId(student.college_id),
      title,
      description,
      role: sanitizePlainText(payload.role),
      status,
      visibility,
      is_ongoing: isOngoing,
      start_date,
      end_date,
      team_size: teamSize,
      project_url: "",
      repository_url: "",
      live_demo_url: "",
      display_order: activeCount,
      is_deleted: false,
    });

    if (cleanSkillIds.length > 0) {
      await syncProjectSkills(created, student._id, cleanSkillIds);
    }
    if (validatedLinks.length > 0) {
      await syncProjectLinks(created, student._id, validatedLinks);
    }

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_project",
        targetId: created._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "CREATE_PROJECT",
        changedFields: ["title", "status", "visibility", "skill_ids", "links"],
        previousValues: {},
        newValues: { title: created.title, status: created.status, visibility: created.visibility },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const [skillsMap, linksMap] = await Promise.all([
      loadSkillsForProjects([created._id]),
      loadLinksForProjects([created._id]),
    ]);
    return {
      project: formatProjectResponse(
        created,
        skillsMap.get(String(created._id)) || [],
        linksMap.get(String(created._id)) || [],
      ),
    };
  };

  const updateProject = async (actor, targetStudentId, projectId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(projectId, "project ID");

    if (!payload || typeof payload !== "object") {
      throw new BadRequestError("Request body must be a JSON object");
    }
    if (payload.student_id || payload.college_id) {
      throw new UnauthorizedError("Ownership and college identifiers cannot be modified");
    }

    const existing = await Project.findOne({
      _id: projectId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Project not found");
    }

    const updates = {};
    if (payload.title !== undefined) {
      const title = sanitizePlainText(payload.title);
      if (title.length < 2 || title.length > 120) {
        throw new BadRequestError("Project title must be between 2 and 120 characters");
      }
      updates.title = title;
    }
    if (payload.description !== undefined) {
      const description = sanitizePlainText(payload.description);
      if (description.length < 10 || description.length > 2000) {
        throw new BadRequestError("Project description must be between 10 and 2000 characters");
      }
      updates.description = description;
    }
    if (payload.role !== undefined) {
      updates.role = sanitizePlainText(payload.role);
    }
    if (payload.status !== undefined) {
      if (!Object.values(PROJECT_STATUS).includes(payload.status)) {
        throw new BadRequestError("Invalid project status");
      }
      updates.status = payload.status;
    }
    if (payload.visibility !== undefined) {
      if (!Object.values(PROJECT_VISIBILITY).includes(payload.visibility)) {
        throw new BadRequestError("Invalid project visibility");
      }
      updates.visibility = payload.visibility;
    }

    const mergedOngoing = payload.is_ongoing !== undefined ? Boolean(payload.is_ongoing) : existing.is_ongoing;
    const mergedStart = payload.start_date !== undefined ? payload.start_date : existing.start_date;
    const mergedEnd = payload.end_date !== undefined ? payload.end_date : existing.end_date;
    const { start_date, end_date } = validateDates(mergedStart, mergedEnd, mergedOngoing);
    updates.is_ongoing = mergedOngoing;
    updates.start_date = start_date;
    updates.end_date = end_date;

    if (payload.team_size !== undefined) {
      const teamSize = Number(payload.team_size);
      if (!Number.isInteger(teamSize) || teamSize < 1 || teamSize > 100) {
        throw new BadRequestError("team_size must be an integer between 1 and 100");
      }
      updates.team_size = teamSize;
    }

    const hasLegacyUrlFields =
      payload.project_url !== undefined ||
      payload.repository_url !== undefined ||
      payload.live_demo_url !== undefined;

    if (payload.links !== undefined) {
      const validatedLinks = validateAndNormalizeLinkList(payload.links);
      await syncProjectLinks(existing, student._id, validatedLinks);
      updates.project_url = "";
      updates.repository_url = "";
      updates.live_demo_url = "";
    } else if (hasLegacyUrlFields) {
      const legacyLinks = buildLinksFromLegacyFields({
        repository_url:
          payload.repository_url !== undefined ? payload.repository_url : existing.repository_url,
        live_demo_url:
          payload.live_demo_url !== undefined ? payload.live_demo_url : existing.live_demo_url,
        project_url: payload.project_url !== undefined ? payload.project_url : existing.project_url,
      });
      const validatedLinks = validateAndNormalizeLinkList(legacyLinks);
      await syncProjectLinks(existing, student._id, validatedLinks);
      updates.project_url = "";
      updates.repository_url = "";
      updates.live_demo_url = "";
    }

    if (payload.skill_ids !== undefined) {
      await syncProjectSkills(existing, student._id, payload.skill_ids);
    }

    const updated = await Project.findByIdAndUpdate(existing._id, { $set: updates }, { new: true });

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_project",
        targetId: existing._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "UPDATE_PROJECT",
        changedFields: Object.keys(updates).concat(
          payload.skill_ids !== undefined ? ["skill_ids"] : [],
          payload.links !== undefined || hasLegacyUrlFields ? ["links"] : [],
        ),
        previousValues: { title: existing.title, status: existing.status, visibility: existing.visibility },
        newValues: { title: updated.title, status: updated.status, visibility: updated.visibility },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const [skillsMap, linksMap] = await Promise.all([
      loadSkillsForProjects([updated._id]),
      loadLinksForProjects([updated._id]),
    ]);
    return {
      project: formatProjectResponse(
        updated,
        skillsMap.get(String(updated._id)) || [],
        linksMap.get(String(updated._id)) || [],
      ),
    };
  };

  const deleteProject = async (actor, targetStudentId, projectId, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(projectId, "project ID");

    const existing = await Project.findOne({
      _id: projectId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Project not found");
    }

    existing.is_deleted = true;
    existing.deleted_at = new Date();
    existing.deleted_by_id = scopedActor.userId;
    existing.deleted_by_role = scopedActor.role;
    await existing.save();

    // Soft-delete project-skill & project-link associations cleanly
    const links = await ProjectSkill.find({ project_id: existing._id, is_deleted: false });
    for (const link of links) {
      link.is_deleted = true;
      link.deleted_at = new Date();
      await link.save();
    }

    if (ProjectLink) {
      const extLinks = await ProjectLink.find({ project_id: existing._id, is_deleted: false });
      for (const ext of extLinks) {
        ext.is_deleted = true;
        ext.deleted_at = new Date();
        ext.deleted_by_id = scopedActor.userId;
        ext.deleted_by_role = scopedActor.role;
        await ext.save();
      }
    }

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_project",
        targetId: existing._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "DELETE_PROJECT",
        changedFields: ["is_deleted"],
        previousValues: { title: existing.title, is_deleted: false },
        newValues: { is_deleted: true },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { deleted: true, project_id: existing._id };
  };

  const reorderProjects = async (actor, targetStudentId, orders, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");

    if (!Array.isArray(orders) || orders.length === 0) {
      throw new BadRequestError("orders must be a non-empty array");
    }

    const activeProjects = await Project.find({ student_id: student._id, is_deleted: false });
    const ownedIds = new Set(activeProjects.map((p) => String(p._id)));

    for (const item of orders) {
      assertValidId(item.project_id, "project ID");
      if (!ownedIds.has(String(item.project_id))) {
        throw new UnauthorizedError("Cannot reorder projects that do not belong to this student");
      }
      const orderNum = Number(item.display_order);
      if (!Number.isInteger(orderNum) || orderNum < 0) {
        throw new BadRequestError("Each display_order must be a non-negative integer");
      }
    }

    await Promise.all(
      orders.map((item) =>
        Project.findByIdAndUpdate(
          item.project_id,
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
        targetModel: "tbl_project",
        targetId: student._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "REORDER_PROJECTS",
        changedFields: ["display_order"],
        previousValues: {},
        newValues: { count: orders.length },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return listStudentProjects(actor, student._id);
  };

  const addSkillToProject = async (actor, targetStudentId, projectId, skillId, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(projectId, "project ID");
    assertValidId(skillId, "skill ID");

    const project = await Project.findOne({ _id: projectId, student_id: student._id, is_deleted: false });
    if (!project) throw new NotFoundError("Project not found");

    const skill = await Skill.findOne({ _id: skillId, is_deleted: false });
    if (!skill) throw new NotFoundError("Canonical skill not found");
    if (!skill.is_active) throw new BadRequestError("Inactive skill cannot be added to a project");

    const duplicate = await ProjectSkill.findOne({
      project_id: project._id,
      skill_id: skill._id,
      is_deleted: false,
    });
    if (duplicate) {
      throw new BadRequestError(`Skill '${skill.name}' is already associated with this project`);
    }

    await ProjectSkill.create({
      project_id: project._id,
      student_id: student._id,
      skill_id: skill._id,
      is_deleted: false,
    });

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_project_skill",
        targetId: project._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "ADD_PROJECT_SKILL",
        changedFields: ["skill_id"],
        previousValues: {},
        newValues: { project_title: project.title, skill_name: skill.name },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const [skillsMap, linksMap] = await Promise.all([
      loadSkillsForProjects([project._id]),
      loadLinksForProjects([project._id]),
    ]);
    return {
      project: formatProjectResponse(
        project,
        skillsMap.get(String(project._id)) || [],
        linksMap.get(String(project._id)) || [],
      ),
    };
  };

  const removeSkillFromProject = async (actor, targetStudentId, projectId, skillId, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(projectId, "project ID");
    assertValidId(skillId, "skill ID");

    const project = await Project.findOne({ _id: projectId, student_id: student._id, is_deleted: false });
    if (!project) throw new NotFoundError("Project not found");

    const assoc = await ProjectSkill.findOne({
      project_id: project._id,
      skill_id: skillId,
      is_deleted: false,
    });
    if (!assoc) throw new NotFoundError("Skill association not found on this project");

    assoc.is_deleted = true;
    assoc.deleted_at = new Date();
    await assoc.save();

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_project_skill",
        targetId: project._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "REMOVE_PROJECT_SKILL",
        changedFields: ["is_deleted"],
        previousValues: { skill_id: skillId },
        newValues: { is_deleted: true },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const [skillsMap, linksMap] = await Promise.all([
      loadSkillsForProjects([project._id]),
      loadLinksForProjects([project._id]),
    ]);
    return {
      project: formatProjectResponse(
        project,
        skillsMap.get(String(project._id)) || [],
        linksMap.get(String(project._id)) || [],
      ),
    };
  };

  const listProjectLinks = async (actor, targetStudentId, projectId) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");
    assertValidId(projectId, "project ID");

    const project = await Project.findOne({ _id: projectId, student_id: student._id, is_deleted: false });
    if (!project) throw new NotFoundError("Project not found");
    if (!assertVisibleToActor(scopedActor, student._id, project)) {
      throw new UnauthorizedError("This project is private");
    }

    const docs = await ProjectLink.find({ project_id: project._id, is_deleted: false }).sort({
      display_order: 1,
      createdAt: 1,
    });
    return {
      project_id: project._id,
      links: docs.map(formatProjectLink),
    };
  };

  const addProjectLink = async (actor, targetStudentId, projectId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(projectId, "project ID");

    if (!payload || typeof payload !== "object") {
      throw new BadRequestError("Request body must be a JSON object");
    }
    if (payload.student_id || payload.project_id || payload.college_id) {
      throw new UnauthorizedError("Ownership and project identifiers cannot be supplied in payload");
    }

    const project = await Project.findOne({ _id: projectId, student_id: student._id, is_deleted: false });
    if (!project) throw new NotFoundError("Project not found");

    const checked = validateProviderLink(payload.link_type, payload.url, payload.label || "");

    const duplicateUrl = await ProjectLink.findOne({
      project_id: project._id,
      normalized_url: checked.normalized_url,
      is_deleted: false,
    });
    if (duplicateUrl) {
      throw new BadRequestError("This URL is already linked to this project");
    }

    if (checked.link_type === PROJECT_LINK_TYPES.GITHUB_REPOSITORY) {
      const existingGithub = await ProjectLink.findOne({
        project_id: project._id,
        link_type: PROJECT_LINK_TYPES.GITHUB_REPOSITORY,
        is_deleted: false,
      });
      if (existingGithub) {
        throw new BadRequestError("A project can have only one canonical GitHub repository link");
      }
    }

    const currentCount = await ProjectLink.countDocuments({
      project_id: project._id,
      is_deleted: false,
    });

    const created = await ProjectLink.create({
      project_id: project._id,
      student_id: student._id,
      link_type: checked.link_type,
      url: checked.url,
      normalized_url: checked.normalized_url,
      label: checked.label,
      display_order: currentCount,
      is_deleted: false,
    });

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_project_link",
        targetId: created._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "ADD_PROJECT_LINK",
        changedFields: ["link_type", "url", "label"],
        previousValues: {},
        newValues: { project_id: project._id, link_type: created.link_type, url: created.url },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { link: formatProjectLink(created) };
  };

  const updateProjectLink = async (actor, targetStudentId, projectId, linkId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(projectId, "project ID");
    assertValidId(linkId, "link ID");

    if (!payload || typeof payload !== "object") {
      throw new BadRequestError("Request body must be a JSON object");
    }
    if (payload.student_id || payload.project_id || payload.college_id) {
      throw new UnauthorizedError("Ownership and project identifiers cannot be modified");
    }

    const project = await Project.findOne({ _id: projectId, student_id: student._id, is_deleted: false });
    if (!project) throw new NotFoundError("Project not found");

    const existing = await ProjectLink.findOne({
      _id: linkId,
      project_id: project._id,
      is_deleted: false,
    });
    if (!existing) throw new NotFoundError("Project link not found");

    const mergedType = payload.link_type !== undefined ? payload.link_type : existing.link_type;
    const mergedUrl = payload.url !== undefined ? payload.url : existing.url;
    const mergedLabel = payload.label !== undefined ? payload.label : existing.label;

    const checked = validateProviderLink(mergedType, mergedUrl, mergedLabel);

    const duplicateUrl = await ProjectLink.findOne({
      _id: { $ne: existing._id },
      project_id: project._id,
      normalized_url: checked.normalized_url,
      is_deleted: false,
    });
    if (duplicateUrl) {
      throw new BadRequestError("This URL is already linked to this project");
    }

    if (checked.link_type === PROJECT_LINK_TYPES.GITHUB_REPOSITORY) {
      const existingGithub = await ProjectLink.findOne({
        _id: { $ne: existing._id },
        project_id: project._id,
        link_type: PROJECT_LINK_TYPES.GITHUB_REPOSITORY,
        is_deleted: false,
      });
      if (existingGithub) {
        throw new BadRequestError("A project can have only one canonical GitHub repository link");
      }
    }

    const updated = await ProjectLink.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          link_type: checked.link_type,
          url: checked.url,
          normalized_url: checked.normalized_url,
          label: checked.label,
        },
      },
      { new: true },
    );

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_project_link",
        targetId: existing._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "UPDATE_PROJECT_LINK",
        changedFields: ["link_type", "url", "label"],
        previousValues: { link_type: existing.link_type, url: existing.url, label: existing.label },
        newValues: { link_type: checked.link_type, url: checked.url, label: checked.label },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { link: formatProjectLink(updated) };
  };

  const deleteProjectLink = async (actor, targetStudentId, projectId, linkId, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(projectId, "project ID");
    assertValidId(linkId, "link ID");

    const project = await Project.findOne({ _id: projectId, student_id: student._id, is_deleted: false });
    if (!project) throw new NotFoundError("Project not found");

    const existing = await ProjectLink.findOne({
      _id: linkId,
      project_id: project._id,
      is_deleted: false,
    });
    if (!existing) throw new NotFoundError("Project link not found");

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
        targetModel: "tbl_project_link",
        targetId: existing._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "DELETE_PROJECT_LINK",
        changedFields: ["is_deleted"],
        previousValues: { link_type: existing.link_type, url: existing.url, is_deleted: false },
        newValues: { is_deleted: true },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { deleted: true, link_id: existing._id };
  };

  const reorderProjectLinks = async (actor, targetStudentId, projectId, orders, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(projectId, "project ID");

    const project = await Project.findOne({ _id: projectId, student_id: student._id, is_deleted: false });
    if (!project) throw new NotFoundError("Project not found");

    const activeLinks = await ProjectLink.find({ project_id: project._id, is_deleted: false });
    const ownedIds = new Set(activeLinks.map((l) => String(l._id)));

    for (const item of orders) {
      assertValidId(item.link_id, "link ID");
      if (!ownedIds.has(String(item.link_id))) {
        throw new UnauthorizedError("Cannot reorder links that do not belong to this project");
      }
    }

    await Promise.all(
      orders.map((item) =>
        ProjectLink.findByIdAndUpdate(
          item.link_id,
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
        targetModel: "tbl_project_link",
        targetId: project._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "REORDER_PROJECT_LINKS",
        changedFields: ["display_order"],
        previousValues: {},
        newValues: { count: orders.length },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return listProjectLinks(actor, student._id, project._id);
  };

  return {
    getMetadata,
    listStudentProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    reorderProjects,
    addSkillToProject,
    removeSkillFromProject,
    listProjectLinks,
    addProjectLink,
    updateProjectLink,
    deleteProjectLink,
    reorderProjectLinks,
  };
};

export const projectsService = createProjectsService();
