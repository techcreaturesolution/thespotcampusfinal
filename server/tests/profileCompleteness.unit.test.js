import test from "node:test";
import assert from "node:assert/strict";
import {
  PROFILE_COMPLETENESS_FORMULA_VERSION,
  PROFILE_COMPLETENESS_SECTIONS,
} from "../src/modules/profileCompleteness/profileCompleteness.config.js";
import {
  calculateUnifiedProfileCompleteness,
  filterValidCertifications,
  filterValidInternships,
  filterValidProjectLinks,
  filterValidProjects,
  filterValidResumeDocuments,
  filterValidResumeVersions,
  filterValidSkills,
} from "../src/modules/profileCompleteness/profileCompleteness.calculator.js";

const buildCompleteStudent = () => ({
  _id: "65f000000000000000000101",
  role: "Student",
  student_name: "Aarav Patel",
  student_email: "aarav.patel@example.com",
  student_contact: "9876543210",
  university_id: "65f000000000000000000001",
  college_id: "65f000000000000000000002",
  degree_id: "65f000000000000000000003",
  branch_id: "65f000000000000000000004",
  student_enrollment: "EN2024001",
  student_current_sem: "6",
  academic_year: "2025-26",
  academic_batch: "2022-2026",
  cgpa: 8.6,
});

const buildThreeValidSkills = () => [
  {
    skill_id: { _id: "s1", name: "JavaScript", is_active: true, is_deleted: false },
    proficiency: "Advanced",
    is_deleted: false,
  },
  {
    skill_id: { _id: "s2", name: "Node.js", is_active: true, is_deleted: false },
    proficiency: "Intermediate",
    is_deleted: false,
  },
  {
    skill_id: { _id: "s3", name: "MongoDB", is_active: true, is_deleted: false },
    proficiency: "Expert",
    is_deleted: false,
  },
];

const buildValidProject = (id = "p1") => ({
  _id: id,
  title: "Campus Placement Portal",
  description: "Full-stack placement workflow system",
  status: "Completed",
  is_deleted: false,
});

test("S1-10 config: required student section weights sum cleanly to 100 and expose action routes", () => {
  const requiredWeightSum = PROFILE_COMPLETENESS_SECTIONS.filter((s) => !s.is_optional).reduce(
    (sum, sec) => sum + sec.weight,
    0,
  );
  assert.equal(requiredWeightSum, 100);
  for (const sec of PROFILE_COMPLETENESS_SECTIONS) {
    assert.ok(sec.action?.web_path, `Missing web_path on ${sec.key}`);
    assert.ok(sec.action?.mobile_route, `Missing mobile_route on ${sec.key}`);
  }
});

test("S1-10 calculator: completely empty student profile calculates 0% with missing checklist", () => {
  const result = calculateUnifiedProfileCompleteness({
    student: { _id: "65f000000000000000000101", role: "Student" },
  });

  assert.equal(result.formula_version, PROFILE_COMPLETENESS_FORMULA_VERSION);
  assert.equal(result.percentage, 0);
  assert.equal(result.earned_weight, 0);
  assert.equal(result.applicable_weight, 100);
  assert.equal(result.is_complete, false);
  assert.equal(result.status_band, "EMPTY");
  assert.equal(result.completed_sections, 0);
  assert.ok(result.missing_items.length > 0);
  assert.equal(result.recommendations.length, 2); // certifications + internships optional
});

test("S1-10 calculator: full required profile reaches 100% even when optional sections are empty", () => {
  const result = calculateUnifiedProfileCompleteness({
    student: buildCompleteStudent(),
    activeAcademicHistoryCount: 1,
    studentSkills: buildThreeValidSkills(),
    projects: [buildValidProject("p1")],
    projectLinks: [
      {
        project_id: "p1",
        link_type: "GITHUB_REPOSITORY",
        url: "https://github.com/aarav/campus-portal",
        is_deleted: false,
      },
    ],
    certifications: [],
    internships: [],
    resumeVersions: [{ name: "SDE Resume", status: "Active", is_deleted: false }],
    documents: [
      {
        document_type: "RESUME",
        status: "Available",
        malware_scan_status: "Clean",
        file_size: 4096,
        original_filename: "aarav-resume.pdf",
        is_deleted: false,
      },
    ],
  });

  assert.equal(result.percentage, 100);
  assert.equal(result.earned_weight, 100);
  assert.equal(result.applicable_weight, 100);
  assert.equal(result.is_complete, true);
  assert.equal(result.status_band, "COMPLETE");
  assert.equal(result.missing_items.length, 0);
  assert.equal(result.completed_sections, 5);
  assert.equal(result.recommendations.length, 2); // empty optional sections stay advisory
});

