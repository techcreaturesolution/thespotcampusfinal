import { StatusCodes } from "http-status-codes";
import { resumeVersionService } from "./resumeVersion.service.js";

const buildReqMeta = (req) => ({
  ip: req.ip || "",
  userAgent: req.get?.("user-agent") || "",
});

export const getResumeVersionMetadata = async (_req, res) => {
  const meta = await resumeVersionService.getMetadata();
  res.status(StatusCodes.OK).json(meta);
};

export const listMyResumeVersions = async (req, res) => {
  const data = await resumeVersionService.listStudentResumeVersions(
    req.user,
    req.user.userId,
    req.query,
  );
  res.status(StatusCodes.OK).json(data);
};

export const getMyResumeVersion = async (req, res) => {
  const data = await resumeVersionService.getResumeVersionById(
    req.user,
    req.user.userId,
    req.params.resumeId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const createMyResumeVersion = async (req, res) => {
  const data = await resumeVersionService.createResumeVersion(
    req.user,
    req.user.userId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json(data);
};

export const updateMyResumeVersion = async (req, res) => {
  const data = await resumeVersionService.updateResumeVersion(
    req.user,
    req.user.userId,
    req.params.resumeId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const duplicateMyResumeVersion = async (req, res) => {
  const data = await resumeVersionService.duplicateResumeVersion(
    req.user,
    req.user.userId,
    req.params.resumeId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json(data);
};

export const setDefaultMyResumeVersion = async (req, res) => {
  const data = await resumeVersionService.setDefaultResumeVersion(
    req.user,
    req.user.userId,
    req.params.resumeId,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const deleteMyResumeVersion = async (req, res) => {
  const data = await resumeVersionService.deleteResumeVersion(
    req.user,
    req.user.userId,
    req.params.resumeId,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const updateMyResumeShare = async (req, res) => {
  const data = await resumeVersionService.updateResumeShare(
    req.user,
    req.user.userId,
    req.params.resumeId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const previewMyResumeVersion = async (req, res) => {
  const data = await resumeVersionService.previewResumeVersion(
    req.user,
    req.user.userId,
    req.params.resumeId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const downloadMyResumePdf = async (req, res) => {
  const { pdfBuffer, filename } = await resumeVersionService.generateResumePdf(
    req.user,
    req.user.userId,
    req.params.resumeId,
    buildReqMeta(req),
  );
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": pdfBuffer.length,
    "X-Content-Type-Options": "nosniff",
  });
  res.send(pdfBuffer);
};

// Scoped student endpoints (Student self, Institute/College, TPO, University read-only, Admin)
export const listStudentResumeVersions = async (req, res) => {
  const data = await resumeVersionService.listStudentResumeVersions(
    req.user,
    req.params.studentId,
    req.query,
  );
  res.status(StatusCodes.OK).json(data);
};

export const getStudentResumeVersion = async (req, res) => {
  const data = await resumeVersionService.getResumeVersionById(
    req.user,
    req.params.studentId,
    req.params.resumeId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const previewStudentResumeVersion = async (req, res) => {
  const data = await resumeVersionService.previewResumeVersion(
    req.user,
    req.params.studentId,
    req.params.resumeId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const downloadStudentResumePdf = async (req, res) => {
  const { pdfBuffer, filename } = await resumeVersionService.generateResumePdf(
    req.user,
    req.params.studentId,
    req.params.resumeId,
    buildReqMeta(req),
  );
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": pdfBuffer.length,
    "X-Content-Type-Options": "nosniff",
  });
  res.send(pdfBuffer);
};

export const getSharedResumePreview = async (req, res) => {
  const data = await resumeVersionService.getSharedResumeByToken(req.params.shareToken);
  res.status(StatusCodes.OK).json(data);
};
