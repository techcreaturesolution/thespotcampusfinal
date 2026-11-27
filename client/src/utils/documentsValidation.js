export const DOCUMENT_TYPE_OPTIONS = [
  { code: "RESUME", label: "Uploaded Resume" },
  { code: "CERTIFICATE", label: "Certificate Document" },
  { code: "ACADEMIC_DOCUMENT", label: "Academic Document" },
  { code: "OTHER", label: "Other Profile Document" },
];

export const DOCUMENT_STATUS_OPTIONS = ["Available", "Archived"];

export const DOCUMENT_VISIBILITY_OPTIONS = [
  "Private",
  "Institute Only",
  "Public",
];

export const MAX_DOCUMENT_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const RESUME_ALLOWED_EXTS = [".pdf", ".doc", ".docx"];
const GENERAL_ALLOWED_EXTS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];

const RESUME_ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const GENERAL_ALLOWED_MIMES = [
  ...RESUME_ALLOWED_MIMES,
  "image/jpeg",
  "image/jpg",
  "image/png",
];

export const validateDocumentFileSelection = (file, documentType = "RESUME") => {
  if (!file) return "Please select a document file";

  const name = String(file.name || "");
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return "Invalid filename";
  }

  const lower = name.toLowerCase();
  const ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
  const isResume = String(documentType).toUpperCase() === "RESUME";
  const allowedExts = isResume ? RESUME_ALLOWED_EXTS : GENERAL_ALLOWED_EXTS;
  const allowedMimes = isResume ? RESUME_ALLOWED_MIMES : GENERAL_ALLOWED_MIMES;

  if (!allowedExts.includes(ext)) {
    return isResume
      ? "Resume uploads must be PDF, DOC, or DOCX"
      : "Allowed file formats: PDF, DOC, DOCX, JPG, JPEG, PNG";
  }

  if (file.type && !allowedMimes.includes(String(file.type).toLowerCase())) {
    return `Unsupported file MIME type: ${file.type}`;
  }

  if (Number(file.size) <= 0) {
    return "Selected file is empty";
  }

  if (Number(file.size) > MAX_DOCUMENT_FILE_BYTES) {
    return "File size must not exceed 10 MB";
  }

  return "";
};

export const formatFileSize = (bytes) => {
  const num = Number(bytes) || 0;
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
};
