import test from "node:test";
import assert from "node:assert/strict";
import {
  PROFILE_LIFECYCLE_STATES,
  PROFILE_VALIDATION_CODES,
  PROFILE_VISIBILITY,
  PROFILE_VISIBILITY_OVERRIDE,
} from "../src/utils/constants.js";
import { evaluateProfileValidation } from "../src/modules/profilePolicy/profilePolicy.validatorEngine.js";
import {
  projectProfileByAudience,
  resolveViewAudiencePolicy,
  VIEWER_AUDIENCE,
} from "../src/modules/profilePolicy/profilePolicy.visibility.js";

const buildValidStudent = (overrides = {}) => ({
  _id: "65f000000000000000000301",
  role: "Student",
  student_name: "Riya Deshmukh",
  student_email: "riya@example.com",
  student_contact: "9876543210",
  student_enrollment: "EN2025009",
  student_current_sem: "6",
  student_total_backlog: "0",
  academic_year: "2025-26",
  academic_batch: "2022-2026",
  academic_status: "Active",
  university_id: { _id: "u1", university_name: "Gujarat Tech" },
  degree_id: { _id: "d1", degree_name: "B.Tech" },
  branch_id: { _id: "b1", branch_name: "CSE" },
  cgpa: 8.9,
  isVerifiedByTPO: true,
  profile_visibility: PROFILE_VISIBILITY.PRIVATE,
  is_published: false,
  visibility_override: PROFILE_VISIBILITY_OVERRIDE.NONE,
  is_deleted: false,
  ...overrides,
});

const buildValidSkills = () => [
  {
    _id: "ss1",
    skill_id: { _id: "s1", name: "TypeScript", category: "Programming Languages", is_active: true, is_deleted: false },
    proficiency: "Advanced",
    is_deleted: false,
  },
];

test("S1-11 validator: valid publishable profile can have <100% completeness (warnings only do not block publishing)", () => {
  const result = evaluateProfileValidation({
    student: buildValidStudent(),
    institute_id: "inst_1",
    activeAcademicHistoryCount: 0, // triggers warning only
    studentSkills: buildValidSkills(), // 1 valid skill => warning for <3 skills, valid & publishable
    projects: [],
    certifications: [],
    internships: [],
    resumeVersions: [],
    documents: [],
  });

  assert.equal(result.valid, true);
  assert.equal(result.publishable, true);
  assert.equal(result.profile_state, PROFILE_LIFECYCLE_STATES.VALID);
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.length > 0);
  assert.ok(result.completeness_percentage < 100);
});

test("S1-11 validator: missing required fields, bad formats, bad date ranges, and infected resume block publishing", () => {
  const result = evaluateProfileValidation({
    student: buildValidStudent({
      student_email: "not-an-email",
      student_contact: "123",
      degree_id: null,
      admission_year: 2025,
      expected_graduation_year: 2023,
    }),
    institute_id: "inst_1",
    studentSkills: [
      { _id: "ss1", skill_id: { _id: "s1", name: "React", is_active: false }, proficiency: "BAD", is_deleted: false },
      { _id: "ss2", skill_id: { _id: "s1", name: "React", is_active: true }, proficiency: "Beginner", is_deleted: false },
    ],
    projects: [
      {
        _id: "p1",
        title: "Bad Project",
        description: "Desc",
        is_ongoing: false,
        start_date: "2025-05-01",
        end_date: "2025-01-01",
        repository_url: "javascript:alert(1)",
        is_deleted: false,
      },
    ],
    certifications: [
      {
        _id: "c1",
        title: "Cert",
        issuing_organization: "Org",
        issue_date: "2025-06-01",
        expiry_date: "2025-01-01",
        does_not_expire: false,
        credential_url: "http://insecure.example.com/cert",
        status: "Active",
        is_deleted: false,
      },
    ],
    internships: [
      {
        _id: "i1",
        role_title: "Intern",
        organization_name: "Corp",
        start_date: "2025-06-01",
        end_date: "2025-03-01",
        currently_working: false,
        status: "Active",
        is_deleted: false,
      },
    ],
    documents: [
      {
        _id: "doc1",
        document_type: "RESUME",
        status: "Available",
        malware_scan_status: "Infected",
        file_size: 1024,
        original_filename: "cv.pdf",
        is_deleted: false,
      },
    ],
  });

  assert.equal(result.valid, false);
  assert.equal(result.publishable, false);
  assert.equal(result.profile_state, PROFILE_LIFECYCLE_STATES.INVALID);

  const codes = new Set(result.errors.map((e) => e.code));
  assert.ok(codes.has(PROFILE_VALIDATION_CODES.REQUIRED_FIELD));
  assert.ok(codes.has(PROFILE_VALIDATION_CODES.INVALID_FORMAT));
  assert.ok(codes.has(PROFILE_VALIDATION_CODES.INVALID_DATE_RANGE));
  assert.ok(codes.has(PROFILE_VALIDATION_CODES.INVALID_URL));
  assert.ok(codes.has(PROFILE_VALIDATION_CODES.INVALID_REFERENCE));
  assert.ok(codes.has(PROFILE_VALIDATION_CODES.UNSUPPORTED_STATE));
});

