import mongoose from "mongoose";
import tbl_skill, { normalizeSkillName } from "./skill.model.js";
import tbl_student_skill from "./studentSkill.model.js";
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
  DEFAULT_CANONICAL_SKILLS,
  SKILL_CATEGORIES,
  SKILL_PROFICIENCY,
  SKILL_PROFICIENCY_ORDER,
  SKILL_PROFICIENCY_LEVELS,
} from "../../utils/constants.js";

const extractId = (val) => {
  if (!val) return null;
  if (typeof val === "object" && val._id) return val._id.toString();
  return String(val);
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getOrderedProficiencyLevels = (levels = SKILL_PROFICIENCY_LEVELS) =>
  [...levels].sort((a, b) => a.order - b.order);

export const resolveActiveProficiency = (input, levels = SKILL_PROFICIENCY_LEVELS) => {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  const match = levels.find(
    (lvl) => lvl.name.toLowerCase() === trimmed.toLowerCase() || lvl.code.toLowerCase() === trimmed.toLowerCase(),
  );
  if (!match || !match.is_active) return null;
  return match;
};

export const formatMasterSkill = (skill) => ({
  id: skill._id,
  name: skill.name,
  normalized_name: skill.normalized_name,
  category: skill.category,
  description: skill.description || "",
  is_active: Boolean(skill.is_active),
});

export const formatStudentSkill = (doc) => {
  const skill = doc.skill_id && typeof doc.skill_id === "object" ? doc.skill_id : null;
  const profMeta =
    SKILL_PROFICIENCY_LEVELS.find((lvl) => lvl.name === doc.proficiency) || {
      code: String(doc.proficiency || "INTERMEDIATE").toUpperCase(),
      name: doc.proficiency || SKILL_PROFICIENCY.INTERMEDIATE,
      order: SKILL_PROFICIENCY_ORDER[doc.proficiency] || 0,
      description: "",
      is_active: true,
    };

  return {
    id: doc._id,
    student_id: doc.student_id,
    skill: skill
      ? {
          id: skill._id,
          name: skill.name,
          category: skill.category,
          is_active: Boolean(skill.is_active),
        }
      : { id: doc.skill_id, name: "Unknown Skill", category: "Other", is_active: false },
    proficiency: profMeta.name,
    proficiency_order: profMeta.order,
    proficiency_details: {
      code: profMeta.code,
      name: profMeta.name,
      order: profMeta.order,
      description: profMeta.description,
    },
    years_of_experience: doc.years_of_experience ?? null,
    display_order: doc.display_order ?? 0,
    updated_at: doc.updatedAt || null,
  };
};

export const createSkillsService = (deps = {}) => {
  const Skill = deps.Skill || tbl_skill;
  const StudentSkill = deps.StudentSkill || tbl_student_skill;
  const Student = deps.Student || tbl_student;
  const AuditLog = deps.AuditLog || tbl_audit_log;
  const accessService = deps.accessService || academicProfileService;
  const proficiencyCatalog = deps.proficiencyLevels || SKILL_PROFICIENCY_LEVELS;
  const isValidObjectId = deps.isValidObjectId || mongoose.isValidObjectId;

  const getProficiencyLevels = () => {
    const activeLevels = getOrderedProficiencyLevels(proficiencyCatalog).filter((lvl) => lvl.is_active);
    return {
      proficiencies: activeLevels,
    };
  };

  const assertValidId = (id, label = "ID") => {
    if (!id || !isValidObjectId(id)) {
      throw new BadRequestError(`Invalid ${label} format`);
    }
  };

  const ensureDefaultSkillsSeeded = async () => {
    if (deps.skipAutoSeed) return;
    const count = await Skill.countDocuments({ is_deleted: false });
    if (count > 0) return;

    const docs = DEFAULT_CANONICAL_SKILLS.map((item) => ({
      name: item.name,
      normalized_name: normalizeSkillName(item.name),
      category: item.category,
      is_active: true,
      is_deleted: false,
      created_by_role: "System",
    }));

    try {
      await Skill.insertMany(docs, { ordered: false });
    } catch {
      // Ignore concurrent duplicate insert errors during parallel boot
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

  const syncStudentSkillsCache = async (studentId) => {
    const activeSkills = await StudentSkill.find({
      student_id: studentId,
      is_deleted: false,
    })
      .populate("skill_id", "name is_deleted")
      .sort({ display_order: 1, createdAt: 1 });

    const skillNames = activeSkills
      .filter((item) => item.skill_id && !item.skill_id.is_deleted && item.skill_id.name)
      .map((item) => item.skill_id.name);

    await Student.findByIdAndUpdate(studentId, {
      $set: { student_skills: skillNames.join(", ") },
    });
  };

  const searchMasterSkills = async ({ q = "", category = "", page = 1, limit = 25, includeInactive = false } = {}) => {
    await ensureDefaultSkillsSeeded();

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 25));

    const filter = { is_deleted: false };
    if (!includeInactive) {
      filter.is_active = true;
    }
    if (category) {
      filter.category = category;
    }

    const normalizedQuery = normalizeSkillName(q);
    if (normalizedQuery) {
      const regex = new RegExp(escapeRegex(normalizedQuery), "i");
      filter.$or = [{ normalized_name: regex }, { name: regex }, { aliases: regex }];
    }

    const [skills, total] = await Promise.all([
      Skill.find(filter)
        .sort({ name: 1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Skill.countDocuments(filter),
    ]);

    return {
      skills: skills.map(formatMasterSkill),
      categories: SKILL_CATEGORIES,
      proficiencies: Object.values(SKILL_PROFICIENCY).map((name) => ({
        code: name.toUpperCase(),
        name,
        order: SKILL_PROFICIENCY_ORDER[name],
      })),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        total_pages: Math.ceil(total / safeLimit) || 1,
      },
    };
  };

  const getMasterSkillById = async (skillId) => {
    assertValidId(skillId, "skill ID");
    const skill = await Skill.findOne({ _id: skillId, is_deleted: false });
    if (!skill) {
      throw new NotFoundError(`No skill found with id: ${skillId}`);
    }
    return { skill: formatMasterSkill(skill) };
  };

  const createMasterSkill = async (actor, payload, reqMeta = {}) => {
    if (!actor || !["Admin", "College", "TPO"].includes(actor.role)) {
      throw new UnauthorizedError("Only Admin, College, or TPO can add canonical master skills");
    }

    const cleanName = String(payload.name || "").trim().replace(/\s+/g, " ");
    const normalized = normalizeSkillName(cleanName);
    if (!normalized) {
      throw new BadRequestError("Skill name is required");
    }

    const existing = await Skill.findOne({ normalized_name: normalized, is_deleted: false });
    if (existing) {
      throw new BadRequestError(`Skill '${existing.name}' already exists in canonical catalog`);
    }

    const category = payload.category || "Other";
    if (!SKILL_CATEGORIES.includes(category)) {
      throw new BadRequestError("Invalid skill category");
    }

    const created = await Skill.create({
      name: cleanName,
      normalized_name: normalized,
      category,
      description: String(payload.description || "").trim(),
      is_active: true,
      is_deleted: false,
      created_by_id: actor.userId,
      created_by_role: actor.role,
    });

    await recordAuditLog(
      {
        actorId: actor.userId,
        actorRole: actor.role,
        targetUserId: actor.userId,
        targetModel: "tbl_skill",
        targetId: created._id,
        action: "CREATE_CANONICAL_SKILL",
        changedFields: ["name", "category"],
        previousValues: {},
        newValues: { name: created.name, category: created.category },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { skill: formatMasterSkill(created) };
  };

  const updateMasterSkill = async (actor, skillId, payload, reqMeta = {}) => {
    if (!actor || actor.role !== "Admin") {
      throw new UnauthorizedError("Only Admin can modify canonical master skills");
    }
    assertValidId(skillId, "skill ID");

    const existing = await Skill.findOne({ _id: skillId, is_deleted: false });
    if (!existing) {
      throw new NotFoundError(`No skill found with id: ${skillId}`);
    }

    const updates = {};
    if (payload.name !== undefined) {
      const cleanName = String(payload.name).trim().replace(/\s+/g, " ");
      const normalized = normalizeSkillName(cleanName);
      if (!normalized) throw new BadRequestError("Skill name cannot be empty");
      const duplicate = await Skill.findOne({
        _id: { $ne: existing._id },
        normalized_name: normalized,
        is_deleted: false,
      });
      if (duplicate) {
        throw new BadRequestError(`Another canonical skill '${duplicate.name}' already uses that name`);
      }
      updates.name = cleanName;
      updates.normalized_name = normalized;
    }
    if (payload.category !== undefined) {
      if (!SKILL_CATEGORIES.includes(payload.category)) {
        throw new BadRequestError("Invalid skill category");
      }
      updates.category = payload.category;
    }
    if (payload.description !== undefined) {
      updates.description = String(payload.description || "").trim();
    }
    if (payload.is_active !== undefined) {
      updates.is_active = Boolean(payload.is_active);
    }

    const updated = await Skill.findByIdAndUpdate(existing._id, { $set: updates }, { new: true });

    await recordAuditLog(
      {
        actorId: actor.userId,
        actorRole: actor.role,
        targetUserId: actor.userId,
        targetModel: "tbl_skill",
        targetId: existing._id,
        action: "UPDATE_CANONICAL_SKILL",
        changedFields: Object.keys(updates),
        previousValues: { name: existing.name, category: existing.category, is_active: existing.is_active },
        newValues: updates,
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { skill: formatMasterSkill(updated) };
  };

  const deleteMasterSkill = async (actor, skillId, reqMeta = {}) => {
    if (!actor || actor.role !== "Admin") {
      throw new UnauthorizedError("Only Admin can deactivate canonical master skills");
    }
    assertValidId(skillId, "skill ID");

    const existing = await Skill.findOne({ _id: skillId, is_deleted: false });
    if (!existing) {
      throw new NotFoundError(`No skill found with id: ${skillId}`);
    }

    existing.is_active = false;
    existing.is_deleted = true;
    existing.deleted_at = new Date();
    await existing.save();

    await recordAuditLog(
      {
        actorId: actor.userId,
        actorRole: actor.role,
        targetUserId: actor.userId,
        targetModel: "tbl_skill",
        targetId: existing._id,
        action: "DEACTIVATE_CANONICAL_SKILL",
        changedFields: ["is_active", "is_deleted"],
        previousValues: { is_active: true, is_deleted: false },
        newValues: { is_active: false, is_deleted: true },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { deleted: true, skill_id: existing._id };
  };

  const getStudentSkills = async (actor, targetStudentId, { proficiency = "", sort = "display_order" } = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");

    const filter = {
      student_id: student._id,
      is_deleted: false,
    };

    if (proficiency) {
      const resolved = resolveActiveProficiency(proficiency, proficiencyCatalog);
      if (!resolved) {
        throw new BadRequestError("Invalid proficiency filter value");
      }
      filter.proficiency = resolved.name;
    }

    const items = await StudentSkill.find(filter)
      .populate("skill_id", "name category is_active is_deleted")
      .sort({ display_order: 1, createdAt: 1 });

    let formatted = items.map(formatStudentSkill);
    if (proficiency) {
      formatted = formatted.filter((item) => item.proficiency === proficiency);
    }

    if (sort === "proficiency_desc") {
      formatted.sort(
        (a, b) =>
          (b.proficiency_order || 0) - (a.proficiency_order || 0) ||
          (a.display_order || 0) - (b.display_order || 0),
      );
    } else if (sort === "proficiency_asc") {
      formatted.sort(
        (a, b) =>
          (a.proficiency_order || 0) - (b.proficiency_order || 0) ||
          (a.display_order || 0) - (b.display_order || 0),
      );
    }

    return {
      student_id: student._id,
      skills: formatted,
      proficiencies: getOrderedProficiencyLevels(proficiencyCatalog)
        .filter((l) => l.is_active)
        .map((l) => l.name),
      proficiency_levels: getOrderedProficiencyLevels(proficiencyCatalog).filter((l) => l.is_active),
      categories: SKILL_CATEGORIES,
    };
  };

  const addStudentSkill = async (actor, targetStudentId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");

    if (!payload || typeof payload !== "object") {
      throw new BadRequestError("Request body must be a JSON object");
    }
    if (payload.student_id || payload.college_id) {
      throw new UnauthorizedError("Ownership and college identifiers cannot be supplied in payload");
    }

    assertValidId(payload.skill_id, "skill ID");
    const masterSkill = await Skill.findOne({ _id: payload.skill_id, is_deleted: false });
    if (!masterSkill) {
      throw new NotFoundError("Selected technical skill does not exist");
    }
    if (!masterSkill.is_active) {
      throw new BadRequestError(`Skill '${masterSkill.name}' is currently inactive and cannot be added`);
    }

    const proficiencyInput = payload.proficiency || SKILL_PROFICIENCY.INTERMEDIATE;
    const resolvedProficiency = resolveActiveProficiency(proficiencyInput, proficiencyCatalog);
    if (!resolvedProficiency) {
      throw new BadRequestError("Invalid or inactive skill proficiency level");
    }
    const proficiency = resolvedProficiency.name;

    let yearsExp = null;
    if (payload.years_of_experience !== undefined && payload.years_of_experience !== null && payload.years_of_experience !== "") {
      yearsExp = Number(payload.years_of_experience);
      if (Number.isNaN(yearsExp) || yearsExp < 0 || yearsExp > 50) {
        throw new BadRequestError("Years of experience must be between 0 and 50");
      }
    }

    const existingAssociation = await StudentSkill.findOne({
      student_id: student._id,
      skill_id: masterSkill._id,
      is_deleted: false,
    });
    if (existingAssociation) {
      throw new BadRequestError(`Skill '${masterSkill.name}' is already added to this profile`);
    }

    const activeCount = await StudentSkill.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });

    const displayOrder =
      payload.display_order !== undefined && payload.display_order !== null
        ? Number(payload.display_order)
        : activeCount;

    const created = await StudentSkill.create({
      student_id: student._id,
      skill_id: masterSkill._id,
      college_id: extractId(student.college_id),
      proficiency,
      years_of_experience: yearsExp,
      display_order: displayOrder,
      is_deleted: false,
    });

    const populated = await StudentSkill.findById(created._id).populate(
      "skill_id",
      "name category is_active",
    );

    await syncStudentSkillsCache(student._id);

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_student_skill",
        targetId: created._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "ADD_USER_SKILL",
        changedFields: ["skill_id", "proficiency", "years_of_experience", "display_order"],
        previousValues: {},
        newValues: {
          skill_name: masterSkill.name,
          category: masterSkill.category,
          proficiency,
          years_of_experience: yearsExp,
          display_order: displayOrder,
        },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { skill_entry: formatStudentSkill(populated || created) };
  };

  const updateStudentSkill = async (actor, targetStudentId, userSkillId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(userSkillId, "user skill ID");

    if (payload.student_id || payload.college_id || payload.skill_id) {
      throw new UnauthorizedError("Protected ownership or skill reference fields cannot be reassigned");
    }

    const existing = await StudentSkill.findOne({
      _id: userSkillId,
      student_id: student._id,
      is_deleted: false,
    }).populate("skill_id", "name category is_active");

    if (!existing) {
      throw new NotFoundError("Technical skill association not found");
    }

    const updates = {};
    const changedFields = [];
    const previousValues = {};
    const newValues = {};

    if (payload.proficiency !== undefined) {
      const resolvedProficiency = resolveActiveProficiency(payload.proficiency, proficiencyCatalog);
      if (!resolvedProficiency) {
        throw new BadRequestError("Invalid or inactive skill proficiency level");
      }
      if (resolvedProficiency.name !== existing.proficiency) {
        updates.proficiency = resolvedProficiency.name;
        changedFields.push("proficiency");
        previousValues.proficiency = existing.proficiency;
        newValues.proficiency = resolvedProficiency.name;
      }
    }

    if (payload.years_of_experience !== undefined) {
      const years =
        payload.years_of_experience === null || payload.years_of_experience === ""
          ? null
          : Number(payload.years_of_experience);
      if (years !== null && (Number.isNaN(years) || years < 0 || years > 50)) {
        throw new BadRequestError("Years of experience must be between 0 and 50");
      }
      if (years !== existing.years_of_experience) {
        updates.years_of_experience = years;
        changedFields.push("years_of_experience");
        previousValues.years_of_experience = existing.years_of_experience;
        newValues.years_of_experience = years;
      }
    }

    if (payload.display_order !== undefined) {
      const order = Number(payload.display_order);
      if (!Number.isInteger(order) || order < 0) {
        throw new BadRequestError("Display order must be a non-negative integer");
      }
      if (order !== existing.display_order) {
        updates.display_order = order;
        changedFields.push("display_order");
        previousValues.display_order = existing.display_order;
        newValues.display_order = order;
      }
    }

    if (changedFields.length === 0) {
      return { skill_entry: formatStudentSkill(existing) };
    }

    const updated = await StudentSkill.findByIdAndUpdate(
      existing._id,
      { $set: updates },
      { new: true },
    ).populate("skill_id", "name category is_active");

    await syncStudentSkillsCache(student._id);

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_student_skill",
        targetId: existing._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action:
          changedFields.length === 1 && changedFields[0] === "proficiency"
            ? "UPDATE_USER_SKILL_PROFICIENCY"
            : "UPDATE_USER_SKILL",
        changedFields,
        previousValues: { skill_name: existing.skill_id?.name || "", ...previousValues },
        newValues: { skill_name: existing.skill_id?.name || "", ...newValues },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { skill_entry: formatStudentSkill(updated) };
  };

  const removeStudentSkill = async (actor, targetStudentId, userSkillId, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(userSkillId, "user skill ID");

    const existing = await StudentSkill.findOne({
      _id: userSkillId,
      student_id: student._id,
      is_deleted: false,
    }).populate("skill_id", "name category");

    if (!existing) {
      throw new NotFoundError("Technical skill association not found");
    }

    existing.is_deleted = true;
    existing.deleted_at = new Date();
    existing.deleted_by_id = scopedActor.userId;
    existing.deleted_by_role = scopedActor.role;
    await existing.save();

    await syncStudentSkillsCache(student._id);

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_student_skill",
        targetId: existing._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "REMOVE_USER_SKILL",
        changedFields: ["is_deleted"],
        previousValues: { skill_name: existing.skill_id?.name || "", is_deleted: false },
        newValues: { is_deleted: true },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { deleted: true, user_skill_id: existing._id };
  };

  const reorderStudentSkills = async (actor, targetStudentId, orders, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");

    if (!Array.isArray(orders) || orders.length === 0) {
      throw new BadRequestError("orders must be a non-empty array");
    }

    const activeRecords = await StudentSkill.find({
      student_id: student._id,
      is_deleted: false,
    });
    const ownedIds = new Set(activeRecords.map((r) => String(r._id)));

    for (const item of orders) {
      assertValidId(item.user_skill_id, "user skill ID");
      if (!ownedIds.has(String(item.user_skill_id))) {
        throw new UnauthorizedError("Cannot reorder skills that do not belong to this student");
      }
      const orderNum = Number(item.display_order);
      if (!Number.isInteger(orderNum) || orderNum < 0) {
        throw new BadRequestError("Each display_order must be a non-negative integer");
      }
    }

    await Promise.all(
      orders.map((item) =>
        StudentSkill.findByIdAndUpdate(
          item.user_skill_id,
          { $set: { display_order: Number(item.display_order) } },
          { new: true },
        ),
      ),
    );

    await syncStudentSkillsCache(student._id);

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_student_skill",
        targetId: student._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "REORDER_USER_SKILLS",
        changedFields: ["display_order"],
        previousValues: {},
        newValues: { count: orders.length },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return getStudentSkills(actor, student._id);
  };

  return {
    ensureDefaultSkillsSeeded,
    getProficiencyLevels,
    searchMasterSkills,
    getMasterSkillById,
    createMasterSkill,
    updateMasterSkill,
    deleteMasterSkill,
    getStudentSkills,
    addStudentSkill,
    updateStudentSkill,
    removeStudentSkill,
    reorderStudentSkills,
    syncStudentSkillsCache,
  };
};

export const skillsService = createSkillsService();
