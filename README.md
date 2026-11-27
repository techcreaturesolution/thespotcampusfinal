# The Spot Campus Final - AI Powered Campus Placement Platform

A comprehensive AI-powered campus placement platform with advanced exam proctoring, Job Description-based exam generation, and a Flutter student mobile app.

## Key Features

### AI-Powered Exam Generation
- Generate MCQ exam papers automatically from Job Descriptions using OpenAI GPT-4o-mini
- Questions are tailored to skills, technologies, and requirements mentioned in the JD
- Configurable difficulty distribution (Easy/Medium/Hard)

### Advanced Exam Proctoring
- **Tab Lock**: Detects and records tab switching attempts
- **Camera Monitoring**: Periodic snapshots with face detection tracking
- **Full-Screen Mode**: Forces full-screen during exam
- **Copy/Paste Prevention**: Blocks clipboard operations
- **Right-Click Disabled**: Prevents context menu access
- **Screenshot Blocking**: Blocks PrintScreen and DevTools
- **Trust Score**: Real-time score (0-100) based on violations
- **Auto-Submit**: Automatically submits exam when max violations exceeded

### Multi-Role Access
- **Admin**: Full platform management
- **University**: Manage colleges, degrees, branches
- **College**: Handle student placements
- **TPO (Training & Placement Officer)**: Coordinate recruitment
- **Company**: Post jobs, create AI exams from JD, view proctoring results
- **Student**: Apply for jobs, take proctored exams

### Flutter Student Mobile App
- Native mobile experience for students
- Browse and apply for jobs
- Take proctored exams with app lifecycle monitoring
- Track application status
- View profile and results

## Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **OpenAI API** (GPT-4o-mini) for exam generation
- **Socket.IO** for real-time proctoring
- **JWT** authentication with HTTP-only cookies
- **Cloudinary** for file/image uploads
- **Razorpay** for payments

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for modern UI
- **React Router v6** for SPA routing
- **TanStack React Query** for data fetching
- **Recharts** for analytics
- **Socket.IO Client** for real-time features

### Mobile
- **Flutter 3** (Dart)
- **Provider** for state management
- **Camera** integration for proctoring
- **Material 3** design
- **Secure Storage** for tokens

## Project Structure

```
thespotcampusfinal/
├── backend/
│   ├── controllers/      # Business logic (14 controllers)
│   ├── models/            # Mongoose schemas (14 models)
│   ├── routes/            # Express routes (19 route files)
│   ├── middleware/        # Auth, validation, error handling, multer
│   ├── utils/             # AI generation, password hashing, JWT
│   ├── errors/            # Custom error classes
│   ├── server.js          # Main server with Socket.IO
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/         # React pages (20+ pages)
│   │   ├── utils/         # API client, helpers
│   │   ├── App.jsx        # Router configuration
│   │   └── index.css      # Tailwind CSS
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── flutter_student_app/
│   ├── lib/
│   │   ├── screens/       # Flutter screens (8 screens)
│   │   ├── services/      # API & Auth services
│   │   ├── utils/         # Constants
│   │   └── main.dart      # App entry point
│   └── pubspec.yaml
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB
- OpenAI API key
- Cloudinary account
- Razorpay account (for payments)
- Flutter SDK 3+ (for mobile app)

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Flutter App Setup
```bash
cd flutter_student_app
# Update baseUrl in lib/utils/constants.dart
flutter pub get
flutter run
```

### Environment Variables
```
PORT=5000
MONGO_URL=mongodb://localhost:27017/thespotcampus
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
NODE_ENV=development
CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_key
CLOUD_API_SECRET=your_cloudinary_secret
OPENAI_API_KEY=your_openai_api_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLIENT_URL=http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Admin registration
- `POST /api/auth/login` - Admin login
- `POST /api/login` - Multi-role user login
- `GET /api/login/logout` - Logout

### Exam (with JD Generation & Proctoring)
- `POST /api/exam` - Create exam with AI-generated MCQs
- `POST /api/exam/from-jd` - Generate exam from Job Description
- `PATCH /api/exam/:id/proctoring` - Update proctoring settings

