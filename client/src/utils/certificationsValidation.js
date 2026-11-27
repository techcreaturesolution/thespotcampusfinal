export const CERTIFICATION_CATEGORIES = [
  "Technical",
  "Cloud & DevOps",
  "Data & AI",
  "Security",
  "Academic",
  "Professional",
  "Language",
  "Competition",
  "Other",
];

export const CERTIFICATION_STATUS_OPTIONS = ["Active", "Archived"];

export const CERTIFICATION_VISIBILITY_OPTIONS = [
  "Public",
  "Institute Only",
  "Private",
];

export const MAX_CERTIFICATE_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_CERTIFICATE_EXTS = [".pdf", ".jpg", ".jpeg", ".png"];
const ALLOWED_CERTIFICATE_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

export const isSafeHttpsCredentialUrl = (raw) => {
  if (!raw || typeof raw !== "string") return false;
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return (
      parsed.protocol === "https:" &&
      Boolean(parsed.hostname) &&
      parsed.hostname.includes(".") &&
      trimmed.length <= 500
    );
  } catch {
    return false;
  }
};

export const validateCertificateFileSelection = (file) => {
  if (!file) return "";
  const name = String(file.name || "").toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  if (!ALLOWED_CERTIFICATE_EXTS.includes(ext)) {
    return "Certificate file must be PDF, JPG, JPEG, or PNG";
  }
  if (file.type && !ALLOWED_CERTIFICATE_MIMES.includes(String(file.type).toLowerCase())) {
    return "Unsupported certificate file MIME type";
  }
  if (Number(file.size) > MAX_CERTIFICATE_FILE_BYTES) {
    return "Certificate file size must not exceed 5 MB";
  }
  return "";
};

export const validateCertificationForm = (form) => {
  const errors = {};
  const title = String(form.title || "").trim();
  const issuer = String(form.issuing_organization || "").trim();
  const credentialId = String(form.credential_id || "").trim();
  const credentialUrl = String(form.credential_url || "").trim();
  const description = String(form.description || "").trim();

  if (title.length < 2 || title.length > 150) {
    errors.title = "Certification title must be between 2 and 150 characters";
  }

  if (issuer.length < 2 || issuer.length > 120) {
    errors.issuing_organization = "Issuing organization must be between 2 and 120 characters";
  }

  if (form.category && !CERTIFICATION_CATEGORIES.includes(form.category)) {
    errors.category = "Select a valid certification category";
  }

  if (credentialId.length > 120) {
    errors.credential_id = "Credential ID must not exceed 120 characters";
  }

  if (credentialUrl && !isSafeHttpsCredentialUrl(credentialUrl)) {
    errors.credential_url = "Credential URL must be a valid https:// URL";
  }

  if (!form.issue_date) {
    errors.issue_date = "Issue date is required";
  } else {
    const issueD = new Date(form.issue_date);
    if (Number.isNaN(issueD.getTime())) {
      errors.issue_date = "Enter a valid issue date";
    } else if (!form.does_not_expire && form.expiry_date) {
      const expiryD = new Date(form.expiry_date);
      if (Number.isNaN(expiryD.getTime())) {
        errors.expiry_date = "Enter a valid expiry date";
      } else if (expiryD < issueD) {
        errors.expiry_date = "Expiry date cannot be earlier than issue date";
      }
    }
  }

  if (description.length > 1000) {
    errors.description = "Description must not exceed 1000 characters";
  }

  if (form.status && !CERTIFICATION_STATUS_OPTIONS.includes(form.status)) {
    errors.status = "Invalid certification status";
  }

  if (form.visibility && !CERTIFICATION_VISIBILITY_OPTIONS.includes(form.visibility)) {
    errors.visibility = "Invalid certification visibility";
  }

  return errors;
};
