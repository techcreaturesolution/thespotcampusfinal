export const PROJECT_STATUS_OPTIONS = [
  "Planned",
  "In Progress",
  "Completed",
  "Archived",
];

export const PROJECT_VISIBILITY_OPTIONS = [
  "Public",
  "College Only",
  "Private",
];

export const PROJECT_LINK_TYPES = [
  {
    code: "GITHUB_REPOSITORY",
    label: "GitHub Repository",
    singlePerProject: true,
    allowedHosts: ["github.com", "www.github.com"],
  },
  {
    code: "GITLAB_REPOSITORY",
    label: "GitLab Repository",
    singlePerProject: false,
    allowedHosts: ["gitlab.com", "www.gitlab.com"],
  },
  {
    code: "BITBUCKET_REPOSITORY",
    label: "Bitbucket Repository",
    singlePerProject: false,
    allowedHosts: ["bitbucket.org", "www.bitbucket.org"],
  },
  {
    code: "LIVE_DEMO",
    label: "Live Demo",
    singlePerProject: false,
    allowedHosts: null,
  },
  {
    code: "PROJECT_WEBSITE",
    label: "Project Website",
    singlePerProject: false,
    allowedHosts: null,
  },
  {
    code: "DOCUMENTATION",
    label: "Documentation",
    singlePerProject: false,
    allowedHosts: null,
  },
];

export const normalizeUrlForDuplicateCheck = (linkType, rawUrl) => {
  try {
    const parsed = new URL(String(rawUrl).trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    let pathname = parsed.pathname.replace(/\/+$/, "");
    if (["GITHUB_REPOSITORY", "GITLAB_REPOSITORY", "BITBUCKET_REPOSITORY"].includes(linkType)) {
      pathname = pathname.toLowerCase();
    }
    return `${parsed.protocol.toLowerCase()}//${host}${pathname}${parsed.search}`;
  } catch {
    return String(rawUrl || "").trim().toLowerCase();
  }
};

export const validateProjectLinkInput = ({ link_type, url, label = "" }, existingLinks = [], editingIndex = -1) => {
  const errors = {};
  const meta = PROJECT_LINK_TYPES.find((t) => t.code === link_type);
  if (!meta) {
    errors.link_type = "Please select a valid link type";
    return errors;
  }

  const trimmed = String(url || "").trim();
  if (!trimmed || !isSafeHttpUrl(trimmed)) {
    errors.url = "Enter a valid http:// or https:// URL";
    return errors;
  }
  if (trimmed.length > 500) {
    errors.url = "URL must not exceed 500 characters";
    return errors;
  }

  const parsed = new URL(trimmed);
  const host = parsed.hostname.toLowerCase();

  if (meta.allowedHosts) {
    if (parsed.protocol !== "https:") {
      errors.url = `${meta.label} must use https://`;
      return errors;
    }
    if (!meta.allowedHosts.includes(host)) {
      errors.url = `${meta.label} host must be ${meta.allowedHosts[0]}`;
      return errors;
    }
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      errors.url = `Enter a repository path like https://${meta.allowedHosts[0]}/owner/repo`;
      return errors;
    }
  }

  if (String(label || "").trim().length > 80) {
    errors.label = "Label must not exceed 80 characters";
  }

  const norm = normalizeUrlForDuplicateCheck(link_type, trimmed);
  const otherLinks = existingLinks.filter((_, idx) => idx !== editingIndex);

  if (otherLinks.some((l) => normalizeUrlForDuplicateCheck(l.link_type, l.url) === norm)) {
    errors.url = "This URL is already added to the project";
  } else if (
    meta.singlePerProject &&
    otherLinks.some((l) => l.link_type === "GITHUB_REPOSITORY")
  ) {
    errors.link_type = "Only one canonical GitHub Repository link is allowed per project";
  }

  return errors;
};

export const isSafeHttpUrl = (raw) => {
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
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.includes(".");
  } catch {
    return false;
  }
};

export const validateProjectForm = (form) => {
  const errors = {};
  const title = String(form.title || "").trim();
  const description = String(form.description || "").trim();

  if (title.length < 2 || title.length > 120) {
    errors.title = "Project title must be between 2 and 120 characters";
  }

  if (description.length < 10 || description.length > 2000) {
    errors.description = "Project description must be between 10 and 2000 characters";
  }

  if (form.role && String(form.role).trim().length > 80) {
    errors.role = "Project role must not exceed 80 characters";
  }

  if (form.status && !PROJECT_STATUS_OPTIONS.includes(form.status)) {
    errors.status = "Invalid project status";
  }

  if (form.visibility && !PROJECT_VISIBILITY_OPTIONS.includes(form.visibility)) {
    errors.visibility = "Invalid project visibility";
  }

  if (form.team_size !== "" && form.team_size !== null && form.team_size !== undefined) {
    const size = Number(form.team_size);
    if (!Number.isInteger(size) || size < 1 || size > 100) {
      errors.team_size = "Team size must be between 1 and 100";
    }
  }

  if (!form.is_ongoing && form.start_date && form.end_date) {
    const s = new Date(form.start_date);
    const e = new Date(form.end_date);
    if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && e < s) {
      errors.end_date = "End date cannot be earlier than start date";
    }
  }

  for (const field of ["project_url", "repository_url", "live_demo_url"]) {
    const val = String(form[field] || "").trim();
    if (val && !isSafeHttpUrl(val)) {
      errors[field] = "Must be a valid http:// or https:// URL";
    }
  }

  return errors;
};