### Paper & Proctoring
- `POST /api/paper/session/:examId` - Start proctored exam session
- `POST /api/paper/:paperId/violation` - Record proctoring violation
- `POST /api/paper/:paperId/snapshot` - Save camera snapshot
- `POST /api/paper/:paperId/auto-submit` - Auto-submit on max violations
- `GET /api/paper/:paperId/proctoring` - Get proctoring details

### Jobs & Applications
- `GET /api/jobs/student` - Browse available jobs
- `POST /api/application/:jobId` - Apply for a job

### Academic Profile (S1-01)
- **Data Model**: Enhances `tbl_student` with `academic_year`, `academic_batch`, `academic_status`, `cgpa`, `percentage`, `admission_year`, `expected_graduation_year`, `academic_profile_initialized`, `academic_profile_updated_at`, `is_deleted`, `deleted_at` (reusing `college_id`, `university_id`, `degree_id`, `branch_id`, `student_enrollment`, `student_current_sem`, `student_total_backlog`). Adds `tbl_academic_history` (normalized chronological stages with soft-delete & `is_locked` archive protection) and `tbl_audit_log`.
- **Migration**:
  - Forward: `node src/scripts/migrateAcademicProfile.js` (inspects data anomalies, backfills defaults non-destructively, syncs indexes)
  - Rollback: `node src/scripts/migrateAcademicProfile.js --rollback`
- **Endpoints** (`/api/academic-profile`, authenticated):
  - `GET /me`, `PATCH /me`, `GET /me/completion` (Student self-service; institutional identity fields locked when `isVerifiedByTPO === true`)
  - `GET /me/history`, `POST /me/history`, `PATCH /me/history/:historyId`, `DELETE /me/history/:historyId`
  - `GET /student/:studentId`, `POST /student/:studentId`, `PATCH /student/:studentId`, `GET /student/:studentId/completion` (Student owner, College within own college, TPO within own college/degree, University read-only within own university, Admin)
  - `GET|POST /student/:studentId/history`, `PATCH|DELETE /student/:studentId/history/:historyId`
  - `GET /student/:studentId/audit-logs`
- **Web & Flutter**: Integrated via `AcademicProfileSection` / `AcademicProfilePage` (`/dashboard/student/academic-profile`, `Profile.jsx`, and staff `ManageStudent` modals) and Flutter `AcademicProfileScreen` (`/academic-profile` via `AcademicProfileService`).
- **Tests**:
  - Backend: `cd server && npm test`
  - Frontend validation: `cd client && node --test tests/academicProfileValidation.test.js`
  - Flutter: `cd flutter_student_app && flutter test`

### Technical Skills Management (S1-02)
- **Data Model**:
  - `tbl_skill` (`name`, `normalized_name`, `category`, `aliases`, `description`, `is_active`, `is_deleted`, `deleted_at`) with partial unique index `{ normalized_name: 1 }` on active (`is_deleted: false`) records to prevent case/whitespace duplicates.
  - `tbl_student_skill` (`student_id`, `skill_id`, `college_id`, `proficiency`, `years_of_experience`, `display_order`, `is_deleted`, `deleted_at`) with partial unique index `{ student_id: 1, skill_id: 1 }` on `{ is_deleted: false }`, and automatically syncs `tbl_student.student_skills` for backward compatibility.
- **Migration**:
  - Forward: `node src/scripts/migrateTechnicalSkills.js` (seeds canonical skills and backfills legacy `tbl_student.student_skills` safely)
  - Rollback: `node src/scripts/migrateTechnicalSkills.js --rollback`
- **Endpoints** (`/api/skills`, authenticated):
  - `GET /master`, `GET /master/:skillId` (searchable paginated canonical skills)
  - `POST /master` (`Admin`, `College`, `TPO`), `PATCH|DELETE /master/:skillId` (`Admin` only)
  - `GET|POST /me`, `PATCH /me/reorder`, `PATCH|DELETE /me/:userSkillId` (`Student` self-service)
  - `GET|POST /student/:studentId`, `PATCH /student/:studentId/reorder`, `PATCH|DELETE /student/:studentId/:userSkillId` (Student owner, scoped `College`, scoped `TPO`, `University` read-only, `Admin`)
