import { StatusCodes } from "http-status-codes";
import { skillsService } from "./skills.service.js";
import { UnauthorizedError } from "../../errors/customErrors.js";

const getReqMeta = (req) => ({
  ip: req.ip || "",
  userAgent: req.get("user-agent") || "",
});

const requireStudentSelf = (req) => {
  if (req.user.role !== "Student") {
    throw new UnauthorizedError("Only student accounts can access '/me' technical skills endpoints");
  }
  return req.user.userId;
};

export const listProficiencyLevels = async (req, res) => {
  const data = skillsService.getProficiencyLevels();
  res.status(StatusCodes.OK).json(data);
};

export const listMasterSkills = async (req, res) => {
  const data = await skillsService.searchMasterSkills({
    q: req.query.q || "",
    category: req.query.category || "",
    page: req.query.page,
    limit: req.query.limit,
    includeInactive: req.user?.role === "Admin" && req.query.includeInactive === "true",
  });
  res.status(StatusCodes.OK).json(data);
};

export const getMasterSkill = async (req, res) => {
  const data = await skillsService.getMasterSkillById(req.params.skillId);
  res.status(StatusCodes.OK).json(data);
};

export const createMasterSkill = async (req, res) => {
  const data = await skillsService.createMasterSkill(req.user, req.body, getReqMeta(req));
  res.status(StatusCodes.CREATED).json({
    msg: "Canonical skill created successfully",
    ...data,
  });
};

export const updateMasterSkill = async (req, res) => {
  const data = await skillsService.updateMasterSkill(
    req.user,
    req.params.skillId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Canonical skill updated successfully",
    ...data,
  });
};

export const deleteMasterSkill = async (req, res) => {
  const data = await skillsService.deleteMasterSkill(req.user, req.params.skillId, getReqMeta(req));
  res.status(StatusCodes.OK).json({
    msg: "Canonical skill deactivated successfully",
    ...data,
  });
};

export const getMySkills = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await skillsService.getStudentSkills(req.user, studentId, {
    proficiency: req.query.proficiency || "",
    sort: req.query.sort || "display_order",
  });
  res.status(StatusCodes.OK).json(data);
};

export const addMySkill = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await skillsService.addStudentSkill(req.user, studentId, req.body, getReqMeta(req));
  res.status(StatusCodes.CREATED).json({
    msg: "Technical skill added successfully",
    ...data,
  });
};

export const updateMySkill = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await skillsService.updateStudentSkill(
    req.user,
    studentId,
    req.params.userSkillId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Technical skill updated successfully",
    ...data,
  });
};

export const removeMySkill = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await skillsService.removeStudentSkill(
    req.user,
    studentId,
    req.params.userSkillId,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Technical skill removed successfully",
    ...data,
  });
};

export const reorderMySkills = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await skillsService.reorderStudentSkills(
    req.user,
    studentId,
    req.body.orders,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Technical skills reordered successfully",
    ...data,
  });
};

export const getStudentSkills = async (req, res) => {
  const data = await skillsService.getStudentSkills(req.user, req.params.studentId, {
    proficiency: req.query.proficiency || "",
    sort: req.query.sort || "display_order",
  });
  res.status(StatusCodes.OK).json(data);
};

export const addStudentSkill = async (req, res) => {
  const data = await skillsService.addStudentSkill(
    req.user,
    req.params.studentId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json({
    msg: "Technical skill added successfully",
    ...data,
  });
};

export const updateStudentSkill = async (req, res) => {
  const data = await skillsService.updateStudentSkill(
    req.user,
    req.params.studentId,
    req.params.userSkillId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Technical skill updated successfully",
    ...data,
  });
};

export const removeStudentSkill = async (req, res) => {
  const data = await skillsService.removeStudentSkill(
    req.user,
    req.params.studentId,
    req.params.userSkillId,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Technical skill removed successfully",
    ...data,
  });
};

export const reorderStudentSkills = async (req, res) => {
  const data = await skillsService.reorderStudentSkills(
    req.user,
    req.params.studentId,
    req.body.orders,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Technical skills reordered successfully",
    ...data,
  });
};
