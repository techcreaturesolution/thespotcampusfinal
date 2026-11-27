import fs from "fs";
import mongoose from "mongoose";
import tbl_document from "./document.model.js";
import tbl_resume_version from "../resumeVersions/resumeVersion.model.js";
import tbl_student from "../student/student.model.js";
import tbl_audit_log from "../audit/auditLog.model.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { academicProfileService } from "../academicProfile/academicProfile.service.js";
import { sanitizePlainText } from "../projects/projects.service.js";
import {
  deleteStoredDocumentFile,
  resolveDocumentStoragePath,
  sanitizeOriginalFilename,
} from "../../middleware/documentUploadMiddleware.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/customErrors.js";
import {
  DOCUMENT_STATUS,
  DOCUMENT_TYPES,
  DOCUMENT_VISIBILITY,
  MAX_DOCUMENT_FILE_BYTES,
  MAX_DOCUMENTS_PER_USER,
  MAX_TOTAL_STORAGE_BYTES_PER_USER,
} from "../../utils/constants.js";

const PROTECTED_PAYLOAD_FIELDS = [
  "owner_id",
  "student_id",
  "user_id",
  "student_profile_id",
  "institute_id",
  "college_id",
  "university_id",
  "storage_key",
  "storage_provider",
  "checksum",
  "malware_scan_status",
  "is_deleted",
  "deleted_at",
  "deleted_by_id",
  "deleted_by_role",
];

const INLINE_SAFE_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

const escapeRegex = (val) => String(val).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const formatDocumentResponse = (doc, isSelfMode = false) => ({
  id: doc._id,
  owner_id: doc.owner_id,
  document_type: doc.document_type,
  title: doc.title || doc.original_filename,
  description: doc.description || "",
  original_filename: doc.original_filename,
  mime_type: doc.mime_type,
  file_size: doc.file_size,
  checksum: doc.checksum,
  version: doc.version ?? 1,
  malware_scan_status: doc.malware_scan_status || "NotScanned",
  visibility: doc.visibility || DOCUMENT_VISIBILITY.PRIVATE,
  status: doc.status || DOCUMENT_STATUS.AVAILABLE,
  preview_supported: INLINE_SAFE_MIMES.has(String(doc.mime_type || "").toLowerCase()),
  download_path: isSelfMode
    ? `/api/documents/me/${doc._id}/download`
    : `/api/documents/student/${doc.owner_id}/${doc._id}/download`,
  created_at: doc.createdAt || null,
  updated_at: doc.updatedAt || null,
});

