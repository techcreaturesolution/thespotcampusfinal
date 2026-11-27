export const ACADEMIC_STATUS_OPTIONS = [
  "Active",
  "Completed",
  "On Hold",
  "Detained",
  "Dropped",
];

export const HISTORY_STAGE_OPTIONS = [
  "10th",
  "12th",
  "Diploma",
  "Undergraduate",
  "Postgraduate",
  "Other",
];

export const HISTORY_STATUS_OPTIONS = [
  "Completed",
  "Transferred",
  "Pursuing",
  "Discontinued",
];

export const SCORE_TYPE_OPTIONS = ["Percentage", "CGPA", "Grade"];

const ACADEMIC_YEAR_REGEX = /^(19|20)\d{2}-(\d{2}|(19|20)\d{2})$/;
const BATCH_REGEX = /^((19|20)\d{2}-(19|20)\d{2}|(19|20)\d{2}-\d{2}|(19|20)\d{2})$/;
const ENROLLMENT_REGEX = /^[a-zA-Z0-9/\-\s]{3,30}$/;

export const validateAcademicProfileForm = (form) => {
  const errors = {};

  if (form.student_enrollment && !ENROLLMENT_REGEX.test(String(form.student_enrollment).trim())) {
    errors.student_enrollment = "Enrollment number must be 3–30 valid characters (letters, numbers, /, -)";
  }

  if (form.student_current_sem !== "" && form.student_current_sem !== null && form.student_current_sem !== undefined) {
    const sem = Number(form.student_current_sem);
    if (!Number.isInteger(sem) || sem < 1 || sem > 16) {
      errors.student_current_sem = "Current semester must be a whole number between 1 and 16";
    }
  }

  if (form.student_total_backlog !== "" && form.student_total_backlog !== null && form.student_total_backlog !== undefined) {
    const backlogs = Number(form.student_total_backlog);
    if (!Number.isInteger(backlogs) || backlogs < 0 || backlogs > 50) {
      errors.student_total_backlog = "Total backlogs must be a whole number between 0 and 50";
    }
  }

  if (form.academic_year && !ACADEMIC_YEAR_REGEX.test(String(form.academic_year).trim())) {
    errors.academic_year = "Use format YYYY-YY or YYYY-YYYY (e.g. 2025-26)";
  }

  if (form.academic_batch && !BATCH_REGEX.test(String(form.academic_batch).trim())) {
    errors.academic_batch = "Use a valid batch year or range (e.g. 2022-2026)";
  }

  if (form.cgpa !== "" && form.cgpa !== null && form.cgpa !== undefined) {
    const cgpa = Number(form.cgpa);
    if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      errors.cgpa = "CGPA must be between 0 and 10";
    }
  }

  if (form.percentage !== "" && form.percentage !== null && form.percentage !== undefined) {
    const pct = Number(form.percentage);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      errors.percentage = "Percentage must be between 0 and 100";
    }
  }

  if (form.admission_year !== "" && form.admission_year !== null && form.admission_year !== undefined) {
    const adm = Number(form.admission_year);
    if (!Number.isInteger(adm) || adm < 1990 || adm > 2100) {
      errors.admission_year = "Admission year must be between 1990 and 2100";
    }
  }

  if (form.expected_graduation_year !== "" && form.expected_graduation_year !== null && form.expected_graduation_year !== undefined) {
    const grad = Number(form.expected_graduation_year);
    if (!Number.isInteger(grad) || grad < 1990 || grad > 2100) {
      errors.expected_graduation_year = "Graduation year must be between 1990 and 2100";
    } else if (
      form.admission_year !== "" &&
      form.admission_year !== null &&
      form.admission_year !== undefined &&
      grad < Number(form.admission_year)
    ) {
      errors.expected_graduation_year = "Expected graduation year cannot be earlier than admission year";
    }
  }

  if (form.academic_status && !ACADEMIC_STATUS_OPTIONS.includes(form.academic_status)) {
    errors.academic_status = "Invalid academic status selected";
  }

  return errors;
};

export const validateAcademicHistoryForm = (form) => {
  const errors = {};

  if (!form.stage_type) {
    errors.stage_type = "Stage type is required";
  }

  if (!form.institution_name || String(form.institution_name).trim().length < 2) {
    errors.institution_name = "Institution name must be at least 2 characters";
  }

  const startYear = Number(form.start_year);
  if (!form.start_year || !Number.isInteger(startYear) || startYear < 1970 || startYear > 2100) {
    errors.start_year = "Start year must be between 1970 and 2100";
  }

  if (form.end_year !== "" && form.end_year !== null && form.end_year !== undefined) {
    const endYear = Number(form.end_year);
    if (!Number.isInteger(endYear) || endYear < 1970 || endYear > 2100) {
      errors.end_year = "End year must be between 1970 and 2100";
    } else if (!errors.start_year && endYear < startYear) {
      errors.end_year = "End year cannot be earlier than start year";
    }
  }

  if (form.academic_year && !ACADEMIC_YEAR_REGEX.test(String(form.academic_year).trim())) {
    errors.academic_year = "Use format YYYY-YY or YYYY-YYYY";
  }

  if (form.score_value !== undefined && form.score_value !== null && String(form.score_value).trim() !== "") {
    const val = String(form.score_value).trim();
    if (form.score_type === "CGPA") {
      const num = Number(val);
      if (Number.isNaN(num) || num < 0 || num > 10) {
        errors.score_value = "CGPA must be between 0 and 10";
      }
    } else if (form.score_type === "Percentage") {
      const num = Number(val);
      if (Number.isNaN(num) || num < 0 || num > 100) {
        errors.score_value = "Percentage must be between 0 and 100";
      }
    }
  }

  return errors;
};
