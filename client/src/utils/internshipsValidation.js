import { isSafeHttpUrl } from "./projectsValidation.js";

export const EMPLOYMENT_TYPE_OPTIONS = [
  "Internship",
  "Part-Time",
  "Full-Time",
  "Contract",
];

export const WORK_MODE_OPTIONS = ["Remote", "Hybrid", "Physical"];

export const INTERNSHIP_STATUS_OPTIONS = ["Active", "Archived"];

export const INTERNSHIP_VISIBILITY_OPTIONS = [
  "Public",
  "Institute Only",
  "Private",
];

export const INTERNSHIP_LINK_TYPES = [
  { code: "COMPANY_WEBSITE", label: "Company Website" },
  { code: "VERIFICATION_PAGE", label: "Verification Page" },
  { code: "OFFER_OR_COMPLETION", label: "Offer / Completion Letter" },
  { code: "WORK_SAMPLE", label: "Work Sample" },
  { code: "OTHER", label: "Other Link" },
];

export { isSafeHttpUrl };

export const validateInternshipLinkInput = (
  { link_type = "OTHER", url, label = "" },
  existingLinks = [],
  editingIndex = -1,
) => {
  const errors = {};
  if (!INTERNSHIP_LINK_TYPES.some((t) => t.code === link_type)) {
    errors.link_type = "Select a valid link type";
    return errors;
  }
  const trimmed = String(url || "").trim();
  if (!trimmed || !isSafeHttpUrl(trimmed) || trimmed.length > 500) {
    errors.url = "Enter a valid http:// or https:// URL";
    return errors;
  }
  if (String(label || "").trim().length > 80) {
    errors.label = "Label must not exceed 80 characters";
  }
  const norm = trimmed.toLowerCase().replace(/\/+$/, "");
  const others = existingLinks.filter((_, idx) => idx !== editingIndex);
  if (others.some((l) => String(l.url || "").trim().toLowerCase().replace(/\/+$/, "") === norm)) {
    errors.url = "This URL is already added to this internship";
  }
  return errors;
};

export const validateInternshipForm = (form) => {
  const errors = {};
  const roleTitle = String(form.role_title || "").trim();
  const orgName = String(form.organization_name || "").trim();
  const website = String(form.company_website || "").trim();

  if (roleTitle.length < 2 || roleTitle.length > 120) {
    errors.role_title = "Role / job title must be between 2 and 120 characters";
  }

  if (orgName.length < 2 || orgName.length > 120) {
    errors.organization_name = "Company / organization name must be between 2 and 120 characters";
  }

  if (form.employment_type && !EMPLOYMENT_TYPE_OPTIONS.includes(form.employment_type)) {
    errors.employment_type = "Select a valid employment type";
  }

  if (form.work_mode && !WORK_MODE_OPTIONS.includes(form.work_mode)) {
    errors.work_mode = "Select a valid work mode";
  }

  if (form.location && String(form.location).trim().length > 120) {
    errors.location = "Location must not exceed 120 characters";
  }

  if (!form.start_date) {
    errors.start_date = "Start date is required";
  } else {
    const startD = new Date(form.start_date);
    if (Number.isNaN(startD.getTime())) {
      errors.start_date = "Enter a valid start date";
    } else if (!form.currently_working) {
      if (!form.end_date) {
        errors.end_date = "End date is required unless currently working";
      } else {
        const endD = new Date(form.end_date);
        if (Number.isNaN(endD.getTime())) {
          errors.end_date = "Enter a valid end date";
        } else if (endD < startD) {
          errors.end_date = "End date cannot be earlier than start date";
        }
      }
    }
  }

  if (website && !isSafeHttpUrl(website)) {
    errors.company_website = "Company website must be a valid http:// or https:// URL";
  }

  if (form.description && String(form.description).trim().length > 2000) {
    errors.description = "Description must not exceed 2000 characters";
  }
  if (form.responsibilities && String(form.responsibilities).trim().length > 2000) {
    errors.responsibilities = "Responsibilities must not exceed 2000 characters";
  }
  if (form.achievements && String(form.achievements).trim().length > 1500) {
    errors.achievements = "Achievements must not exceed 1500 characters";
  }

  return errors;
};