export const createDocumentService = (deps = {}) => {
  const Document = deps.Document || tbl_document;
  const ResumeVersion = deps.ResumeVersion || tbl_resume_version;
  const Student = deps.Student || tbl_student;
  const AuditLog = deps.AuditLog || tbl_audit_log;
  const accessService = deps.accessService || academicProfileService;
  const isValidObjectId = deps.isValidObjectId || mongoose.isValidObjectId;
  const resolvePath = deps.resolvePath || resolveDocumentStoragePath;
  const deleteFile = deps.deleteFile || deleteStoredDocumentFile;

  const assertValidId = (id, label = "ID") => {
    if (!id || !isValidObjectId(id)) {
      throw new BadRequestError(`Invalid ${label} format`);
    }
  };

  const assertPayloadSafe = (payload = {}) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return;
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

  const assertVisibleToActor = (scopedActor, ownerId, doc) => {
    if (scopedActor.role === "Admin" || String(scopedActor.userId) === String(ownerId)) {
      return true;
    }
    return doc.visibility !== DOCUMENT_VISIBILITY.PRIVATE;
  };

  const getMetadata = () => ({
    document_types: Object.values(DOCUMENT_TYPES),
    statuses: Object.values(DOCUMENT_STATUS),
    visibilities: Object.values(DOCUMENT_VISIBILITY),
    max_file_bytes: MAX_DOCUMENT_FILE_BYTES,
    max_documents_per_user: MAX_DOCUMENTS_PER_USER,
    max_total_storage_bytes: MAX_TOTAL_STORAGE_BYTES_PER_USER,
  });

  const listDocuments = async (
    actor,
    targetStudentId,
    { document_type = "", status = "", search = "" } = {},
  ) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");

    const filter = { owner_id: student._id, is_deleted: false };
    if (document_type) {
      if (!Object.values(DOCUMENT_TYPES).includes(document_type)) {
        throw new BadRequestError("Invalid document_type filter");
      }
      filter.document_type = document_type;
    }
    if (status) {
      if (!Object.values(DOCUMENT_STATUS).includes(status)) {
        throw new BadRequestError("Invalid status filter");
      }
      filter.status = status;
    }
    const cleanSearch = sanitizePlainText(search).slice(0, 100);
    if (cleanSearch) {
      const rx = new RegExp(escapeRegex(cleanSearch), "i");
      filter.$or = [{ title: rx }, { original_filename: rx }, { description: rx }];
    }

    const isOwnerOrAdmin =
      scopedActor.role === "Admin" || String(scopedActor.userId) === String(student._id);
    if (!isOwnerOrAdmin) {
      filter.visibility = { $ne: DOCUMENT_VISIBILITY.PRIVATE };
    }

    const docs = await Document.find(filter).sort({ updatedAt: -1, createdAt: -1 });
    const visibleDocs = docs.filter((d) => assertVisibleToActor(scopedActor, student._id, d));
    const storageUsedBytes = visibleDocs.reduce((acc, d) => acc + (Number(d.file_size) || 0), 0);
    const isSelfMode =
      scopedActor.role === "Student" && String(scopedActor.userId) === String(student._id);

    return {
      owner_id: student._id,
      documents: visibleDocs.map((d) => formatDocumentResponse(d, isSelfMode)),
      quota: {
        document_count: visibleDocs.length,
        storage_used_bytes: storageUsedBytes,
        max_documents: MAX_DOCUMENTS_PER_USER,
        max_total_storage_bytes: MAX_TOTAL_STORAGE_BYTES_PER_USER,
      },
      ...getMetadata(),
    };
  };

  const getDocumentById = async (actor, targetStudentId, docId) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");
    assertValidId(docId, "document ID");

    const doc = await Document.findOne({ _id: docId, owner_id: student._id, is_deleted: false });
    if (!doc) {
      throw new NotFoundError("Document not found");
    }
    if (!assertVisibleToActor(scopedActor, student._id, doc)) {
      throw new UnauthorizedError("This document is private");
    }

    const isSelfMode =
      scopedActor.role === "Student" && String(scopedActor.userId) === String(student._id);
    return { document: formatDocumentResponse(doc, isSelfMode) };
  };

  const uploadDocument = async (actor, targetStudentId, file, body = {}, reqMeta = {}) => {
    const cleanupOnFailure = () => {
      if (file?.filename) deleteFile(file.filename);
    };

    try {
      const scopedActor = await accessService.resolveActorScope(actor);
      const student = await loadTargetStudent(targetStudentId);
      accessService.assertCanAccessStudent(scopedActor, student, "write");
      assertPayloadSafe(body);

      if (!file || !file.filename) {
        throw new BadRequestError("Document file is required");
      }

      const documentType = String(body.document_type || DOCUMENT_TYPES.RESUME).toUpperCase();
      if (!Object.values(DOCUMENT_TYPES).includes(documentType)) {
        throw new BadRequestError("Invalid document_type");
      }

      const visibility = body.visibility || DOCUMENT_VISIBILITY.PRIVATE;
      if (!Object.values(DOCUMENT_VISIBILITY).includes(visibility)) {
        throw new BadRequestError("Invalid document visibility");
      }

      const activeDocs = await Document.find({ owner_id: student._id, is_deleted: false });
      if (activeDocs.length >= MAX_DOCUMENTS_PER_USER) {
        throw new BadRequestError(
          `Document quota reached (maximum ${MAX_DOCUMENTS_PER_USER} active documents)`,
        );
      }
      const usedBytes = activeDocs.reduce((acc, d) => acc + (Number(d.file_size) || 0), 0);
      if (usedBytes + Number(file.size) > MAX_TOTAL_STORAGE_BYTES_PER_USER) {
        throw new BadRequestError("Storage quota of 50 MB exceeded");
      }

      const checksum = String(file.checksum || "");
      const dupChecksum = activeDocs.find(
        (d) => d.document_type === documentType && d.checksum === checksum,
      );
      if (dupChecksum) {
        throw new BadRequestError(
          "An identical file has already been uploaded for this document type",
        );
      }

      const originalName =
        file.sanitizedOriginalName || sanitizeOriginalFilename(file.originalname || file.filename);
      const title = sanitizePlainText(body.title).slice(0, 150) || originalName;
      const description = sanitizePlainText(body.description).slice(0, 500);

      const created = await Document.create({
        owner_id: student._id,
        document_type: documentType,
        title,
        description,
        original_filename: originalName,
        storage_key: file.filename,
        storage_provider: "local_private",
        mime_type: file.mimetype || "application/pdf",
        file_size: Number(file.size) || 1,
        checksum,
        version: 1,
        malware_scan_status: "NotScanned",
        visibility,
        status: DOCUMENT_STATUS.AVAILABLE,
        is_deleted: false,
      });

      await recordAuditLog(
        {
          actorId: scopedActor.userId,
          actorRole: scopedActor.role,
          targetUserId: student._id,
          targetModel: "tbl_document",
          targetId: created._id,
          action: "UPLOAD_DOCUMENT",
          changedFields: ["storage_key", "document_type", "visibility"],
          previousValues: {},
          newValues: {
            document_type: documentType,
            original_filename: originalName,
            file_size: created.file_size,
          },
          ipAddress: reqMeta.ip || "",
          userAgent: reqMeta.userAgent || "",
        },
        AuditLog,
      );

      const isSelfMode =
        scopedActor.role === "Student" && String(scopedActor.userId) === String(student._id);
      return {
        msg: "Document uploaded successfully",
        document: formatDocumentResponse(created, isSelfMode),
      };
    } catch (err) {
      cleanupOnFailure();
      throw err;
    }
  };

  const replaceDocumentFile = async (
    actor,
    targetStudentId,
    docId,
    file,
    body = {},
    reqMeta = {},
  ) => {
    const cleanupNewFile = () => {
      if (file?.filename) deleteFile(file.filename);
    };

    try {
      const scopedActor = await accessService.resolveActorScope(actor);
      const student = await loadTargetStudent(targetStudentId);
      accessService.assertCanAccessStudent(scopedActor, student, "write");
      assertValidId(docId, "document ID");
      assertPayloadSafe(body);

      if (!file || !file.filename) {
        throw new BadRequestError("Replacement document file is required");
      }

      const existing = await Document.findOne({
        _id: docId,
        owner_id: student._id,
        is_deleted: false,
      });
      if (!existing) {
        throw new NotFoundError("Document not found");
      }

      const dupOther = await Document.findOne({
        _id: { $ne: existing._id },
        owner_id: student._id,
        document_type: existing.document_type,
        checksum: String(file.checksum || ""),
        is_deleted: false,
      });
      if (dupOther) {
        throw new BadRequestError("Another active document already matches this file content");
      }

      const previousKey = existing.storage_key;
      const originalName =
        file.sanitizedOriginalName || sanitizeOriginalFilename(file.originalname || file.filename);

      existing.storage_key = file.filename;
      existing.original_filename = originalName;
      existing.mime_type = file.mimetype || existing.mime_type;
      existing.file_size = Number(file.size) || 1;
      existing.checksum = String(file.checksum || "");
      existing.version = (existing.version || 1) + 1;
      existing.status = DOCUMENT_STATUS.AVAILABLE;
      if (body.title !== undefined) {
        existing.title = sanitizePlainText(body.title).slice(0, 150) || originalName;
      }
      await existing.save();

      if (previousKey && previousKey !== file.filename) {
        deleteFile(previousKey);
      }

      await recordAuditLog(
        {
          actorId: scopedActor.userId,
          actorRole: scopedActor.role,
          targetUserId: student._id,
          targetModel: "tbl_document",
          targetId: existing._id,
          action: "REPLACE_DOCUMENT",
          changedFields: ["storage_key", "checksum", "version"],
          previousValues: { version: existing.version - 1 },
          newValues: { original_filename: originalName, version: existing.version },
          ipAddress: reqMeta.ip || "",
          userAgent: reqMeta.userAgent || "",
        },
        AuditLog,
      );

      const isSelfMode =
        scopedActor.role === "Student" && String(scopedActor.userId) === String(student._id);
      return {
        msg: "Document replaced successfully",
        document: formatDocumentResponse(existing, isSelfMode),
      };
    } catch (err) {
      cleanupNewFile();
      throw err;
    }
  };

  const updateDocumentMetadata = async (actor, targetStudentId, docId, body = {}, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(docId, "document ID");
    assertPayloadSafe(body);

    const existing = await Document.findOne({
      _id: docId,
      owner_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Document not found");
    }

    if (body.title !== undefined) {
      existing.title = sanitizePlainText(body.title).slice(0, 150) || existing.original_filename;
    }
    if (body.description !== undefined) {
      existing.description = sanitizePlainText(body.description).slice(0, 500);
    }
    if (body.visibility !== undefined) {
      if (!Object.values(DOCUMENT_VISIBILITY).includes(body.visibility)) {
        throw new BadRequestError("Invalid document visibility");
      }
      existing.visibility = body.visibility;
    }
    if (body.status !== undefined) {
      if (![DOCUMENT_STATUS.AVAILABLE, DOCUMENT_STATUS.ARCHIVED].includes(body.status)) {
        throw new BadRequestError("Invalid document status");
      }
      existing.status = body.status;
    }

    await existing.save();

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_document",
        targetId: existing._id,
        action: "UPDATE_DOCUMENT_METADATA",
        changedFields: Object.keys(body),
        previousValues: {},
        newValues: { title: existing.title, visibility: existing.visibility, status: existing.status },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const isSelfMode =
      scopedActor.role === "Student" && String(scopedActor.userId) === String(student._id);
    return {
      msg: "Document updated",
      document: formatDocumentResponse(existing, isSelfMode),
    };
  };

  const getDocumentForDownload = async (
    actor,
    targetStudentId,
    docId,
    { inline = false } = {},
    reqMeta = {},
  ) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");
    assertValidId(docId, "document ID");

    const doc = await Document.findOne({ _id: docId, owner_id: student._id, is_deleted: false });
    if (!doc) {
      throw new NotFoundError("Document not found");
    }
    if (!assertVisibleToActor(scopedActor, student._id, doc)) {
      throw new UnauthorizedError("This document is private");
    }
    if (doc.status === DOCUMENT_STATUS.REJECTED) {
      throw new UnauthorizedError("Rejected documents cannot be downloaded");
    }

    const filePath = resolvePath(doc.storage_key);
    if (!filePath) {
      throw new NotFoundError("Stored document file unavailable");
    }

    const canInline = inline && INLINE_SAFE_MIMES.has(String(doc.mime_type || "").toLowerCase());
    const disposition = canInline ? "inline" : "attachment";

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_document",
        targetId: doc._id,
        action: "DOWNLOAD_DOCUMENT",
        changedFields: [],
        previousValues: {},
        newValues: { disposition },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return {
      filePath,
      mimeType: doc.mime_type || "application/octet-stream",
      originalFilename: doc.original_filename || "document",
      disposition,
    };
  };

  const deleteDocument = async (actor, targetStudentId, docId, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(docId, "document ID");

    const existing = await Document.findOne({
      _id: docId,
      owner_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Document not found");
    }

    existing.is_deleted = true;
    existing.deleted_at = new Date();
    existing.deleted_by_id = scopedActor.userId;
    existing.deleted_by_role = scopedActor.role;
    await existing.save();

    // Clear dangling associations from S1-08 resume versions without altering S1-08 configurations
    await ResumeVersion.updateMany(
      { student_id: student._id, uploaded_document_id: existing._id },
      { $set: { uploaded_document_id: null } },
    );

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_document",
        targetId: existing._id,
        action: "DELETE_DOCUMENT",
        changedFields: ["is_deleted"],
        previousValues: { original_filename: existing.original_filename },
        newValues: { is_deleted: true },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { msg: "Document deleted" };
  };

  // Clean integration contract with S1-08 Resume Versions
  const associateWithResumeVersion = async (
    actor,
    targetStudentId,
    docId,
    resumeVersionId,
    reqMeta = {},
  ) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(docId, "document ID");

    const doc = await Document.findOne({ _id: docId, owner_id: student._id, is_deleted: false });
    if (!doc) {
      throw new NotFoundError("Document not found");
    }
    if (doc.document_type !== DOCUMENT_TYPES.RESUME) {
      throw new BadRequestError("Only RESUME documents can be linked to a resume version");
    }
    if (doc.status !== DOCUMENT_STATUS.AVAILABLE) {
      throw new BadRequestError("Archived or rejected documents cannot be linked");
    }

    if (!resumeVersionId) {
      await ResumeVersion.updateMany(
        { student_id: student._id, uploaded_document_id: doc._id },
        { $set: { uploaded_document_id: null } },
      );
      return { msg: "Document unlinked from resume versions" };
    }

    assertValidId(resumeVersionId, "resume version ID");
    const version = await ResumeVersion.findOne({
      _id: resumeVersionId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!version) {
      throw new NotFoundError("Target resume version not found for this student");
    }

    version.uploaded_document_id = doc._id;
    await version.save();

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_resume_version",
        targetId: version._id,
        action: "ASSOCIATE_RESUME_DOCUMENT",
        changedFields: ["uploaded_document_id"],
        previousValues: {},
        newValues: { document_id: doc._id },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return {
      msg: "Resume document associated with resume version",
      resume_version_id: version._id,
      uploaded_document_id: doc._id,
    };
  };

  return {
    getMetadata,
    listDocuments,
    getDocumentById,
    uploadDocument,
    replaceDocumentFile,
    updateDocumentMetadata,
    getDocumentForDownload,
    deleteDocument,
    associateWithResumeVersion,
  };
};

export const documentService = createDocumentService();
