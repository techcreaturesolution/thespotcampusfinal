import fs from "fs";
import { StatusCodes } from "http-status-codes";
import { certificationService } from "./certification.service.js";
import { NotFoundError } from "../../errors/customErrors.js";

const buildReqMeta = (req) => ({
  ip: req.ip || "",
  userAgent: req.get?.("user-agent") || "",
});

export const getCertificationMetadata = async (_req, res) => {
  res.status(StatusCodes.OK).json(certificationService.getMetadata());
};

export const listMyCertifications = async (req, res) => {
  const data = await certificationService.listStudentCertifications(
    req.user,
    req.user.userId,
    req.query,
  );
  res.status(StatusCodes.OK).json(data);
};

export const getMyCertification = async (req, res) => {
  const data = await certificationService.getCertificationById(
    req.user,
    req.user.userId,
    req.params.certId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const createMyCertification = async (req, res) => {
  const data = await certificationService.createCertification(
    req.user,
    req.user.userId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json(data);
};

export const updateMyCertification = async (req, res) => {
  const data = await certificationService.updateCertification(
    req.user,
    req.user.userId,
    req.params.certId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const deleteMyCertification = async (req, res) => {
  const data = await certificationService.deleteCertification(
    req.user,
    req.user.userId,
    req.params.certId,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const reorderMyCertifications = async (req, res) => {
  const data = await certificationService.reorderCertifications(
    req.user,
    req.user.userId,
    req.body.orders,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const uploadMyCertificateFile = async (req, res) => {
  const data = await certificationService.attachCertificateFile(
    req.user,
    req.user.userId,
    req.params.certId,
    req.file,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const downloadMyCertificateFile = async (req, res) => {
  const { filePath, mimeType, originalName } =
    await certificationService.getCertificateAttachment(
      req.user,
      req.user.userId,
      req.params.certId,
    );
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError("Certificate file no longer exists on server");
  }
  res.setHeader("Content-Type", mimeType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(originalName)}"`,
  );
  fs.createReadStream(filePath).pipe(res);
};

export const deleteMyCertificateFile = async (req, res) => {
  const data = await certificationService.removeCertificateAttachment(
    req.user,
    req.user.userId,
    req.params.certId,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

// Scoped student endpoints (Student self, College/Institute, TPO, University read-only, Admin)
export const listStudentCertifications = async (req, res) => {
  const data = await certificationService.listStudentCertifications(
    req.user,
    req.params.studentId,
    req.query,
  );
  res.status(StatusCodes.OK).json(data);
};

export const getStudentCertification = async (req, res) => {
  const data = await certificationService.getCertificationById(
    req.user,
    req.params.studentId,
    req.params.certId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const createStudentCertification = async (req, res) => {
  const data = await certificationService.createCertification(
    req.user,
    req.params.studentId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json(data);
};

export const updateStudentCertification = async (req, res) => {
  const data = await certificationService.updateCertification(
    req.user,
    req.params.studentId,
    req.params.certId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const deleteStudentCertification = async (req, res) => {
  const data = await certificationService.deleteCertification(
    req.user,
    req.params.studentId,
    req.params.certId,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const reorderStudentCertifications = async (req, res) => {
  const data = await certificationService.reorderCertifications(
    req.user,
    req.params.studentId,
    req.body.orders,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const uploadStudentCertificateFile = async (req, res) => {
  const data = await certificationService.attachCertificateFile(
    req.user,
    req.params.studentId,
    req.params.certId,
    req.file,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const downloadStudentCertificateFile = async (req, res) => {
  const { filePath, mimeType, originalName } =
    await certificationService.getCertificateAttachment(
      req.user,
      req.params.studentId,
      req.params.certId,
    );
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError("Certificate file no longer exists on server");
  }
  res.setHeader("Content-Type", mimeType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(originalName)}"`,
  );
  fs.createReadStream(filePath).pipe(res);
};

export const deleteStudentCertificateFile = async (req, res) => {
  const data = await certificationService.removeCertificateAttachment(
    req.user,
    req.params.studentId,
    req.params.certId,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};
