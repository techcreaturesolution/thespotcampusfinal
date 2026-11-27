import { StatusCodes } from "http-status-codes";
import { projectsService } from "./projects.service.js";
import { UnauthorizedError } from "../../errors/customErrors.js";

const getReqMeta = (req) => ({
  ip: req.ip || "",
  userAgent: req.get("user-agent") || "",
});

const requireStudentSelf = (req) => {
  if (req.user.role !== "Student") {
    throw new UnauthorizedError("Only student accounts can access '/me' project endpoints");
  }
  return req.user.userId;
};

export const getProjectMetadata = async (req, res) => {
  res.status(StatusCodes.OK).json(projectsService.getMetadata());
};

export const listMyProjects = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.listStudentProjects(req.user, studentId, req.query);
  res.status(StatusCodes.OK).json(data);
};

export const getMyProject = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.getProjectById(req.user, studentId, req.params.projectId);
  res.status(StatusCodes.OK).json(data);
};

export const createMyProject = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.createProject(req.user, studentId, req.body, getReqMeta(req));
  res.status(StatusCodes.CREATED).json({
    msg: "Project created successfully",
    ...data,
  });
};

export const updateMyProject = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.updateProject(
    req.user,
    studentId,
    req.params.projectId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Project updated successfully",
    ...data,
  });
};

export const deleteMyProject = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.deleteProject(
    req.user,
    studentId,
    req.params.projectId,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Project removed successfully",
    ...data,
  });
};

export const reorderMyProjects = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.reorderProjects(
    req.user,
    studentId,
    req.body.orders,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Projects reordered successfully",
    ...data,
  });
};

export const addMyProjectSkill = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.addSkillToProject(
    req.user,
    studentId,
    req.params.projectId,
    req.body.skill_id,
    getReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json({
    msg: "Skill added to project successfully",
    ...data,
  });
};

export const removeMyProjectSkill = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.removeSkillFromProject(
    req.user,
    studentId,
    req.params.projectId,
    req.params.skillId,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Skill removed from project successfully",
    ...data,
  });
};

export const listStudentProjects = async (req, res) => {
  const data = await projectsService.listStudentProjects(
    req.user,
    req.params.studentId,
    req.query,
  );
  res.status(StatusCodes.OK).json(data);
};

export const getStudentProject = async (req, res) => {
  const data = await projectsService.getProjectById(
    req.user,
    req.params.studentId,
    req.params.projectId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const createStudentProject = async (req, res) => {
  const data = await projectsService.createProject(
    req.user,
    req.params.studentId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json({
    msg: "Project created successfully",
    ...data,
  });
};

export const updateStudentProject = async (req, res) => {
  const data = await projectsService.updateProject(
    req.user,
    req.params.studentId,
    req.params.projectId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Project updated successfully",
    ...data,
  });
};

export const deleteStudentProject = async (req, res) => {
  const data = await projectsService.deleteProject(
    req.user,
    req.params.studentId,
    req.params.projectId,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Project removed successfully",
    ...data,
  });
};

export const reorderStudentProjects = async (req, res) => {
  const data = await projectsService.reorderProjects(
    req.user,
    req.params.studentId,
    req.body.orders,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Projects reordered successfully",
    ...data,
  });
};

export const addStudentProjectSkill = async (req, res) => {
  const data = await projectsService.addSkillToProject(
    req.user,
    req.params.studentId,
    req.params.projectId,
    req.body.skill_id,
    getReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json({
    msg: "Skill added to project successfully",
    ...data,
  });
};

export const removeStudentProjectSkill = async (req, res) => {
  const data = await projectsService.removeSkillFromProject(
    req.user,
    req.params.studentId,
    req.params.projectId,
    req.params.skillId,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Skill removed from project successfully",
    ...data,
  });
};

export const listMyProjectLinks = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.listProjectLinks(req.user, studentId, req.params.projectId);
  res.status(StatusCodes.OK).json(data);
};

export const addMyProjectLink = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.addProjectLink(
    req.user,
    studentId,
    req.params.projectId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json({
    msg: "Project link added successfully",
    ...data,
  });
};

export const updateMyProjectLink = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.updateProjectLink(
    req.user,
    studentId,
    req.params.projectId,
    req.params.linkId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Project link updated successfully",
    ...data,
  });
};

export const deleteMyProjectLink = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.deleteProjectLink(
    req.user,
    studentId,
    req.params.projectId,
    req.params.linkId,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Project link removed successfully",
    ...data,
  });
};

export const reorderMyProjectLinks = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await projectsService.reorderProjectLinks(
    req.user,
    studentId,
    req.params.projectId,
    req.body.orders,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Project links reordered successfully",
    ...data,
  });
};

export const listStudentProjectLinks = async (req, res) => {
  const data = await projectsService.listProjectLinks(
    req.user,
    req.params.studentId,
    req.params.projectId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const addStudentProjectLink = async (req, res) => {
  const data = await projectsService.addProjectLink(
    req.user,
    req.params.studentId,
    req.params.projectId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json({
    msg: "Project link added successfully",
    ...data,
  });
};

export const updateStudentProjectLink = async (req, res) => {
  const data = await projectsService.updateProjectLink(
    req.user,
    req.params.studentId,
    req.params.projectId,
    req.params.linkId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Project link updated successfully",
    ...data,
  });
};

export const deleteStudentProjectLink = async (req, res) => {
  const data = await projectsService.deleteProjectLink(
    req.user,
    req.params.studentId,
    req.params.projectId,
    req.params.linkId,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Project link removed successfully",
    ...data,
  });
};

export const reorderStudentProjectLinks = async (req, res) => {
  const data = await projectsService.reorderProjectLinks(
    req.user,
    req.params.studentId,
    req.params.projectId,
    req.body.orders,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Project links reordered successfully",
    ...data,
  });
};