test("S1-10 calculator: partial profile computes deterministic percentage with proper rounding and repeated-run idempotency", () => {
  const snapshot = {
    student: {
      student_name: "Diya Mehta",
      student_email: "diya@example.com",
      student_contact: "", // 2/3 of 15 = 10
      university_id: "u1",
      college_id: "c1", // 2/10 of 25 = 5
    },
    activeAcademicHistoryCount: 0,
    studentSkills: [
      {
        skill_id: { _id: "s1", name: "Python", is_active: true, is_deleted: false },
        proficiency: "Beginner",
        is_deleted: false,
      },
    ], // 1/2 of 20 = 10
    projects: [buildValidProject("p1")], // project present, no external link => 1/2 of 20 = 10
    projectLinks: [],
    resumeVersions: [{ name: "General", status: "Active", is_deleted: false }], // 1/2 of 20 = 10
    documents: [],
  };

  const first = calculateUnifiedProfileCompleteness(snapshot);
  const second = calculateUnifiedProfileCompleteness(snapshot);

  assert.equal(first.earned_weight, 45);
  assert.equal(first.percentage, 45);
  assert.equal(second.percentage, first.percentage);
  assert.deepEqual(second.sections, first.sections);
  assert.equal(first.status_band, "IN_PROGRESS");

  // Check fractional rounding rule: 1/3 of 15 = 5, 1/10 of 25 = 2.5 => total 7.5 => Math.round(7.5) === 8
  const fractional = calculateUnifiedProfileCompleteness({
    student: {
      student_name: "Only Name",
      university_id: "u1",
    },
  });
  assert.equal(fractional.earned_weight, 7.5);
  assert.equal(fractional.percentage, 8);
});

test("S1-10 calculator: soft-deleted, archived, infected, orphan, and malformed items are excluded", () => {
  const validSkills = filterValidSkills([
    {
      skill_id: { _id: "s1", name: "React", is_active: false, is_deleted: false },
      proficiency: "ADVANCED",
      is_deleted: false,
    },
    {
      skill_id: { _id: "s2", name: "Docker", is_active: true, is_deleted: true },
      proficiency: "ADVANCED",
      is_deleted: false,
    },
    {
      skill_id: { _id: "s3", name: "Java", is_active: true, is_deleted: false },
      proficiency: "INVALID_LEVEL",
      is_deleted: false,
    },
    {
      skill_id: { _id: "s4", name: "Go", is_active: true, is_deleted: false },
      proficiency: "EXPERT",
      is_deleted: true,
    },
    { skill_id: null, proficiency: "EXPERT", is_deleted: false },
  ]);
  assert.equal(validSkills.length, 0);

  const validProjects = filterValidProjects([
    { _id: "p1", title: "Archived Project", description: "Done", status: "Archived", is_deleted: false },
    { _id: "p2", title: "Deleted Project", description: "Done", status: "Completed", is_deleted: true },
    { _id: "p3", title: "   ", description: "Missing title", status: "Completed", is_deleted: false },
    { _id: "p4", title: "No description", description: "", status: "Completed", is_deleted: false },
  ]);
  assert.equal(validProjects.length, 0);

  const validLinks = filterValidProjectLinks(
    [
      { project_id: "p1", url: "https://github.com/a/b", is_deleted: true },
      { project_id: "orphan", url: "https://github.com/a/b", is_deleted: false },
    ],
    new Set(["p_active"]),
  );
  assert.equal(validLinks.length, 0);

  assert.equal(
    filterValidCertifications([
      { title: "AWS", issuing_organization: "AWS", issue_date: "2025-01-01", status: "Archived", is_deleted: false },
      { title: "Azure", issuing_organization: "Microsoft", issue_date: "2025-01-01", status: "Active", is_deleted: true },
      { title: "Incomplete", issuing_organization: "", issue_date: "2025-01-01", status: "Active", is_deleted: false },
    ]).length,
    0,
  );

  assert.equal(
    filterValidInternships([
      { role_title: "Intern", organization_name: "Acme", start_date: "2025-01-01", status: "Archived", is_deleted: false },
      { role_title: "Intern", organization_name: "Acme", start_date: "invalid-date", status: "Active", is_deleted: false },
    ]).length,
    0,
  );

  assert.equal(
    filterValidResumeVersions([
      { name: "Archived Ver", status: "Archived", is_deleted: false },
      { name: "Deleted Ver", status: "Active", is_deleted: true },
    ]).length,
    0,
  );

  assert.equal(
    filterValidResumeDocuments([
      {
        document_type: "CERTIFICATE",
        status: "Available",
        malware_scan_status: "Clean",
        file_size: 1000,
        original_filename: "cert.pdf",
        is_deleted: false,
      },
      {
        document_type: "RESUME",
        status: "Archived",
        malware_scan_status: "Clean",
        file_size: 1000,
        original_filename: "old.pdf",
        is_deleted: false,
      },
      {
        document_type: "RESUME",
        status: "Available",
        malware_scan_status: "Infected",
        file_size: 1000,
        original_filename: "bad.pdf",
        is_deleted: false,
      },
      {
        document_type: "RESUME",
        status: "Available",
        malware_scan_status: "Clean",
        file_size: 1000,
        original_filename: "del.pdf",
        is_deleted: true,
      },
    ]).length,
    0,
  );
});

test("S1-10 calculator: role applicability / zero applicable sections never divides by zero", () => {
  const nonStudentResult = calculateUnifiedProfileCompleteness({
    role: "Company",
  });
  assert.equal(nonStudentResult.percentage, 0);
  assert.equal(nonStudentResult.raw_percentage, 0);
  assert.equal(nonStudentResult.applicable_weight, 0);
  assert.equal(nonStudentResult.is_complete, false);
  assert.equal(nonStudentResult.status_band, "NOT_APPLICABLE");
  assert.ok(nonStudentResult.sections.every((s) => s.applicable === false));
});
