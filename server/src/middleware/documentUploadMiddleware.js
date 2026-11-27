import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { BadRequestError } from "../errors/customErrors.js";
import { MAX_DOCUMENT_FILE_BYTES } from "../utils/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Private storage root outside public /uploads so documents always require application authorization
export const DOCUMENT_STORAGE_DIR = path.resolve(
  __dirname,
  "../../private_uploads/documents",
);

const ALLOWED_RESUME_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const ALLOWED_DOCUMENT_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]);

const ALLOWED_RESUME_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_DOCUMENT_MIMES = new Set([
  ...ALLOWED_RESUME_MIMES,
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

const ensureDocumentStorageDir = () => {
  if (!fs.existsSync(DOCUMENT_STORAGE_DIR)) {
    fs.mkdirSync(DOCUMENT_STORAGE_DIR, { recursive: true });
  }
};

export const sanitizeOriginalFilename = (rawName = "") => {
  const base = path.basename(String(rawName || "document")).normalize("NFKC");
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return safe.slice(0, 180) || "document";
};

export const hasPathTraversal = (rawName = "") => {
  const s = String(rawName || "");
  return (
    s.includes("..") ||
    s.includes("/") ||
    s.includes("\\") ||
    s.includes("\0") ||
    /^[a-zA-Z]:/.test(s)
  );
};

export const hasValidDocumentMagicBytes = (filePath, ext) => {
  const fd = fs.openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, buf, 0, 16, 0);
    if (bytesRead < 4) return false;

    if (ext === ".pdf") {
      return buf.subarray(0, 5).toString("ascii") === "%PDF-";
    }
    if (ext === ".docx") {
      // OOXML ZIP header PK\x03\x04
      return buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
    }
    if (ext === ".doc") {
      // OLE2 Compound Binary Format D0 CF 11 E0 A1 B1 1A E1
      return (
        bytesRead >= 8 &&
        buf[0] === 0xd0 &&
        buf[1] === 0xcf &&
        buf[2] === 0x11 &&
        buf[3] === 0xe0
      );
    }
    if (ext === ".jpg" || ext === ".jpeg") {
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    }
    if (ext === ".png") {
      return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    }
    return false;
  } finally {
    fs.closeSync(fd);
  }
};

export const computeFileSha256 = (filePath) => {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureDocumentStorageDir();
    cb(null, DOCUMENT_STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const randomKey = crypto.randomBytes(16).toString("hex");
    cb(null, `doc-${Date.now()}-${randomKey}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const rawName = String(file.originalname || "");
  if (hasPathTraversal(rawName)) {
    return cb(new BadRequestError("Invalid filename: path traversal detected"), false);
  }

  const ext = path.extname(rawName).toLowerCase();
  const docType = String(req.body?.document_type || "RESUME").toUpperCase();
  const allowedExts = docType === "RESUME" ? ALLOWED_RESUME_EXTENSIONS : ALLOWED_DOCUMENT_EXTENSIONS;
  const allowedMimes = docType === "RESUME" ? ALLOWED_RESUME_MIMES : ALLOWED_DOCUMENT_MIMES;

  if (!allowedExts.has(ext)) {
    return cb(
      new BadRequestError(
        `Unsupported file extension '${ext}'. Allowed: ${[...allowedExts].join(", ")}`,
      ),
      false,
    );
  }

  const mime = String(file.mimetype || "").toLowerCase();
  if (!allowedMimes.has(mime)) {
    return cb(new BadRequestError(`Unsupported MIME type: ${file.mimetype}`), false);
  }

  cb(null, true);
};

export const uploadDocumentMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_FILE_BYTES,
    files: 1,
    fieldSize: 512 * 1024,
  },
}).single("document");

export const validateUploadedDocument = (req, _res, next) => {
  if (!req.file) {
    return next();
  }
  try {
    if (!fs.existsSync(req.file.path)) {
      throw new BadRequestError("Uploaded document could not be persisted");
    }
    const ext = path.extname(req.file.filename || req.file.originalname || "").toLowerCase();
    if (!hasValidDocumentMagicBytes(req.file.path, ext)) {
      fs.unlinkSync(req.file.path);
      throw new BadRequestError(
        "File content validation failed: signature does not match declared file format",
      );
    }
    req.file.checksum = computeFileSha256(req.file.path);
    req.file.sanitizedOriginalName = sanitizeOriginalFilename(req.file.originalname);
    return next();
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // ignore cleanup error
      }
    }
    return next(err);
  }
};

export const resolveDocumentStoragePath = (storageKey) => {
  if (!storageKey || typeof storageKey !== "string") return null;
  const base = path.basename(storageKey);
  if (base !== storageKey || hasPathTraversal(storageKey)) return null;
  const resolved = path.resolve(DOCUMENT_STORAGE_DIR, base);
  if (!resolved.startsWith(path.resolve(DOCUMENT_STORAGE_DIR))) return null;
  return resolved;
};

export const deleteStoredDocumentFile = (storageKey) => {
  const fullPath = resolveDocumentStoragePath(storageKey);
  if (fullPath && fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      return true;
    } catch {
      return false;
    }
  }
  return false;
};