test("S1-11 visibility: enforces private/institute/public audiences and strips sensitive fields from public projection", () => {
  const validStudent = buildValidStudent({
    profile_visibility: PROFILE_VISIBILITY.PUBLIC,
    is_published: true,
    published_at: new Date("2026-01-01T00:00:00Z"),
  });

  const validationPass = { valid: true, publishable: true, profile_state: "PUBLISHED" };

  // 1. Public viewer on published valid profile gets PUBLIC allowlist ONLY
  const publicAccess = resolveViewAudiencePolicy({
    scopedActor: null,
    student: validStudent,
    studentInstituteId: "inst_1",
    validation: validationPass,
  });
  assert.equal(publicAccess.audience, VIEWER_AUDIENCE.PUBLIC);

  const publicDto = projectProfileByAudience({
    student: validStudent,
    institute_id: "inst_1",
    studentSkills: buildValidSkills(),
    projects: [
      { _id: "p1", title: "Public App", description: "Open showcase", status: "Completed", visibility: "Public", is_deleted: false },
      { _id: "p2", title: "Private Thesis", description: "Confidential", status: "Completed", visibility: "Private", is_deleted: false },
    ],
    certifications: [
      {
        _id: "c1",
        title: "Public Cert",
        issuing_organization: "Linux Foundation",
        visibility: "Public",
        status: "Active",
        certificate_file: { filename: "secret_cert.pdf" },
        is_deleted: false,
      },
      {
        _id: "c2",
        title: "Private Cert",
        issuing_organization: "Org",
        visibility: "Private",
        status: "Active",
        is_deleted: false,
      },
    ],
    internships: [
      { _id: "i1", role_title: "SWE Intern", organization_name: "Beta", start_date: "2025-05-01", achievements: "Secret KPI", visibility: "Public", status: "Active", is_deleted: false },
      { _id: "i2", role_title: "Hidden Intern", organization_name: "Stealth", start_date: "2025-01-01", visibility: "Institute Only", status: "Active", is_deleted: false },
    ],
    audience: VIEWER_AUDIENCE.PUBLIC,
    validation: validationPass,
  });

  const p = publicDto.profile;
  assert.equal(p.student_name, "Riya Deshmukh");
  assert.equal("student_email" in p, false);
  assert.equal("student_contact" in p, false);
  assert.equal("student_enrollment" in p, false);
  assert.equal("institute_id" in p, false);
  assert.equal(p.projects.length, 1);
  assert.equal(p.projects[0].title, "Public App");
  assert.equal(p.certifications.length, 1);
  assert.equal(p.certifications[0].has_attachment, false);
  assert.equal(p.internships.length, 1);
  assert.equal("achievements" in p.internships[0], false);

  // 2. Already published profile that is currently INVALID cannot be read publicly
  assert.throws(
    () =>
      resolveViewAudiencePolicy({
        scopedActor: null,
        student: validStudent,
        studentInstituteId: "inst_1",
        validation: { valid: false, publishable: false, profile_state: "INVALID" },
      }),
    (err) => err.statusCode === 404,
  );

  // 3. Cross-institute staff is rejected with 403
  assert.throws(
    () =>
      resolveViewAudiencePolicy({
        scopedActor: { role: "College", userId: "inst_other" },
        student: buildValidStudent({ profile_visibility: PROFILE_VISIBILITY.INSTITUTE_ONLY, is_published: true }),
        studentInstituteId: "inst_1",
        actorInstituteId: "inst_other",
        validation: validationPass,
      }),
    (err) => err.statusCode === 403,
  );
});