- **Web & Flutter**: Integrated via `TechnicalSkillsSection` / `TechnicalSkillsPage` (`/dashboard/student/skills`, `Profile.jsx`, and `AcademicProfileModal.jsx` tab) and Flutter `TechnicalSkillsScreen` (`/skills` via `TechnicalSkillsService`).
- **Tests**:
  - Backend: `cd server && npm test`
  - Frontend validation: `cd client && node --test tests/*.test.js`
  - Flutter: `cd flutter_student_app && flutter test`

### Skill Proficiency Levels (S1-03)
- **Architecture**: Enhances S1-02 (`tbl_student_skill`) with a single authoritative ordered proficiency definition (`SKILL_PROFICIENCY_LEVELS`: 1. `Beginner`, 2. `Intermediate`, 3. `Advanced`, 4. `Expert` in `server/src/utils/constants.js`), stored per user-skill association (never on `tbl_skill`).
- **Endpoints** (`/api/skills`):
  - `GET /proficiencies`: Returns active proficiency levels in deterministic order (`order: 1..4`).
  - `GET /me` & `GET /student/:studentId`: Support `?proficiency=<Level>` filtering and `?sort=display_order|proficiency_desc|proficiency_asc` deterministic sorting, returning `proficiency`, `proficiency_order`, and `proficiency_details`.
  - `PATCH /me/:userSkillId` & `PATCH /student/:studentId/:userSkillId`: Update proficiency in-place without duplicating associations and log `UPDATE_USER_SKILL_PROFICIENCY` in `tbl_audit_log`.
- **Migration**:
  - `node src/scripts/migrateProficiencyLevels.js` (normalizes legacy/case-variant proficiency values safely; `--rollback` is non-destructive).

### Projects Management (S1-04)
- **Data Model**:
  - `tbl_project` (`student_id`, `college_id`, `title`, `description`, `role`, `status`, `visibility`, `is_ongoing`, `start_date`, `end_date`, `team_size`, `project_url`, `repository_url`, `live_demo_url`, `display_order`, `is_deleted`, `deleted_at`).
  - `tbl_project_skill` (`project_id`, `student_id`, `skill_id` -> canonical S1-02 `tbl_skill`) with partial unique index `{ project_id: 1, skill_id: 1 }` (`is_deleted: false`).
- **Endpoints** (`/api/projects`, authenticated):
  - `GET /meta`: Returns controlled `statuses` and `visibilities`.
  - `GET|POST /me`, `PATCH /me/reorder`, `GET|PATCH|DELETE /me/:projectId`, `POST /me/:projectId/skills`, `DELETE /me/:projectId/skills/:skillId`.
  - `GET|POST /student/:studentId`, `PATCH /student/:studentId/reorder`, `GET|PATCH|DELETE /student/:studentId/:projectId`, `POST|DELETE /student/:studentId/:projectId/skills...` (respecting `Private` visibility + college/TPO/university scoping).
- **Web & Flutter**: `ProjectsSection` / `ProjectsPage` (`/dashboard/student/projects`, `Profile.jsx`, `AcademicProfileModal.jsx` tab) and Flutter `ProjectsScreen` (`/projects` via `ProjectsService`).
- **Migration**: `node src/scripts/migrateProjects.js` (backfills legacy `tbl_resume.projects` safely).

### GitHub and Project Links (S1-05)
- **Data Model**: `tbl_project_link` (`project_id`, `student_id`, `link_type`, `url`, `normalized_url`, `label`, `display_order`, `is_deleted`, `deleted_at`) linked to `tbl_project`, with partial unique index `{ project_id: 1, normalized_url: 1 }` and single canonical `GITHUB_REPOSITORY` partial unique index per project. Backward-compatible `repository_url`, `live_demo_url`, and `project_url` remain derived in project responses.
- **Link Types & Security**: `GITHUB_REPOSITORY`, `GITLAB_REPOSITORY`, `BITBUCKET_REPOSITORY`, `LIVE_DEMO`, `PROJECT_WEBSITE`, `DOCUMENTATION`. Enforces strict `URL` hostname checks (`github.com` / `www.github.com` + `https:` + `/owner/repo` path; blocks `github.com.attacker.example`, `javascript:`, `data:`, `vbscript:`, `file:`). Intentionally does NOT integrate GitHub API/OAuth or store credentials.
- **Endpoints** (`/api/projects`): `GET|POST /me/:projectId/links`, `PATCH /me/:projectId/links/reorder`, `PATCH|DELETE /me/:projectId/links/:linkId` (and `/student/:studentId/:projectId/links...` respecting `Private` project visibility).
- **Migration**: `node src/scripts/migrateProjectLinks.js` (migrates legacy `tbl_project` URL fields into `tbl_project_link` safely; `--rollback` restores legacy fields).

