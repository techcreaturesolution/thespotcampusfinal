import test from "node:test";
import assert from "node:assert/strict";
import {
  validateAcademicProfileForm,
  validateAcademicHistoryForm,
} from "../src/utils/academicProfileValidation.js";

test("validateAcademicProfileForm accepts valid academic data", () => {
  const errors = validateAcademicProfileForm({
    student_enrollment: "220170107001",
    student_current_sem: "6",
    student_total_backlog: "0",
    academic_year: "2025-26",
    academic_batch: "2022-2026",
    cgpa: "8.7",
    percentage: "85.2",
    admission_year: "2022",
    expected_graduation_year: "2026",
    academic_status: "Active",
  });
  assert.deepEqual(errors, {});
});

test("validateAcademicProfileForm rejects invalid semester, CGPA, year ordering, and batch", () => {
  const errors = validateAcademicProfileForm({
    student_enrollment: "1",
    student_current_sem: "20",
    student_total_backlog: "-1",
    academic_year: "2025",
    academic_batch: "bad",
    cgpa: "11",
    percentage: "105",
    admission_year: "2025",
    expected_graduation_year: "2022",
    academic_status: "Unknown",
  });

  assert.ok(errors.student_enrollment);
  assert.ok(errors.student_current_sem);
  assert.ok(errors.student_total_backlog);
  assert.ok(errors.academic_year);
  assert.ok(errors.academic_batch);
  assert.ok(errors.cgpa);
  assert.ok(errors.percentage);
  assert.ok(errors.expected_graduation_year);
  assert.ok(errors.academic_status);
});

test("validateAcademicHistoryForm validates required institution, years, and score bounds", () => {
  const bad = validateAcademicHistoryForm({
    stage_type: "12th",
    institution_name: "A",
    start_year: "2023",
    end_year: "2021",
    score_type: "CGPA",
    score_value: "12",
  });

  assert.ok(bad.institution_name);
  assert.ok(bad.end_year);
  assert.ok(bad.score_value);

  const good = validateAcademicHistoryForm({
    stage_type: "12th",
    institution_name: "Bright High School",
    start_year: "2020",
    end_year: "2022",
    score_type: "Percentage",
    score_value: "88.5",
  });
  assert.deepEqual(good, {});
});
