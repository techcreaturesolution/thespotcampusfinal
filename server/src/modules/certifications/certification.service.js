import mongoose from "mongoose";
import tbl_certification from "./certification.model.js";
import tbl_student from "../student/student.model.js";
import tbl_audit_log from "../audit/auditLog.model.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { academicProfileService } from "../academicProfile/academicProfile.service.js";
import {
  sanitizePlainText,
  validateAndNormalizeProjectUrl,
} from "../projects/projects.service.js";
import {
  removeStoredCertificateFile,
  resolveCertificateFilePath,
} from "../../middleware/certificationUploadMiddleware.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/customErrors.js";
import {
  CERTIFICATION_CATEGORIES,
  CERTIFICATION_STATUS,
  CERTIFICATION_VISIBILITY,
} from "../../utils/constants.js";

const PROTECTED_PAYLOAD_FIELDS = [
  "student_id",
  "institute_id",
  "college_id",
  "university_id",
  "verification_status",
  "created_by",
  "is_deleted",
  "deleted_at",
  "deleted_by_id",
  "deleted_by_role",
  "certificate_file",
];

const WRITABLE_FIELDS = [
  "title",
  "issuing_organization",
  "category",
  "credential_id",
  "credential_url",
  "issue_date",
  "expiry_date",
  "does_not_expire",
  "description",
  "visibility",
  "status",
];

const escapeRegex = (val) => String(val).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const validateAndNormalizeCredentialUrl = (rawUrl) => {
  if (rawUrl === undefined || rawUrl === null) return "";
  const normalized = validateAndNormalizeProjectUrl(rawUrl, "Credential URL");
  if (!normalized) return "";
  if (normalized.length > 500) {
    throw new BadRequestError("Credential URL must not exceed 500 characters");
  }
  const parsed = new URL(normalized);
  if (parsed.protocol !== "https:") {
    throw new BadRequestError("Credential URL must use https:// protocol");
  }
  return parsed.toString();
};

export const validateCertificationDates = (issueRaw, expiryRaw, doesNotExpire) => {
  if (!issueRaw) {
    throw new BadRequestError("issue_date is required");
  }
  const issueDate = new Date(issueRaw);
  if (Number.isNaN(issueDate.getTime())) {
    throw new BadRequestError("Invalid issue_date");
  }

  if (doesNotExpire) {
    return { issue_date: issueDate, expiry_date: null };
  }

  const expiryDate = expiryRaw ? new Date(expiryRaw) : null;
  if (expiryDate && Number.isNaN(expiryDate.getTime())) {
    throw new BadRequestError("Invalid expiry_date");
  }
  if (expiryDate && expiryDate < issueDate) {
    throw new BadRequestError("expiry_date cannot be earlier than issue_date");
  }

  return { issue_date: issueDate, expiry_date: expiryDate };
};

export const formatCertificationResponse = (certDoc, isSelfMode = false) => {
  const doesNotExpire = Boolean(certDoc.does_not_expire);
  const expiryDate = doesNotExpire ? null : certDoc.expiry_date || null;
  const now = new Date();
  const isExpired = Boolean(!doesNotExpire && expiryDate && new Date(expiryDate) < now);
  const file = certDoc.certificate_file || null;

  return {
    id: certDoc._id,
    student_id: certDoc.student_id,
    title: certDoc.title,
    issuing_organization: certDoc.issuing_organization,
    category: certDoc.category || "Technical",
    credential_id: certDoc.credential_id || "",
    credential_url: certDoc.credential_url || "",
    issue_date: certDoc.issue_date || null,
    expiry_date: expiryDate,
    does_not_expire: doesNotExpire,
    is_expired: isExpired,
    description: certDoc.description || "",
    visibility: certDoc.visibility || CERTIFICATION_VISIBILITY.PUBLIC,
    status: certDoc.status || CERTIFICATION_STATUS.ACTIVE,
    display_order: certDoc.display_order ?? 0,
    has_attachment: Boolean(file && file.filename),
    attachment:
      file && file.filename
        ? {
            original_name: file.original_name,
            mime_type: file.mime_type,
            size_bytes: file.size_bytes,
            uploaded_at: file.uploaded_at || null,
            download_path: isSelfMode
              ? `/api/certifications/me/${certDoc._id}/certificate`
              : `/api/certifications/student/${certDoc.student_id}/${certDoc._id}/certificate`,
          }
        : null,
    created_at: certDoc.createdAt || null,
    updated_at: certDoc.updatedAt || null,
  };
};