### Certifications Management (S1-06)
- **Data Model**: `tbl_certification` (`student_id`, `title`, `normalized_title`, `issuing_organization`, `normalized_issuer`, `category`, `credential_id`, `normalized_credential_id`, `credential_url`, `issue_date`, `expiry_date`, `does_not_expire`, `description`, `visibility` [`Public` | `Institute Only` | `Private`], `status` [`Active` | `Archived`], `certificate_file`, `display_order`, `is_deleted`, `deleted_at`).
- **Validation & Security**: Enforces `issue_date <= expiry_date`, forces `expiry_date = null` when `does_not_expire = true`, requires strict `https://` for `credential_url` (blocks `http:`, `javascript:`, `data:`, `vbscript:`, `file:`), prevents duplicate issuer+credential_id records, blocks mass assignment of protected/ownership fields, enforces RBAC/tenant isolation + `Private` visibility via `academicProfileService`, and audits actions in `tbl_audit_log`.
- **Private Certificate Storage**: Certificate attachments (PDF, JPG, JPEG, PNG <= 5 MB) are validated via extension, MIME, and file magic bytes (`%PDF-`, JPEG, PNG), stored outside public `/uploads` in `server/private_uploads/certificates/`, and streamed exclusively through authorized `/certificate` endpoints.
- **Endpoints** (`/api/certifications`, authenticated):
  - `GET /meta`
  - `GET|POST /me`, `PATCH /me/reorder`, `GET|PATCH|DELETE /me/:certId`, `GET|POST|DELETE /me/:certId/certificate`
  - `GET|POST /student/:studentId`, `PATCH /student/:studentId/reorder`, `GET|PATCH|DELETE /student/:studentId/:certId`, `GET|POST|DELETE /student/:studentId/:certId/certificate`
- **Web & Flutter**: `CertificationsSection` / `CertificationsPage` (`/dashboard/student/certifications`, `Profile.jsx`, `AcademicProfileModal.jsx` tab) and Flutter `CertificationsScreen` (`/certifications` via `CertificationsService`).
- **Migration**: `node src/scripts/migrateCertifications.js` (syncs indexes and backfills legacy `tbl_resume.certifications` safely without modifying `tbl_resume`).

### Internship Experience (S1-07)
- **Data Model**: `tbl_internship` (`student_id`, `role_title`, `normalized_role`, `organization_name`, `normalized_organization`, `employment_type` reusing `JOB_TYPE`, `work_mode` reusing `WORK_MODE`, `location`, `start_date`, `end_date`, `currently_working`, `description`, `responsibilities`, `achievements`, `company_website`, `links[]`, `skill_ids[] -> tbl_skill`, `project_ids[] -> tbl_project`, `visibility`, `status`, `display_order`, `is_deleted`, `deleted_at`).
- **Validation & Security**: Enforces `start_date <= end_date`, requires `end_date` unless `currently_working = true` (which forces `end_date = null`), allows overlapping concurrent internships while preventing exact duplicate `(organization, role, start, end)` entries, verifies ownership of linked `project_ids` (filtering `Private` projects from scoped viewers), blocks mass assignment, enforces RBAC/tenant isolation + `Private` visibility via `academicProfileService`, and audits actions in `tbl_audit_log`.
- **Endpoints** (`/api/internships`, authenticated):
  - `GET /meta`
  - `GET|POST /me`, `PATCH /me/reorder`, `GET|PATCH|DELETE /me/:internshipId`
  - `GET|POST /student/:studentId`, `PATCH /student/:studentId/reorder`, `GET|PATCH|DELETE /student/:studentId/:internshipId`
- **Web & Flutter**: `InternshipsSection` / `InternshipsPage` (`/dashboard/student/internships`, `Profile.jsx`, `AcademicProfileModal.jsx` tab) and Flutter `InternshipsScreen` (`/internships` via `InternshipsService`).
- **Migration**: `node src/scripts/migrateInternships.js` (syncs indexes and non-destructively backfills legacy `tbl_resume.experience`).

