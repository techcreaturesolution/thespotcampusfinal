import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { BadRequestError } from "../errors/customErrors.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep certificates outside the public /uploads static directory so downloads always require authorization
export const CERTIFICATE_STORAGE_DIR = path.resolve(
  __dirname,
  "../../private_uploads/certificates",
);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const ALLOWED_MIMES = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png"]);
export const MAX_CERTIFICATE_FILE_BYTES = 5 * 1024 * 1024; // 5MB

const ensureStorageDir = () => {
  if (!fs.existsSync(CERTIFICATE_STORAGE_DIR)) {
    fs.mkdirSync(CERTIFICATE_STORAGE_DIR, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureStorageDir();
    cb(null, CERTIFICATE_STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const randomId = crypto.randomBytes(12).toString("hex");
    cb(null, `cert-${Date.now()}-${randomId}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const rawName = String(file.originalname || "");
  if (rawName.includes("..") || rawName.includes("/") || rawName.includes("\\")) {
    return cb(new BadRequestError("Invalid filename: path traversal detected"), false);
  }

  const ext = path.extname(rawName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new BadRequestError("Certificate file must be a PDF, JPG, JPEG, or PNG"),
      false,
    );
  }

  if (!ALLOWED_MIMES.has(String(file.mimetype || "").toLowerCase())) {
    return cb(
      new BadRequestError(`Unsupported certificate MIME type: ${file.mimetype}`),
      false,
    );
  }

  cb(null, true);
};

export const uploadCertificateMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_CERTIFICATE_FILE_BYTES,
    files: 1,
    fieldSize: 512 * 1024,
  },
}).single("certificate");

export const hasValidCertificateMagicBytes = (filePath, ext) => {
  const fd = fs.openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(8);
    const bytesRead = fs.readSync(fd, buf, 0, 8, 0);
    if (bytesRead < 4) return false;

    if (ext === ".pdf") {
      return buf.subarray(0, 5).toString("ascii") === "%PDF-";
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

export const validateUploadedCertificate = (req, _res, next) => {
  if (!req.file) {
    return next();
  }
  try {
    if (!fs.existsSync(req.file.path)) {
      throw new BadRequestError("Uploaded certificate file could not be stored");
    }
    const ext = path.extname(req.file.filename || req.file.originalname || "").toLowerCase();
    if (!hasValidCertificateMagicBytes(req.file.path, ext)) {
      fs.unlinkSync(req.file.path);
      throw new BadRequestError(
        "Invalid certificate file content: file signature does not match PDF/JPG/PNG",
      );
    }
    return next();
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // ignore cleanup failure
      }
    }
    return next(err);
  }
};

export const resolveCertificateFilePath = (filename) => {
  if (!filename || typeof filename !== "string") return null;
  const safeBase = path.basename(filename);
  if (safeBase !== filename || safeBase.includes("..")) return null;
  const fullPath = path.resolve(CERTIFICATE_STORAGE_DIR, safeBase);
  if (!fullPath.startsWith(path.resolve(CERTIFICATE_STORAGE_DIR))) return null;
  return fullPath;
};

export const removeStoredCertificateFile = (filename) => {
  const fullPath = resolveCertificateFilePath(filename);
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
