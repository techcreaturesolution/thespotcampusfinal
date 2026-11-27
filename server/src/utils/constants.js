export const JOB_TYPE = {
  FULL_TIME: "Full-Time",
  PART_TIME: "Part-Time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
};

export const WORK_MODE = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  PHYSICAL: "Physical",
};

export const STATUS = {
  ACTIVE: "1",
  DEACTIVE: "0",
};

export const SORT_BY = {
  NEWEST_FIRST: "newest",
  OLDEST_FIRST: "oldest",
  ASCENDING: "a-z",
  DESCENDING: "z-a",
};

export const USER = {
  Student: "Student",
  University: "University",
  College: "College",
  TPO: "TPO",
  Company: "Company",
  Admin: "Admin",
};

export const EXAM_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
};

export const PROCTORING_VIOLATION = {
  TAB_SWITCH: "tab_switch",
  FACE_NOT_DETECTED: "face_not_detected",
  MULTIPLE_FACES: "multiple_faces",
  BROWSER_RESIZE: "browser_resize",
  COPY_PASTE: "copy_paste",
  RIGHT_CLICK: "right_click",
  SCREENSHOT_ATTEMPT: "screenshot_attempt",
  DEVTOOLS_OPEN: "devtools_open",
};

export const DIFFICULTY_LEVEL = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
};

export const ROUND_TYPE = {
  MCQ: "mcq",
  TECHNICAL_INTERVIEW: "technical_interview",
  HR_INTERVIEW: "hr_interview",
  CODING_TEST: "coding_test",
  GROUP_DISCUSSION: "group_discussion",
  APTITUDE_TEST: "aptitude_test",
  VIDEO_INTERVIEW: "video_interview",
  ASSIGNMENT: "assignment",
  CUSTOM: "custom",
};

export const ROUND_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const CANDIDATE_ROUND_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  PASSED: "passed",
  FAILED: "failed",
  ABSENT: "absent",
  ON_HOLD: "on_hold",
};

export const INTERVIEW_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
};

export const ACADEMIC_STATUS = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  DETAINED: "Detained",
  DROPPED: "Dropped",
};

export const ACADEMIC_HISTORY_STAGE = {
  TENTH: "10th",
  TWELFTH: "12th",
  DIPLOMA: "Diploma",
  UNDERGRADUATE: "Undergraduate",
  POSTGRADUATE: "Postgraduate",
  PREVIOUS_ENROLLMENT: "Previous Enrollment",
  OTHER: "Other",
};

export const ACADEMIC_HISTORY_STATUS = {
  COMPLETED: "Completed",
  TRANSFERRED: "Transferred",
  PURSUING: "Pursuing",
  DISCONTINUED: "Discontinued",
};

export const SCORE_TYPE = {
  CGPA: "CGPA",
  PERCENTAGE: "Percentage",
  GRADE: "Grade",
};

export const SKILL_CATEGORIES = [
  "Programming Languages",
  "Frameworks",
  "Libraries",
  "Databases",
  "Cloud",
  "DevOps",
  "Mobile",
  "Web",
  "AI/ML",
  "Data",
  "Security",
  "Testing",
  "Tools",
  "Other",
];

export const SKILL_PROFICIENCY = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};

export const SKILL_PROFICIENCY_ORDER = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

export const SKILL_PROFICIENCY_LEVELS = [
  {
    code: "BEGINNER",
    name: "Beginner",
    order: 1,
    description: "Foundational understanding and guided usage",
    is_active: true,
  },
  {
    code: "INTERMEDIATE",
    name: "Intermediate",
    order: 2,
    description: "Independent practical application in projects",
    is_active: true,
  },
  {
    code: "ADVANCED",
    name: "Advanced",
    order: 3,
    description: "Deep proficiency and complex problem solving",
    is_active: true,
  },
  {
    code: "EXPERT",
    name: "Expert",
    order: 4,
    description: "Mastery, architecture design, and mentoring",
    is_active: true,
  },
];

export const PROJECT_STATUS = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const PROJECT_VISIBILITY = {
  PUBLIC: "Public",
  COLLEGE_ONLY: "College Only",
  PRIVATE: "Private",
};

