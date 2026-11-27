import { StatusCodes } from "http-status-codes";
import { academicProfileService } from "./academicProfile.service.js";
import { UnauthorizedError } from "../../errors/customErrors.js";

const getReqMeta = (req) => ({
  ip: req.ip || "",
  userAgent: req.get("user-agent") || "",
});

const requireStudentSelf = (req) => {
  if (req.user.role !== "Student") {
    throw new UnauthorizedError("Only student accounts can access '/me' academic profile endpoints");
  }
  return req.user.userId;
};

export const getMyAcademicProfile = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await academicProfileService.getAcademicProfile(req.user, studentId);
  res.status(StatusCodes.OK).json(data);
};

export const updateMyAcademicProfile = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await academicProfileService.updateAcademicProfile(
    req.user,
    studentId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Academic profile updated successfully",
    ...data,
  });
};

export const getMyAcademicCompletion = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await academicProfileService.getCompletion(req.user, studentId);
  res.status(StatusCodes.OK).json(data);
};

export const getMyAcademicHistory = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await academicProfileService.getAcademicHistory(req.user, studentId, req.query);
  res.status(StatusCodes.OK).json(data);
};

export const addMyAcademicHistory = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await academicProfileService.addAcademicHistory(
    req.user,
    studentId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json({
    msg: "Academic history record added successfully",
    ...data,
  });
};

export const updateMyAcademicHistory = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await academicProfileService.updateAcademicHistory(
    req.user,
    studentId,
    req.params.historyId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Academic history record updated successfully",
    ...data,
  });
};

export const deleteMyAcademicHistory = async (req, res) => {
  const studentId = requireStudentSelf(req);
  const data = await academicProfileService.deleteAcademicHistory(
    req.user,
    studentId,
    req.params.historyId,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Academic history record deleted successfully",
    ...data,
  });
};

export const getStudentAcademicProfile = async (req, res) => {
  const data = await academicProfileService.getAcademicProfile(req.user, req.params.studentId);
  res.status(StatusCodes.OK).json(data);
};

export const createStudentAcademicProfile = async (req, res) => {
  const data = await academicProfileService.initializeAcademicProfile(
    req.user,
    req.params.studentId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json({
    msg: "Academic profile initialized successfully",
    ...data,
  });
};

export const updateStudentAcademicProfile = async (req, res) => {
  const data = await academicProfileService.updateAcademicProfile(
    req.user,
    req.params.studentId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Academic profile updated successfully",
    ...data,
  });
};

export const getStudentAcademicCompletion = async (req, res) => {
  const data = await academicProfileService.getCompletion(req.user, req.params.studentId);
  res.status(StatusCodes.OK).json(data);
};

export const getStudentAcademicHistory = async (req, res) => {
  const data = await academicProfileService.getAcademicHistory(
    req.user,
    req.params.studentId,
    req.query,
  );
  res.status(StatusCodes.OK).json(data);
};

export const addStudentAcademicHistory = async (req, res) => {
  const data = await academicProfileService.addAcademicHistory(
    req.user,
    req.params.studentId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json({
    msg: "Academic history record added successfully",
    ...data,
  });
};

export const updateStudentAcademicHistory = async (req, res) => {
  const data = await academicProfileService.updateAcademicHistory(
    req.user,
    req.params.studentId,
    req.params.historyId,
    req.body,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Academic history record updated successfully",
    ...data,
  });
};

export const deleteStudentAcademicHistory = async (req, res) => {
  const data = await academicProfileService.deleteAcademicHistory(
    req.user,
    req.params.studentId,
    req.params.historyId,
    getReqMeta(req),
  );
  res.status(StatusCodes.OK).json({
    msg: "Academic history record deleted successfully",
    ...data,
  });
};

export const getStudentAcademicAuditLogs = async (req, res) => {
  const data = await academicProfileService.getAuditLogs(
    req.user,
    req.params.studentId,
    req.query,
  );
  res.status(StatusCodes.OK).json(data);
};
