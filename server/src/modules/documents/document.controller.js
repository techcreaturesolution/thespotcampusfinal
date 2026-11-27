import fs from "fs";
import { StatusCodes } from "http-status-codes";
import { documentService } from "./document.service.js";
import { NotFoundError } from "../../errors/customErrors.js";

const buildReqMeta = (req) => ({
  ip: req.ip || "",
  userAgent: req.get?.("user-agent") || "",
});

export const getDocumentMetadata = async (_req, res) => {
  res.status(StatusCodes.OK).json(documentService.getMetadata());
};

export const listMyDocuments = async (req, res) => {
  const data = await documentService.listDocuments(req.user, req.user.userId, req.query);
  res.status(StatusCodes.OK).json(data);
};

export const getMyDocument = async (req, res) => {
  const data = await documentService.getDocumentById(
    req.user,
    req.user.userId,
    req.params.docId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const uploadMyDocument = async (req, res) => {
  const data = await documentService.uploadDocument(
    req.user,
    req.user.userId,
    req.file,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json(data);
};

export const replaceMyDocument = async (req, res) => {
  const data = await documentService.replaceDocumentFile(
    req.user,
    req.user.userId,
    req.params.docId,
    req.file,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const updateMyDocumentMetadata = async (req, res) => {
  const data = await documentService.updateDocumentMetadata(
    req.user,
    req.user.userId,
    req.params.docId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const downloadMyDocument = async (req, res) => {
  const inline = req.query.inline === "true" || req.query.inline === "1";
  const { filePath, mimeType, originalFilename, disposition } =
    await documentService.getDocumentForDownload(
      req.user,
      req.user.userId,
      req.params.docId,
      { inline },
      buildReqMeta(req),
    );
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError("Document binary not found in storage");
  }
  res.setHeader("Content-Type", mimeType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${encodeURIComponent(originalFilename)}"`,
  );
  fs.createReadStream(filePath).pipe(res);
};

export const deleteMyDocument = async (req, res) => {
  const data = await documentService.deleteDocument(
    req.user,
    req.user.userId,
    req.params.docId,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const associateMyResumeDocument = async (req, res) => {
  const data = await documentService.associateWithResumeVersion(
    req.user,
    req.user.userId,
    req.params.docId,
    req.body.resume_version_id || null,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

// Scoped student endpoints (Student self, Institute/College, TPO, University read-only, Admin)
export const listStudentDocuments = async (req, res) => {
  const data = await documentService.listDocuments(
    req.user,
    req.params.studentId,
    req.query,
  );
  res.status(StatusCodes.OK).json(data);
};

export const getStudentDocument = async (req, res) => {
  const data = await documentService.getDocumentById(
    req.user,
    req.params.studentId,
    req.params.docId,
  );
  res.status(StatusCodes.OK).json(data);
};

export const uploadStudentDocument = async (req, res) => {
  const data = await documentService.uploadDocument(
    req.user,
    req.params.studentId,
    req.file,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.CREATED).json(data);
};

export const replaceStudentDocument = async (req, res) => {
  const data = await documentService.replaceDocumentFile(
    req.user,
    req.params.studentId,
    req.params.docId,
    req.file,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const updateStudentDocumentMetadata = async (req, res) => {
  const data = await documentService.updateDocumentMetadata(
    req.user,
    req.params.studentId,
    req.params.docId,
    req.body,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};

export const downloadStudentDocument = async (req, res) => {
  const inline = req.query.inline === "true" || req.query.inline === "1";
  const { filePath, mimeType, originalFilename, disposition } =
    await documentService.getDocumentForDownload(
      req.user,
      req.params.studentId,
      req.params.docId,
      { inline },
      buildReqMeta(req),
    );
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError("Document binary not found in storage");
  }
  res.setHeader("Content-Type", mimeType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${encodeURIComponent(originalFilename)}"`,
  );
  fs.createReadStream(filePath).pipe(res);
};

export const deleteStudentDocument = async (req, res) => {
  const data = await documentService.deleteDocument(
    req.user,
    req.params.studentId,
    req.params.docId,
    buildReqMeta(req),
  );
  res.status(StatusCodes.OK).json(data);
};