export const PROJECT_LINK_TYPES = {
  GITHUB_REPOSITORY: "GITHUB_REPOSITORY",
  GITLAB_REPOSITORY: "GITLAB_REPOSITORY",
  BITBUCKET_REPOSITORY: "BITBUCKET_REPOSITORY",
  LIVE_DEMO: "LIVE_DEMO",
  PROJECT_WEBSITE: "PROJECT_WEBSITE",
  DOCUMENTATION: "DOCUMENTATION",
};

export const PROJECT_LINK_TYPE_META = [
  {
    code: "GITHUB_REPOSITORY",
    label: "GitHub Repository",
    single_per_project: true,
    allowed_hosts: ["github.com", "www.github.com"],
  },
  {
    code: "GITLAB_REPOSITORY",
    label: "GitLab Repository",
    single_per_project: false,
    allowed_hosts: ["gitlab.com", "www.gitlab.com"],
  },
  {
    code: "BITBUCKET_REPOSITORY",
    label: "Bitbucket Repository",
    single_per_project: false,
    allowed_hosts: ["bitbucket.org", "www.bitbucket.org"],
  },
  {
    code: "LIVE_DEMO",
    label: "Live Demo",
    single_per_project: false,
    allowed_hosts: null,
  },
  {
    code: "PROJECT_WEBSITE",
    label: "Project Website",
    single_per_project: false,
    allowed_hosts: null,
  },
  {
    code: "DOCUMENTATION",
    label: "Documentation",
    single_per_project: false,
    allowed_hosts: null,
  },
];

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

export const CERTIFICATION_STATUS = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export const CERTIFICATION_VISIBILITY = {
  PUBLIC: "Public",
  INSTITUTE_ONLY: "Institute Only",
  PRIVATE: "Private",
};

export const INTERNSHIP_STATUS = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export const INTERNSHIP_VISIBILITY = {
  PUBLIC: "Public",
  INSTITUTE_ONLY: "Institute Only",
  PRIVATE: "Private",
};

export const INTERNSHIP_LINK_TYPES = {
  COMPANY_WEBSITE: "COMPANY_WEBSITE",
  VERIFICATION_PAGE: "VERIFICATION_PAGE",
  OFFER_OR_COMPLETION: "OFFER_OR_COMPLETION",
  WORK_SAMPLE: "WORK_SAMPLE",
  OTHER: "OTHER",
};

export const RESUME_VERSION_STATUS = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export const RESUME_VERSION_VISIBILITY = {
  PUBLIC: "Public",
  INSTITUTE_ONLY: "Institute Only",
  PRIVATE: "Private",
  SHARED: "Shared",
};

export const RESUME_SECTION_KEYS = [
  "summary",
  "skills",
  "projects",
  "internships",
  "certifications",
  "education",
];

export const RESUME_FONT_FAMILIES = [
  "Inter",
  "Outfit",
  "Playfair Display",
  "Roboto",
];

export const RESUME_LAYOUT_COLUMNS = [
  "two_column_left",
  "two_column_right",
  "single_column",
];

export const RESUME_PAGE_MARGINS = ["small", "medium", "large"];

export const MAX_RESUME_VERSIONS_PER_STUDENT = 20;

export const DOCUMENT_TYPES = {
  RESUME: "RESUME",
  CERTIFICATE: "CERTIFICATE",
  ACADEMIC_DOCUMENT: "ACADEMIC_DOCUMENT",
  OTHER: "OTHER",
};

export const DOCUMENT_STATUS = {
  AVAILABLE: "Available",
  ARCHIVED: "Archived",
  REJECTED: "Rejected",
};

export const DOCUMENT_VISIBILITY = {
  PRIVATE: "Private",
  INSTITUTE_ONLY: "Institute Only",
  PUBLIC: "Public",
};

export const PROFILE_VISIBILITY = {
  PRIVATE: "Private",
  INSTITUTE_ONLY: "Institute Only",
  PUBLIC: "Public",
};

