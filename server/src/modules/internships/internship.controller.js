import { StatusCodes } from "http-status-codes";
import { internshipService } from "./internship.service.js";

const buildReqMeta = (req) => ({
  ip: req.ip || "",
  userAgent: req.get?.("user-agent") || "",
});

export const getInternshipMetadata = async (_req, res) => {
  res.status(StatusCodes.OK).json(internshipService.getMetadata());
};

export const listMyInternships = async (req, res) => {
  const data = await internshipService.listStudentInternships(
    req.user,
    req.user.userId,
    req.query,
  );
  res.status(StatusCodes.OK).json(data);
};

export const getMyInternship = async (req, res) => {
  const data = await internshipService.getInternshipById(
    req.user,
    req.user.userId,
    req.params.internshipId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const createMyInternship = async (req, res) => {
  const data = await internshipService.createInternship(
    req.user,
    req.user.userId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json(data);
};

export const updateMyInternship = async (req, res) => {
  const data = await internshipService.updateInternship(
    req.user,
    req.user.userId,
    req.params.internshipId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const deleteMyInternship = async (req, res) => {
  const data = await internshipService.deleteInternship(
    req.user,
    req.user.userId,
    req.params.internshipId,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const reorderMyInternships = async (req, res) => {
  const data = await internshipService.reorderInternships(
    req.user,
    req.user.userId,
    req.body.orders,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

// Scoped student endpoints (Student self, Institute/College, TPO, University read-only, Admin)
export const listStudentInternships = async (req, res) => {
  const data = await internshipService.listStudentInternships(
    req.user,
    req.params.studentId,
    req.query,
  );
  res.status(StatusCodes.OK).json(data);
};

export const getStudentInternship = async (req, res) => {
  const data = await internshipService.getInternshipById(
    req.user,
    req.params.studentId,
    req.params.internshipId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const createStudentInternship = async (req, res) => {
  const data = await internshipService.createInternship(
    req.user,
    req.params.studentId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json(data);
};

export const updateStudentInternship = async (req, res) => {
  const data = await internshipService.updateInternship(
    req.user,
    req.params.studentId,
    req.params.internshipId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const deleteStudentInternship = async (req, res) => {
  const data = await internshipService.deleteInternship(
    req.user,
    req.params.studentId,
    req.params.internshipId,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const reorderStudentInternships = async (req, res) => {
  const data = await internshipService.reorderInternships(
    req.user,
    req.params.studentId,
    req.body.orders,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};