export const createCertificationService = (deps = {}) => {
  const Certification = deps.Certification || tbl_certification;
  const Student = deps.Student || tbl_student;
  const AuditLog = deps.AuditLog || tbl_audit_log;
  const accessService = deps.accessService || academicProfileService;
  const isValidObjectId = deps.isValidObjectId || mongoose.isValidObjectId;
  const resolveFilePath = deps.resolveFilePath || resolveCertificateFilePath;
  const removeFile = deps.removeFile || removeStoredCertificateFile;

  const assertValidId = (id, label = "ID") => {
    if (!id || !isValidObjectId(id)) {
      throw new BadRequestError(`Invalid ${label} format`);
    }
  };

  const assertWritablePayloadSafe = (payload) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestError("Request body must be a JSON object");
    }
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

  const assertVisibleToActor = (scopedActor, studentId, cert) => {
    if (scopedActor.role === "Admin" || String(scopedActor.userId) === String(studentId)) {
      return true;
    }
    return cert.visibility !== CERTIFICATION_VISIBILITY.PRIVATE;
  };

  const ensureNoDuplicate = async (
    studentId,
    { normalizedTitle, normalizedIssuer, normalizedCredentialId, issueDate },
    excludeCertId = null,
  ) => {
    const baseFilter = {
      student_id: studentId,
      is_deleted: false,
      normalized_issuer: normalizedIssuer,
    };
    if (excludeCertId) {
      baseFilter._id = { $ne: excludeCertId };
    }

    if (normalizedCredentialId) {
      const existingByCredential = await Certification.findOne({
        ...baseFilter,
        normalized_credential_id: normalizedCredentialId,
      });
      if (existingByCredential) {
        throw new BadRequestError(
          "A certification with this issuing organization and credential ID already exists",
        );
      }
      return;
    }

    const existingSameTitleAndDate = await Certification.findOne({
      ...baseFilter,
      normalized_title: normalizedTitle,
      issue_date: issueDate,
    });
    if (existingSameTitleAndDate) {
      throw new BadRequestError(
        "An identical certification with the same title, issuer, and issue date already exists",
      );
    }
  };

  const getMetadata = () => ({
    categories: CERTIFICATION_CATEGORIES,
    statuses: Object.values(CERTIFICATION_STATUS),
    visibilities: Object.values(CERTIFICATION_VISIBILITY),
  });

  const listStudentCertifications = async (
    actor,
    targetStudentId,
    { status = "", category = "", search = "", page = 1, limit = 20 } = {},
  ) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const filter = { student_id: student._id, is_deleted: false };

    if (status) {
      if (!Object.values(CERTIFICATION_STATUS).includes(status)) {
        throw new BadRequestError("Invalid certification status filter");
      }
      filter.status = status;
    }

    if (category) {
      if (!CERTIFICATION_CATEGORIES.includes(category)) {
        throw new BadRequestError("Invalid certification category filter");
      }
      filter.category = category;
    }

    const cleanSearch = sanitizePlainText(search).slice(0, 100);
    if (cleanSearch) {
      const rx = new RegExp(escapeRegex(cleanSearch), "i");
      filter.$or = [{ title: rx }, { issuing_organization: rx }, { credential_id: rx }];
    }

    const isOwnerOrAdmin =
      scopedActor.role === "Admin" || String(scopedActor.userId) === String(student._id);
    if (!isOwnerOrAdmin) {
      filter.visibility = { $ne: CERTIFICATION_VISIBILITY.PRIVATE };
    }

    const [certs, total] = await Promise.all([
      Certification.find(filter)
        .sort({ display_order: 1, issue_date: -1, createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Certification.countDocuments(filter),
    ]);

    const visibleCerts = certs.filter((c) => assertVisibleToActor(scopedActor, student._id, c));
    const isSelfMode = String(scopedActor.userId) === String(student._id) && scopedActor.role === "Student";

    return {
      student_id: student._id,
      certifications: visibleCerts.map((c) => formatCertificationResponse(c, isSelfMode)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        total_pages: Math.ceil(total / safeLimit) || 1,
      },
      ...getMetadata(),
    };
  };

  const getCertificationById = async (actor, targetStudentId, certId) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");
    assertValidId(certId, "certification ID");

    const cert = await Certification.findOne({
      _id: certId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!cert) {
      throw new NotFoundError("Certification not found");
    }
    if (!assertVisibleToActor(scopedActor, student._id, cert)) {
      throw new UnauthorizedError("This certification is private");
    }

    const isSelfMode = String(scopedActor.userId) === String(student._id) && scopedActor.role === "Student";
    return { certification: formatCertificationResponse(cert, isSelfMode) };
  };

  const createCertification = async (actor, targetStudentId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertWritablePayloadSafe(payload);

    const title = sanitizePlainText(payload.title);
    if (title.length < 2 || title.length > 150) {
      throw new BadRequestError("Certification title must be between 2 and 150 characters");
    }

    const issuingOrganization = sanitizePlainText(payload.issuing_organization);
    if (issuingOrganization.length < 2 || issuingOrganization.length > 120) {
      throw new BadRequestError("Issuing organization must be between 2 and 120 characters");
    }

    const category = payload.category || "Technical";
    if (!CERTIFICATION_CATEGORIES.includes(category)) {
      throw new BadRequestError("Invalid certification category");
    }

    const status = payload.status || CERTIFICATION_STATUS.ACTIVE;
    if (!Object.values(CERTIFICATION_STATUS).includes(status)) {
      throw new BadRequestError("Invalid certification status");
    }

    const visibility = payload.visibility || CERTIFICATION_VISIBILITY.PUBLIC;
    if (!Object.values(CERTIFICATION_VISIBILITY).includes(visibility)) {
      throw new BadRequestError("Invalid certification visibility");
    }

    const credentialId = sanitizePlainText(payload.credential_id).slice(0, 120);
    const credentialUrl = validateAndNormalizeCredentialUrl(payload.credential_url);
    const doesNotExpire = Boolean(payload.does_not_expire);
    const { issue_date, expiry_date } = validateCertificationDates(
      payload.issue_date,
      payload.expiry_date,
      doesNotExpire,
    );
    const description = sanitizePlainText(payload.description).slice(0, 1000);

    const normalizedTitle = title.toLowerCase();
    const normalizedIssuer = issuingOrganization.toLowerCase();
    const normalizedCredentialId = credentialId.toLowerCase();

    await ensureNoDuplicate(student._id, {
      normalizedTitle,
      normalizedIssuer,
      normalizedCredentialId,
      issueDate: issue_date,
    });

    const currentCount = await Certification.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });

    const created = await Certification.create({
      student_id: student._id,
      title,
      normalized_title: normalizedTitle,
      issuing_organization: issuingOrganization,
      normalized_issuer: normalizedIssuer,
      category,
      credential_id: credentialId,
      normalized_credential_id: normalizedCredentialId,
      credential_url: credentialUrl,
      issue_date,
      expiry_date,
      does_not_expire: doesNotExpire,
      description,
      visibility,
      status,
      display_order: currentCount,
      is_deleted: false,
    });

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_certification",
        targetId: created._id,
        action: "CREATE_CERTIFICATION",
        changedFields: WRITABLE_FIELDS.filter((f) => payload[f] !== undefined),
        previousValues: {},
        newValues: { title, issuing_organization: issuingOrganization, visibility, status },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const isSelfMode = String(scopedActor.userId) === String(student._id) && scopedActor.role === "Student";
    return {
      msg: "Certification added",
      certification: formatCertificationResponse(created, isSelfMode),
    };
  };

  const updateCertification = async (actor, targetStudentId, certId, payload, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(certId, "certification ID");
    assertWritablePayloadSafe(payload);

    const existing = await Certification.findOne({
      _id: certId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Certification not found");
    }

    const previousSnapshot = {
      title: existing.title,
      issuing_organization: existing.issuing_organization,
      status: existing.status,
      visibility: existing.visibility,
    };
    const changedFields = [];

    if (payload.title !== undefined) {
      const nextTitle = sanitizePlainText(payload.title);
      if (nextTitle.length < 2 || nextTitle.length > 150) {
        throw new BadRequestError("Certification title must be between 2 and 150 characters");
      }
      existing.title = nextTitle;
      existing.normalized_title = nextTitle.toLowerCase();
      changedFields.push("title");
    }

    if (payload.issuing_organization !== undefined) {
      const nextIssuer = sanitizePlainText(payload.issuing_organization);
      if (nextIssuer.length < 2 || nextIssuer.length > 120) {
        throw new BadRequestError("Issuing organization must be between 2 and 120 characters");
      }
      existing.issuing_organization = nextIssuer;
      existing.normalized_issuer = nextIssuer.toLowerCase();
      changedFields.push("issuing_organization");
    }

    if (payload.category !== undefined) {
      if (!CERTIFICATION_CATEGORIES.includes(payload.category)) {
        throw new BadRequestError("Invalid certification category");
      }
      existing.category = payload.category;
      changedFields.push("category");
    }

    if (payload.status !== undefined) {
      if (!Object.values(CERTIFICATION_STATUS).includes(payload.status)) {
        throw new BadRequestError("Invalid certification status");
      }
      existing.status = payload.status;
      changedFields.push("status");
    }

    if (payload.visibility !== undefined) {
      if (!Object.values(CERTIFICATION_VISIBILITY).includes(payload.visibility)) {
        throw new BadRequestError("Invalid certification visibility");
      }
      existing.visibility = payload.visibility;
      changedFields.push("visibility");
    }

    if (payload.credential_id !== undefined) {
      const nextCredId = sanitizePlainText(payload.credential_id).slice(0, 120);
      existing.credential_id = nextCredId;
      existing.normalized_credential_id = nextCredId.toLowerCase();
      changedFields.push("credential_id");
    }

    if (payload.credential_url !== undefined) {
      existing.credential_url = validateAndNormalizeCredentialUrl(payload.credential_url);
      changedFields.push("credential_url");
    }

    if (payload.description !== undefined) {
      existing.description = sanitizePlainText(payload.description).slice(0, 1000);
      changedFields.push("description");
    }

    const nextDoesNotExpire =
      payload.does_not_expire !== undefined
        ? Boolean(payload.does_not_expire)
        : Boolean(existing.does_not_expire);
    const nextIssueRaw =
      payload.issue_date !== undefined ? payload.issue_date : existing.issue_date;
    const nextExpiryRaw = nextDoesNotExpire
      ? null
      : payload.expiry_date !== undefined
        ? payload.expiry_date
        : existing.expiry_date;

    const { issue_date, expiry_date } = validateCertificationDates(
      nextIssueRaw,
      nextExpiryRaw,
      nextDoesNotExpire,
    );
    existing.does_not_expire = nextDoesNotExpire;
    existing.issue_date = issue_date;
    existing.expiry_date = expiry_date;

    if (
      payload.issue_date !== undefined ||
      payload.expiry_date !== undefined ||
      payload.does_not_expire !== undefined
    ) {
      changedFields.push("dates");
    }

    await ensureNoDuplicate(
      student._id,
      {
        normalizedTitle: existing.normalized_title,
        normalizedIssuer: existing.normalized_issuer,
        normalizedCredentialId: existing.normalized_credential_id || "",
        issueDate: existing.issue_date,
      },
      existing._id,
    );

    await existing.save();

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_certification",
        targetId: existing._id,
        action: "UPDATE_CERTIFICATION",
        changedFields,
        previousValues: previousSnapshot,
        newValues: {
          title: existing.title,
          issuing_organization: existing.issuing_organization,
          status: existing.status,
          visibility: existing.visibility,
        },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const isSelfMode = String(scopedActor.userId) === String(student._id) && scopedActor.role === "Student";
    return {
      msg: "Certification updated",
      certification: formatCertificationResponse(existing, isSelfMode),
    };
  };

  const deleteCertification = async (actor, targetStudentId, certId, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(certId, "certification ID");

    const existing = await Certification.findOne({
      _id: certId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Certification not found");
    }

    existing.is_deleted = true;
    existing.deleted_at = new Date();
    existing.deleted_by_id = scopedActor.userId;
    existing.deleted_by_role = scopedActor.role;
    await existing.save();

    if (existing.certificate_file?.filename) {
      removeFile(existing.certificate_file.filename);
    }

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_certification",
        targetId: existing._id,
        action: "DELETE_CERTIFICATION",
        changedFields: ["is_deleted"],
        previousValues: { title: existing.title, issuing_organization: existing.issuing_organization },
        newValues: { is_deleted: true },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return { msg: "Certification removed" };
  };

  const reorderCertifications = async (actor, targetStudentId, orders = [], reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");

    if (!Array.isArray(orders) || orders.length === 0) {
      throw new BadRequestError("orders must be a non-empty array");
    }

    const activeCerts = await Certification.find({
      student_id: student._id,
      is_deleted: false,
    });
    const ownedIds = new Set(activeCerts.map((c) => String(c._id)));

    for (const item of orders) {
      assertValidId(item?.certification_id, "certification ID");
      if (!ownedIds.has(String(item.certification_id))) {
        throw new BadRequestError("All certification_id values must belong to the student");
      }
      if (!Number.isInteger(Number(item.display_order)) || Number(item.display_order) < 0) {
        throw new BadRequestError("display_order must be a non-negative integer");
      }
    }

    await Promise.all(
      orders.map((item) =>
        Certification.findByIdAndUpdate(
          item.certification_id,
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
        targetModel: "tbl_certification",
        targetId: student._id,
        action: "REORDER_CERTIFICATIONS",
        changedFields: ["display_order"],
        previousValues: {},
        newValues: { count: orders.length },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return listStudentCertifications(actor, student._id);
  };

  const attachCertificateFile = async (actor, targetStudentId, certId, file, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(certId, "certification ID");

    if (!file || !file.filename) {
      throw new BadRequestError("Certificate file is required");
    }

    const existing = await Certification.findOne({
      _id: certId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      removeFile(file.filename);
      throw new NotFoundError("Certification not found");
    }

    const previousFilename = existing.certificate_file?.filename || null;
    existing.certificate_file = {
      filename: file.filename,
      original_name: sanitizePlainText(file.originalname || file.filename).slice(0, 200) || "certificate",
      mime_type: file.mimetype || "application/pdf",
      size_bytes: Number(file.size) || 1,
      uploaded_at: new Date(),
    };
    await existing.save();

    if (previousFilename && previousFilename !== file.filename) {
      removeFile(previousFilename);
    }

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_certification",
        targetId: existing._id,
        action: "UPLOAD_CERTIFICATION_FILE",
        changedFields: ["certificate_file"],
        previousValues: { had_file: Boolean(previousFilename) },
        newValues: {
          original_name: existing.certificate_file.original_name,
          mime_type: existing.certificate_file.mime_type,
        },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const isSelfMode = String(scopedActor.userId) === String(student._id) && scopedActor.role === "Student";
    return {
      msg: "Certificate file attached",
      certification: formatCertificationResponse(existing, isSelfMode),
    };
  };

  const getCertificateAttachment = async (actor, targetStudentId, certId) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "read");
    assertValidId(certId, "certification ID");

    const existing = await Certification.findOne({
      _id: certId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Certification not found");
    }
    if (!assertVisibleToActor(scopedActor, student._id, existing)) {
      throw new UnauthorizedError("This certification is private");
    }
    if (!existing.certificate_file?.filename) {
      throw new NotFoundError("No certificate document attached to this certification");
    }

    const filePath = resolveFilePath(existing.certificate_file.filename);
    if (!filePath) {
      throw new NotFoundError("Certificate file path is invalid or unavailable");
    }

    return {
      filePath,
      mimeType: existing.certificate_file.mime_type || "application/octet-stream",
      originalName: existing.certificate_file.original_name || "certificate",
    };
  };

  const removeCertificateAttachment = async (actor, targetStudentId, certId, reqMeta = {}) => {
    const scopedActor = await accessService.resolveActorScope(actor);
    const student = await loadTargetStudent(targetStudentId);
    accessService.assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(certId, "certification ID");

    const existing = await Certification.findOne({
      _id: certId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Certification not found");
    }
    if (!existing.certificate_file?.filename) {
      throw new NotFoundError("No certificate document attached to this certification");
    }

    const oldFile = existing.certificate_file.filename;
    existing.certificate_file = null;
    await existing.save();
    removeFile(oldFile);

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_certification",
        targetId: existing._id,
        action: "DELETE_CERTIFICATION_FILE",
        changedFields: ["certificate_file"],
        previousValues: { had_file: true },
        newValues: { had_file: false },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const isSelfMode = String(scopedActor.userId) === String(student._id) && scopedActor.role === "Student";
    return {
      msg: "Certificate document removed",
      certification: formatCertificationResponse(existing, isSelfMode),
    };
  };

  return {
    getMetadata,
    listStudentCertifications,
    getCertificationById,
    createCertification,
    updateCertification,
    deleteCertification,
    reorderCertifications,
    attachCertificateFile,
    getCertificateAttachment,
    removeCertificateAttachment,
  };
};

export const certificationService = createCertificationService();