export const PROFILE_LIFECYCLE_STATES = {
  DRAFT: "DRAFT",
  INVALID: "INVALID",
  VALID: "VALID",
  PUBLISHED: "PUBLISHED",
  SUSPENDED: "SUSPENDED",
};

export const PROFILE_VISIBILITY_OVERRIDE = {
  NONE: "NONE",
  RESTRICTED_PRIVATE: "RESTRICTED_PRIVATE",
  SUSPENDED: "SUSPENDED",
};

export const VALIDATION_SEVERITY = {
  ERROR: "ERROR",
  WARNING: "WARNING",
};

export const PROFILE_VALIDATION_CODES = {
  REQUIRED_FIELD: "REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_DATE_RANGE: "INVALID_DATE_RANGE",
  INVALID_REFERENCE: "INVALID_REFERENCE",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  UNSUPPORTED_STATE: "UNSUPPORTED_STATE",
  INVALID_URL: "INVALID_URL",
  NOT_PUBLISHABLE: "NOT_PUBLISHABLE",
  ACCOUNT_RESTRICTED: "ACCOUNT_RESTRICTED",
  MISSING_RECOMMENDATION: "MISSING_RECOMMENDATION",
  EXPIRED_CREDENTIAL: "EXPIRED_CREDENTIAL",
};

export const MAX_DOCUMENT_FILE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENTS_PER_USER = 25;
export const MAX_TOTAL_STORAGE_BYTES_PER_USER = 50 * 1024 * 1024; // 50MB

export const DEFAULT_CANONICAL_SKILLS = [
  { name: "JavaScript", category: "Programming Languages" },
  { name: "TypeScript", category: "Programming Languages" },
  { name: "Python", category: "Programming Languages" },
  { name: "Java", category: "Programming Languages" },
  { name: "C", category: "Programming Languages" },
  { name: "C++", category: "Programming Languages" },
  { name: "C#", category: "Programming Languages" },
  { name: "Go", category: "Programming Languages" },
  { name: "Dart", category: "Programming Languages" },
  { name: "SQL", category: "Databases" },
  { name: "HTML/CSS", category: "Web" },
  { name: "Tailwind CSS", category: "Web" },
  { name: "React", category: "Frameworks" },
  { name: "Next.js", category: "Frameworks" },
  { name: "Angular", category: "Frameworks" },
  { name: "Vue.js", category: "Frameworks" },
  { name: "Node.js", category: "Frameworks" },
  { name: "Express.js", category: "Frameworks" },
  { name: "Django", category: "Frameworks" },
  { name: "Spring Boot", category: "Frameworks" },
  { name: "Flutter", category: "Mobile" },
  { name: "React Native", category: "Mobile" },
  { name: "Android", category: "Mobile" },
  { name: "iOS", category: "Mobile" },
  { name: "Redux", category: "Libraries" },
  { name: "NumPy", category: "Libraries" },
  { name: "Pandas", category: "Libraries" },
  { name: "MongoDB", category: "Databases" },
  { name: "PostgreSQL", category: "Databases" },
  { name: "MySQL", category: "Databases" },
  { name: "Redis", category: "Databases" },
  { name: "Firebase", category: "Cloud" },
  { name: "AWS", category: "Cloud" },
  { name: "Azure", category: "Cloud" },
  { name: "Google Cloud", category: "Cloud" },
  { name: "Docker", category: "DevOps" },
  { name: "Kubernetes", category: "DevOps" },
  { name: "CI/CD", category: "DevOps" },
  { name: "Machine Learning", category: "AI/ML" },
  { name: "Deep Learning", category: "AI/ML" },
  { name: "TensorFlow", category: "AI/ML" },
  { name: "PyTorch", category: "AI/ML" },
  { name: "Data Analysis", category: "Data" },
  { name: "Power BI", category: "Data" },
  { name: "Cybersecurity", category: "Security" },
  { name: "OAuth / JWT", category: "Security" },
  { name: "Jest", category: "Testing" },
  { name: "Cypress", category: "Testing" },
  { name: "Git", category: "Tools" },
  { name: "REST APIs", category: "Web" },
  { name: "GraphQL", category: "Web" },
  { name: "Figma", category: "Tools" },
];