### Multiple Resume Versions (S1-08)
- **Architecture (Live Canonical Reference Layer)**: `tbl_resume_version` stores resume version metadata, template/styling configuration, ordered sections (`summary`, `skills`, `projects`, `internships`, `certifications`, `education`), and canonical reference ID arrays (`selected_skill_ids -> tbl_student_skill`, `selected_project_ids -> tbl_project`, `selected_certification_ids -> tbl_certification`, `selected_internship_ids -> tbl_internship`, `selected_education_ids -> tbl_academic_history`) without duplicating profile data.
- **Invariants & Security**: Enforces partial unique index `{ student_id: 1, is_default: 1 }` (`is_deleted: false, is_default: true`), caps active versions per student at 20, batch-verifies nested resource ownership so cross-user references fail, escapes HTML & Mustache braces (`{{...}}`) before template rendering (`compileHtmlTemplate` + `generatePdfFromHtml`), masks private phone numbers on anonymous shared tokens, and supports expiring/revocable 256-bit `share_token` links.
- **Endpoints** (`/api/resume-versions`):
  - `GET /shared/:shareToken` (read-only active non-expired token preview)
  - `GET /meta`, `GET|POST /me`, `GET|PATCH|DELETE /me/:resumeId`, `POST /me/:resumeId/duplicate`, `POST /me/:resumeId/default`, `PATCH /me/:resumeId/share`, `POST /me/:resumeId/preview`, `GET /me/:resumeId/download-pdf`
  - Scoped read/preview/download: `GET /student/:studentId`, `GET /student/:studentId/:resumeId`, `POST /student/:studentId/:resumeId/preview`, `GET /student/:studentId/:resumeId/download-pdf`
- **Web & Flutter**: `ResumeVersionsSection` / `ResumeVersionsPage` (`/dashboard/student/resume-versions`, linked from `ResumeBuilder.jsx` & `Profile.jsx`) and Flutter `ResumeVersionsScreen` (`/resume-versions` via `ResumeVersionsService`).
- **Migration**: `node src/scripts/migrateResumeVersions.js` (syncs indexes and creates non-destructive initial default versions referencing canonical S1-01..S1-07 data without modifying `tbl_resume`).

### Resume Upload & Document Management Integration (S1-09)
- **Canonical Document Model**: `tbl_document` (`owner_id`, `document_type` [`RESUME`, `CERTIFICATE`, `ACADEMIC_DOCUMENT`, `OTHER`], `title`, `description`, `original_filename`, `storage_key`, `storage_provider`, `mime_type`, `file_size`, `checksum`, `version`, `malware_scan_status`, `visibility`, `status`, `is_deleted`, `deleted_at`) with duplicate content checksum protection `{ owner_id: 1, document_type: 1, checksum: 1 }`.
- **Storage & Validation Security**: Stored outside public `/uploads` in `server/private_uploads/documents/` via `documentUploadMiddleware.js`; validates filenames/path traversal, extension + MIME + file magic bytes (`%PDF-`, DOCX `PK\x03\x04`, DOC OLE2, JPEG, PNG), SHA-256 checksum, max 10 MB per file, max 25 files / 50 MB quota per user, automatic orphan file cleanup on DB failure, and `inline` vs `attachment` Content-Disposition with `X-Content-Type-Options: nosniff`. Note: `malware_scan_status` records `NotScanned` honestly where no ClamAV/external scanner is configured.
- **S1-08 Integration**: `tbl_resume_version.uploaded_document_id` cleanly links uploaded `RESUME` documents without copying binaries; deleting a document automatically clears dangling S1-08 references.
- **Endpoints** (`/api/documents`, authenticated):
  - `GET /meta`, `GET|POST /me`, `GET|PATCH|DELETE /me/:docId`, `PUT /me/:docId/replace`, `GET /me/:docId/download`, `POST /me/:docId/associate-resume`
  - Scoped student endpoints: `GET|POST /student/:studentId`, `GET|PATCH|DELETE /student/:studentId/:docId`, `PUT /student/:studentId/:docId/replace`, `GET /student/:studentId/:docId/download`
