const hasValue = (val) => {
  if (val === null || val === undefined) return false;
  if (typeof val === "object" && val._id) return Boolean(val._id);
  return String(val).trim().length > 0;
};

export const ACADEMIC_COMPLETION_FIELDS = [
  { key: "university_id", label: "University" },
  { key: "college_id", label: "College" },
  { key: "degree_id", label: "Degree / Program" },
  { key: "branch_id", label: "Branch / Department" },
  { key: "student_enrollment", label: "Enrollment Number" },
  { key: "student_current_sem", label: "Current Semester" },
  { key: "academic_year", label: "Academic Year" },
  { key: "academic_batch", label: "Academic Batch" },
  { key: "academic_score", label: "CGPA or Percentage" },
  { key: "academic_history", label: "Academic History" },
];

/**
 * Calculate academic profile completion consistently across API, web, and Flutter.
 */
export const calculateAcademicCompletion = (student, historyCount = 0) => {
  const s = student || {};
  const checks = {
    university_id: hasValue(s.university_id),
    college_id: hasValue(s.college_id),
    degree_id: hasValue(s.degree_id),
    branch_id: hasValue(s.branch_id),
    student_enrollment: hasValue(s.student_enrollment),
    student_current_sem: hasValue(s.student_current_sem),
    academic_year: hasValue(s.academic_year),
    academic_batch: hasValue(s.academic_batch),
    academic_score:
      (s.cgpa !== null && s.cgpa !== undefined && s.cgpa !== "") ||
      (s.percentage !== null && s.percentage !== undefined && s.percentage !== ""),
    academic_history: Number(historyCount) > 0,
  };

  const completed_fields = [];
  const missing_fields = [];

  for (const field of ACADEMIC_COMPLETION_FIELDS) {
    if (checks[field.key]) {
      completed_fields.push({ key: field.key, label: field.label });
    } else {
      missing_fields.push({ key: field.key, label: field.label });
    }
  }

  const total_fields = ACADEMIC_COMPLETION_FIELDS.length;
  const completed_count = completed_fields.length;
  const percentage = Math.round((completed_count / total_fields) * 100);

  return {
    completed_count,
    total_fields,
    percentage,
    completed_fields,
    missing_fields,
    is_complete: completed_count === total_fields,
  };
};