- **Web & Flutter**: `ResumeDocumentsSection` / `DocumentsPage` (`/dashboard/student/documents`, integrated in `ResumeVersionsPage.jsx`, `Profile.jsx`, `AcademicProfileModal.jsx`) and Flutter `DocumentsScreen` (`/documents` via `DocumentsService` + multipart `ApiService.uploadMultipart`).
- **Migration**: `node src/scripts/migrateDocuments.js` (syncs indexes and audits orphaned files cleanly).

### Profile Completeness Calculation (S1-10)
- **Derived Authoritative Engine (`S1-10.v1`)**: Computes unified completeness dynamically on the server from canonical S1-01..S1-09 collections without duplicating profile tables or storing drift-prone cached scores.
- **Weighted Criteria**: Core applicable Student sections total 100 points — `basic_identity` (15), `academic_profile` reusing `calculateAcademicCompletion` (25), `technical_skills` with S1-03 proficiency & active skill check (20), `projects` with S1-05 external links (20), `resume_readiness` combining S1-08 versions + S1-09 `RESUME` upload (20). Optional enhancement sections (`certifications` S1-06, `internships` S1-07) have weight `0` so empty optional sections never block reaching 100%, while soft-deleted, archived, infected, orphan, or incomplete items are excluded.
- **Endpoints** (`/api/profile-completeness`, authenticated):
  - `GET /rules` (canonical formula version, section weights, action links)
  - `GET /me` (authenticated user completeness)
  - `GET /student/:studentId` (role/institute-scoped inspection via `academicProfileService.assertCanAccessStudent`)
- **Web & Flutter**: `ProfileCompletenessCard` on Web `StudentDashboard`, `Profile`, and `AcademicProfileModal` (`Completeness` tab), plus Flutter `ProfileCompletenessService` and `ProfileCompletenessCard` on `HomeScreen` (replacing legacy hardcoded 8-field calculation) and `ProfileScreen`.

### Profile Validation & Visibility (S1-11)
- **Separation of Concerns**: Keeps completeness (S1-10), multi-level domain validation (`FIELD` / `RECORD` / `SECTION` / `PROFILE` with `ERROR` vs `WARNING` severities and stable error codes), publishability (`publishable === true`), and audience visibility (`Private` default | `Institute Only` | `Public`) distinct.
- **Canonical State & Safe Migration**: `tbl_student` stores `profile_visibility` (conservative default `Private`), `is_published` (default `false`), `published_at`, `visibility_updated_at`, `visibility_override` (`NONE` | `RESTRICTED_PRIVATE` | `SUSPENDED`), and `visibility_override_reason`. `node src/scripts/migrateProfilePolicy.js` syncs indexes and backfills legacy profiles to `Private` / unpublished without accidental public exposure.
- **Security & Public Allowlist**: Enforces server-authoritative validation on publish/visibility transitions (blocking invalid profiles cleanly with `422 NOT_PUBLISHABLE`), prevents mass assignment, protects against IDOR and cross-institute inspection using canonical `institute_id` scoping, ensures invalid or suspended profiles are hidden (`404`) from `/public/:studentId` and `/discover`, and projects public views strictly through `PUBLIC_PROFILE_ALLOWLIST` (omitting email, contact, enrollment, backlogs, raw institute IDs, private S1-04..S1-07 entries, private certification files, and S1-08/S1-09 documents). Audits publish, unpublish, visibility changes, and Admin overrides in `tbl_audit_log`.
- **Endpoints** (`/api/profile-policy`):
  - `GET /meta`, `GET /discover`, `GET /public/:studentId` (allowlisted public safe reads)
  - `GET /me`, `POST /me/publish`, `POST /me/unpublish`, `PATCH /me/visibility` (authenticated Student)
  - `GET /student/:studentId`, `GET /view/:studentId` (policy & audience-projected view including owner preview)
  - `PATCH /admin/:studentId/override` (Admin override with mandatory audit logging)
- **Web & Flutter**: `ProfileValidationVisibilityCard` on `Profile.jsx` and `AcademicProfileModal.jsx` (`Validation & Visibility` tab), plus Flutter `ProfilePolicyService` and `ProfilePolicyCard` on `ProfileScreen`.

## Developed by
**Tech Creature Solution** - AI-powered educational technology solutions
