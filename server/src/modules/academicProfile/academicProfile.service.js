import mongoose from "mongoose";
import tbl_student from "../student/student.model.js";
import tbl_tpo from "../tpo/tpo.model.js";
import tbl_college from "../college/college.model.js";
import tbl_university from "../university/university.model.js";
import tbl_degree from "../degree/degree.model.js";
import tbl_branch from "../branch/branch.model.js";
import tbl_academic_history from "./academicHistory.model.js";
import tbl_audit_log from "../audit/auditLog.model.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { calculateAcademicCompletion } from "./academicProfile.completion.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/customErrors.js";
import {
  ACADEMIC_HISTORY_STAGE,
  ACADEMIC_HISTORY_STATUS,
  ACADEMIC_STATUS,
  SCORE_TYPE,
} from "../../utils/constants.js";

const STUDENT_PROGRESS_FIELDS = [
  "student_current_sem",
  "student_total_backlog",
  "academic_year",
  "academic_batch",
  "cgpa",
  "percentage",
  "expected_graduation_year",
  "student_skills",
];

const STUDENT_UNVERIFIED_IDENTITY_FIELDS = [
  "university_id",
  "college_id",
  "degree_id",
  "branch_id",
  "student_enrollment",
  "admission_year",
];

const STAFF_EDITABLE_FIELDS = [
  ...STUDENT_PROGRESS_FIELDS,
  ...STUDENT_UNVERIFIED_IDENTITY_FIELDS,
  "academic_status",
];

const HISTORY_EDITABLE_FIELDS = [
  "stage_type",
  "institution_name",
  "board_or_university",
  "program_name",
  "department_name",
  "academic_year",
  "semester_or_year",
  "start_year",
  "end_year",
  "score_type",
  "score_value",
  "status",
  "remarks",
];

const extractId = (val) => {
  if (!val) return null;
  if (typeof val === "object" && val._id) return val._id.toString();
  return String(val);
};

const isSameValue = (a, b) => {
  const normA = a === undefined || a === null ? "" : extractId(a) ?? String(a).trim();
  const normB = b === undefined || b === null ? "" : extractId(b) ?? String(b).trim();
  return normA === normB;
};

const normalizeOptionalNumber = (val) => {
  if (val === undefined) return undefined;
  if (val === null || val === "") return null;
  const num = Number(val);
  return Number.isNaN(num) ? NaN : num;
};

const validateScoreValue = (scoreType, scoreValue) => {
  if (scoreValue === undefined || scoreValue === null || String(scoreValue).trim() === "") {
    return;
  }
  const trimmed = String(scoreValue).trim();
  if (scoreType === SCORE_TYPE.CGPA) {
    const num = Number(trimmed);
    if (Number.isNaN(num) || num < 0 || num > 10) {
      throw new BadRequestError("CGPA score_value must be a number between 0 and 10");
    }
  } else if (scoreType === SCORE_TYPE.PERCENTAGE) {
    const num = Number(trimmed);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      throw new BadRequestError("Percentage score_value must be a number between 0 and 100");
    }
  }
};

export const createAcademicProfileService = (deps = {}) => {
  const Student = deps.Student || tbl_student;
  const Tpo = deps.Tpo || tbl_tpo;
  const College = deps.College || tbl_college;
  const University = deps.University || tbl_university;
  const Degree = deps.Degree || tbl_degree;
  const Branch = deps.Branch || tbl_branch;
  const AcademicHistory = deps.AcademicHistory || tbl_academic_history;
  const AuditLog = deps.AuditLog || tbl_audit_log;
  const isValidObjectId = deps.isValidObjectId || mongoose.isValidObjectId;

  const assertValidId = (id, label = "ID") => {
    if (!id || !isValidObjectId(id)) {
      throw new BadRequestError(`Invalid ${label} format`);
    }
  };

  const resolveActorScope = async (actor) => {
    if (!actor || !actor.userId || !actor.role) {
      throw new UnauthorizedError("Authentication context is required");
    }
    if (actor.role === "Company") {
      throw new UnauthorizedError("Companies are not authorized to access academic profile endpoints");
    }
    if (actor.role === "TPO") {
      const tpo = await Tpo.findById(actor.userId);
      if (!tpo || !tpo.tpo_college_id) {
        throw new UnauthorizedError("TPO college assignment is missing");
      }
      return {
        ...actor,
        tpoCollegeId: tpo.tpo_college_id.toString(),
        tpoDegreeId: tpo.tpo_degree_id ? tpo.tpo_degree_id.toString() : null,
      };
    }
    return actor;
  };

  const assertCanAccessStudent = (scopedActor, student, mode = "read") => {
    if (!student || student.is_deleted) {
      throw new NotFoundError("Student academic profile not found");
    }

    const studentId = extractId(student._id);
    const studentCollegeId = extractId(student.college_id);
    const studentUniversityId = extractId(student.university_id);
    const studentDegreeId = extractId(student.degree_id);

    switch (scopedActor.role) {
      case "Admin":
        return;
      case "Student":
        if (studentId !== String(scopedActor.userId)) {
          throw new UnauthorizedError("You can only access your own academic profile");
        }
        return;
      case "College":
        if (!studentCollegeId || studentCollegeId !== String(scopedActor.userId)) {
          throw new UnauthorizedError("Cross-college academic profile access is denied");
        }
        return;
      case "TPO":
        if (!studentCollegeId || studentCollegeId !== scopedActor.tpoCollegeId) {
          throw new UnauthorizedError("You can only access students from your assigned college");
        }
        if (scopedActor.tpoDegreeId && studentDegreeId !== scopedActor.tpoDegreeId) {
          throw new UnauthorizedError("You can only access students in your assigned degree program");
        }
        return;
      case "University":
        if (!studentUniversityId || studentUniversityId !== String(scopedActor.userId)) {
          throw new UnauthorizedError("Cross-university academic profile access is denied");
        }
        if (mode === "write") {
          throw new UnauthorizedError("University accounts have read-only access to student academic profiles");
        }
        return;
      default:
        throw new UnauthorizedError("Unauthorized role");
    }
  };

  const loadPopulatedStudent = async (studentId) => {
    assertValidId(studentId, "student ID");
    const student = await Student.findById(studentId)
      .populate("university_id", "university_name university_establishment")
      .populate("college_id", "college_name college_code college_university_id")
      .populate("degree_id", "degree_name degree_code degree_sem college_id")
      .populate("branch_id", "branch_name branch_code degree_id college_id");
    if (!student || student.is_deleted) {
      throw new NotFoundError(`No student found with id: ${studentId}`);
    }
    return student;
  };

  const formatAcademicProfilePayload = async (student) => {
    const historyCount = await AcademicHistory.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });
    const completion = calculateAcademicCompletion(student, historyCount);
    const sObj = typeof student.toJSON === "function" ? student.toJSON() : { ...student };

    return {
      academic_profile: {
        student_id: sObj._id,
        student_name: sObj.student_name || "",
        student_email: sObj.student_email || "",
        student_enrollment: sObj.student_enrollment || "",
        university: sObj.university_id || null,
        college: sObj.college_id || null,
        degree: sObj.degree_id || null,
        branch: sObj.branch_id || null,
        university_id: extractId(sObj.university_id),
        college_id: extractId(sObj.college_id),
        degree_id: extractId(sObj.degree_id),
        branch_id: extractId(sObj.branch_id),
        student_current_sem: sObj.student_current_sem || "",
        student_total_backlog: sObj.student_total_backlog ?? "0",
        academic_year: sObj.academic_year || "",
        academic_batch: sObj.academic_batch || "",
        academic_status: sObj.academic_status || ACADEMIC_STATUS.ACTIVE,
        cgpa: sObj.cgpa ?? null,
        percentage: sObj.percentage ?? null,
        admission_year: sObj.admission_year ?? null,
        expected_graduation_year: sObj.expected_graduation_year ?? null,
        student_skills: sObj.student_skills || "",
        isVerifiedByTPO: Boolean(sObj.isVerifiedByTPO),
        academic_profile_initialized: Boolean(sObj.academic_profile_initialized),
        academic_profile_updated_at: sObj.academic_profile_updated_at || sObj.updatedAt || null,
        editable_fields:
          sObj.isVerifiedByTPO
            ? STUDENT_PROGRESS_FIELDS
            : [...STUDENT_PROGRESS_FIELDS, ...STUDENT_UNVERIFIED_IDENTITY_FIELDS],
      },
      completion,
      history_count: historyCount,
    };
  };

  const pickAllowedUpdateFields = (scopedActor, student, payload) => {
    if (!payload || typeof payload !== "object") {
      throw new BadRequestError("Request body must be a JSON object");
    }

    const allowedForRole =
      scopedActor.role === "Student"
        ? student.isVerifiedByTPO
          ? new Set(STUDENT_PROGRESS_FIELDS)
          : new Set([...STUDENT_PROGRESS_FIELDS, ...STUDENT_UNVERIFIED_IDENTITY_FIELDS])
        : new Set(STAFF_EDITABLE_FIELDS);

    const lockedForVerifiedStudent = new Set([
      ...STUDENT_UNVERIFIED_IDENTITY_FIELDS,
      "academic_status",
    ]);
    const protectedSystemFields = new Set([
      "isVerifiedByTPO",
      "student_status",
      "role",
      "student_password",
      "is_deleted",
      "deleted_at",
      "_id",
    ]);

    const updates = {};

    for (const [key, rawVal] of Object.entries(payload)) {
      if (key === "record_transition") continue;
      if (protectedSystemFields.has(key)) {
        throw new UnauthorizedError(`Field '${key}' cannot be modified directly`);
      }

      if (!allowedForRole.has(key)) {
        // If student is verified and resends unchanged locked value, skip safely; if changed, reject!
        if (scopedActor.role === "Student" && lockedForVerifiedStudent.has(key)) {
          if (!isSameValue(rawVal, student[key])) {
            throw new UnauthorizedError(
              `Field '${key}' is locked after TPO verification. Contact your College or TPO to update it.`,
            );
          }
          continue;
        }
        continue;
      }

      // College/TPO cannot move a student out of their scoped college (or TPO degree)
      if (scopedActor.role === "College" && key === "college_id" && rawVal) {
        if (String(rawVal) !== String(scopedActor.userId)) {
          throw new UnauthorizedError("College staff cannot reassign a student to another college");
        }
      }
      if (scopedActor.role === "TPO") {
        if (key === "college_id" && rawVal && String(rawVal) !== scopedActor.tpoCollegeId) {
          throw new UnauthorizedError("TPO cannot reassign a student to another college");
        }
        if (
          key === "degree_id" &&
          scopedActor.tpoDegreeId &&
          rawVal &&
          String(rawVal) !== scopedActor.tpoDegreeId
        ) {
          throw new UnauthorizedError("TPO cannot assign a student outside their assigned degree");
        }
      }

      if (["cgpa", "percentage", "admission_year", "expected_graduation_year"].includes(key)) {
        const num = normalizeOptionalNumber(rawVal);
        if (Number.isNaN(num)) {
          throw new BadRequestError(`Field '${key}' must be a valid number`);
        }
        updates[key] = num;
      } else if (key === "student_total_backlog" || key === "student_current_sem") {
        updates[key] = rawVal === null || rawVal === undefined ? "" : String(rawVal).trim();
      } else if (typeof rawVal === "string") {
        updates[key] = rawVal.trim();
      } else {
        updates[key] = rawVal;
      }
    }

    return updates;
  };

  const validateAcademicRelationships = async (student, updates) => {
    const mergedUniversityId =
      updates.university_id !== undefined ? extractId(updates.university_id) : extractId(student.university_id);
    const mergedCollegeId =
      updates.college_id !== undefined ? extractId(updates.college_id) : extractId(student.college_id);
    const mergedDegreeId =
      updates.degree_id !== undefined ? extractId(updates.degree_id) : extractId(student.degree_id);
    const mergedBranchId =
      updates.branch_id !== undefined ? extractId(updates.branch_id) : extractId(student.branch_id);

    let universityDoc = null;
    let collegeDoc = null;
    let degreeDoc = null;
    let branchDoc = null;

    if (mergedUniversityId) {
      assertValidId(mergedUniversityId, "university ID");
      universityDoc = await University.findById(mergedUniversityId);
      if (!universityDoc) {
        throw new BadRequestError("Selected university does not exist");
      }
    }

    if (mergedCollegeId) {
      assertValidId(mergedCollegeId, "college ID");
      collegeDoc = await College.findById(mergedCollegeId);
      if (!collegeDoc) {
        throw new BadRequestError("Selected college does not exist");
      }
      if (
        mergedUniversityId &&
        collegeDoc.college_university_id &&
        collegeDoc.college_university_id.toString() !== mergedUniversityId
      ) {
        throw new BadRequestError("Selected college does not belong to the selected university");
      }
    }

    if (mergedDegreeId) {
      assertValidId(mergedDegreeId, "degree ID");
      degreeDoc = await Degree.findById(mergedDegreeId);
      if (!degreeDoc) {
        throw new BadRequestError("Selected degree does not exist");
      }
      if (mergedCollegeId && degreeDoc.college_id && degreeDoc.college_id.toString() !== mergedCollegeId) {
        throw new BadRequestError("Selected degree does not belong to the selected college");
      }
    }

    if (mergedBranchId) {
      assertValidId(mergedBranchId, "branch ID");
      branchDoc = await Branch.findById(mergedBranchId);
      if (!branchDoc) {
        throw new BadRequestError("Selected branch does not exist");
      }
      if (mergedDegreeId && branchDoc.degree_id && branchDoc.degree_id.toString() !== mergedDegreeId) {
        throw new BadRequestError("Selected branch does not belong to the selected degree");
      }
      if (mergedCollegeId && branchDoc.college_id && branchDoc.college_id.toString() !== mergedCollegeId) {
        throw new BadRequestError("Selected branch does not belong to the selected college");
      }
    }

    const semVal =
      updates.student_current_sem !== undefined ? updates.student_current_sem : student.student_current_sem;
    if (semVal !== undefined && semVal !== null && String(semVal).trim() !== "") {
      const semNum = Number(semVal);
      const maxSem = Number(degreeDoc?.degree_sem) || 12;
      if (!Number.isInteger(semNum) || semNum < 1 || semNum > maxSem) {
        throw new BadRequestError(`Current semester must be an integer between 1 and ${maxSem}`);
      }
    }

    const backlogVal =
      updates.student_total_backlog !== undefined ? updates.student_total_backlog : student.student_total_backlog;
    if (backlogVal !== undefined && backlogVal !== null && String(backlogVal).trim() !== "") {
      const backlogNum = Number(backlogVal);
      if (!Number.isInteger(backlogNum) || backlogNum < 0 || backlogNum > 50) {
        throw new BadRequestError("Total backlogs must be an integer between 0 and 50");
      }
    }

    const cgpaVal = updates.cgpa !== undefined ? updates.cgpa : student.cgpa;
    if (cgpaVal !== null && cgpaVal !== undefined && (cgpaVal < 0 || cgpaVal > 10)) {
      throw new BadRequestError("CGPA must be between 0 and 10");
    }

    const pctVal = updates.percentage !== undefined ? updates.percentage : student.percentage;
    if (pctVal !== null && pctVal !== undefined && (pctVal < 0 || pctVal > 100)) {
      throw new BadRequestError("Percentage must be between 0 and 100");
    }

    const admYear = updates.admission_year !== undefined ? updates.admission_year : student.admission_year;
    const gradYear =
      updates.expected_graduation_year !== undefined
        ? updates.expected_graduation_year
        : student.expected_graduation_year;
    if (admYear && gradYear && Number(gradYear) < Number(admYear)) {
      throw new BadRequestError("Expected graduation year cannot be earlier than admission year");
    }

    const enrollmentVal =
      updates.student_enrollment !== undefined ? updates.student_enrollment : student.student_enrollment;
    if (enrollmentVal && mergedCollegeId) {
      const escaped = String(enrollmentVal).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const duplicate = await Student.findOne({
        _id: { $ne: student._id },
        college_id: mergedCollegeId,
        is_deleted: { $ne: true },
        student_enrollment: { $regex: `^${escaped}$`, $options: "i" },
      });
      if (duplicate) {
        throw new BadRequestError(
          `Enrollment number '${enrollmentVal}' is already assigned to another student in this college`,
        );
      }
    }
  };

  const maybeRecordStageTransition = async (scopedActor, student, updates) => {
    const programChanged =
      (updates.college_id && !isSameValue(updates.college_id, student.college_id)) ||
      (updates.degree_id && !isSameValue(updates.degree_id, student.degree_id)) ||
      (updates.branch_id && !isSameValue(updates.branch_id, student.branch_id));

    if (!programChanged) return null;

    const prevInstitution =
      student.college_id?.college_name || student.university_id?.university_name || "Previous College";
    const startYear = student.admission_year || new Date(student.createdAt || Date.now()).getFullYear();

    return AcademicHistory.create({
      student_id: student._id,
      college_id: extractId(student.college_id),
      university_id: extractId(student.university_id),
      degree_id: extractId(student.degree_id),
      branch_id: extractId(student.branch_id),
      stage_type: ACADEMIC_HISTORY_STAGE.PREVIOUS_ENROLLMENT,
      institution_name: prevInstitution,
      board_or_university: student.university_id?.university_name || "",
      program_name: student.degree_id?.degree_name || "",
      department_name: student.branch_id?.branch_name || "",
      academic_year: student.academic_year || "",
      semester_or_year: student.student_current_sem ? `Semester ${student.student_current_sem}` : "",
      start_year: startYear,
      end_year: new Date().getFullYear(),
      score_type: student.cgpa != null ? SCORE_TYPE.CGPA : SCORE_TYPE.PERCENTAGE,
      score_value:
        student.cgpa != null
          ? String(student.cgpa)
          : student.percentage != null
            ? String(student.percentage)
            : "",
      status: ACADEMIC_HISTORY_STATUS.TRANSFERRED,
      remarks: "Auto-archived on program/college transfer",
      is_locked: true,
      created_by_id: scopedActor.userId,
      created_by_role: scopedActor.role,
    });
  };

  const getAcademicProfile = async (actor, targetStudentId) => {
    const scopedActor = await resolveActorScope(actor);
    const student = await loadPopulatedStudent(targetStudentId);
    assertCanAccessStudent(scopedActor, student, "read");
    return formatAcademicProfilePayload(student);
  };

  const initializeAcademicProfile = async (actor, targetStudentId, payload, reqMeta = {}) => {
    const scopedActor = await resolveActorScope(actor);
    const student = await loadPopulatedStudent(targetStudentId);
    assertCanAccessStudent(scopedActor, student, "write");

    if (student.academic_profile_initialized) {
      throw new BadRequestError("Academic profile is already initialized. Use PATCH to update.");
    }

    const updates = pickAllowedUpdateFields(scopedActor, student, payload);
    await validateAcademicRelationships(student, updates);

    updates.academic_profile_initialized = true;
    updates.academic_profile_updated_at = new Date();

    const updatedStudent = await Student.findByIdAndUpdate(student._id, { $set: updates }, { new: true })
      .populate("university_id", "university_name university_establishment")
      .populate("college_id", "college_name college_code college_university_id")
      .populate("degree_id", "degree_name degree_code degree_sem college_id")
      .populate("branch_id", "branch_name branch_code degree_id college_id");

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_student",
        targetId: student._id,
        collegeId: extractId(updatedStudent.college_id),
        universityId: extractId(updatedStudent.university_id),
        action: "CREATE_ACADEMIC_PROFILE",
        changedFields: Object.keys(updates),
        previousValues: {},
        newValues: updates,
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    return formatAcademicProfilePayload(updatedStudent);
  };

  const updateAcademicProfile = async (actor, targetStudentId, payload, reqMeta = {}) => {
    const scopedActor = await resolveActorScope(actor);
    const student = await loadPopulatedStudent(targetStudentId);
    assertCanAccessStudent(scopedActor, student, "write");

    const updates = pickAllowedUpdateFields(scopedActor, student, payload);
    const changedFields = Object.keys(updates).filter((key) => !isSameValue(updates[key], student[key]));

    if (changedFields.length === 0 && student.academic_profile_initialized) {
      return formatAcademicProfilePayload(student);
    }

    await validateAcademicRelationships(student, updates);

    if (scopedActor.role !== "Student") {
      await maybeRecordStageTransition(scopedActor, student, updates);
    }

    const previousValues = {};
    const newValues = {};
    for (const field of changedFields) {
      previousValues[field] = extractId(student[field]) ?? student[field] ?? null;
      newValues[field] = extractId(updates[field]) ?? updates[field] ?? null;
    }

    updates.academic_profile_initialized = true;
    updates.academic_profile_updated_at = new Date();

    const updatedStudent = await Student.findByIdAndUpdate(student._id, { $set: updates }, { new: true })
      .populate("university_id", "university_name university_establishment")
      .populate("college_id", "college_name college_code college_university_id")
      .populate("degree_id", "degree_name degree_code degree_sem college_id")
      .populate("branch_id", "branch_name branch_code degree_id college_id");

    if (changedFields.length > 0) {
      await recordAuditLog(
        {
          actorId: scopedActor.userId,
          actorRole: scopedActor.role,
          targetUserId: student._id,
          targetModel: "tbl_student",
          targetId: student._id,
          collegeId: extractId(updatedStudent.college_id),
          universityId: extractId(updatedStudent.university_id),
          action: "UPDATE_ACADEMIC_PROFILE",
          changedFields,
          previousValues,
          newValues,
          ipAddress: reqMeta.ip || "",
          userAgent: reqMeta.userAgent || "",
        },
        AuditLog,
      );
    }

    return formatAcademicProfilePayload(updatedStudent);
  };

  const getCompletion = async (actor, targetStudentId) => {
    const scopedActor = await resolveActorScope(actor);
    const student = await loadPopulatedStudent(targetStudentId);
    assertCanAccessStudent(scopedActor, student, "read");
    const historyCount = await AcademicHistory.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });
    return {
      student_id: student._id,
      completion: calculateAcademicCompletion(student, historyCount),
    };
  };

  const getAcademicHistory = async (actor, targetStudentId, { page = 1, limit = 20 } = {}) => {
    const scopedActor = await resolveActorScope(actor);
    const student = await loadPopulatedStudent(targetStudentId);
    assertCanAccessStudent(scopedActor, student, "read");

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const filter = { student_id: student._id, is_deleted: false };

    const [history, total] = await Promise.all([
      AcademicHistory.find(filter)
        .sort({ start_year: -1, createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      AcademicHistory.countDocuments(filter),
    ]);

    return {
      history,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        total_pages: Math.ceil(total / safeLimit) || 1,
      },
    };
  };

  const addAcademicHistory = async (actor, targetStudentId, payload, reqMeta = {}) => {
    const scopedActor = await resolveActorScope(actor);
    const student = await loadPopulatedStudent(targetStudentId);
    assertCanAccessStudent(scopedActor, student, "write");

    if (
      scopedActor.role === "Student" &&
      payload.stage_type === ACADEMIC_HISTORY_STAGE.PREVIOUS_ENROLLMENT
    ) {
      throw new UnauthorizedError("Only College, TPO, or Admin can record institutional transfer history");
    }

    const startYear = Number(payload.start_year);
    const endYear =
      payload.end_year !== undefined && payload.end_year !== null && payload.end_year !== ""
        ? Number(payload.end_year)
        : null;

    if (endYear !== null && endYear < startYear) {
      throw new BadRequestError("End year cannot be earlier than start year");
    }

    const scoreType = payload.score_type || SCORE_TYPE.PERCENTAGE;
    validateScoreValue(scoreType, payload.score_value);

    const recordData = {
      student_id: student._id,
      stage_type: payload.stage_type,
      institution_name: String(payload.institution_name || "").trim(),
      board_or_university: String(payload.board_or_university || "").trim(),
      program_name: String(payload.program_name || "").trim(),
      department_name: String(payload.department_name || "").trim(),
      academic_year: String(payload.academic_year || "").trim(),
      semester_or_year: String(payload.semester_or_year || "").trim(),
      start_year: startYear,
      end_year: endYear,
      score_type: scoreType,
      score_value: String(payload.score_value || "").trim(),
      status: payload.status || ACADEMIC_HISTORY_STATUS.COMPLETED,
      remarks: String(payload.remarks || "").trim(),
      is_locked: scopedActor.role !== "Student" && Boolean(payload.is_locked),
      created_by_id: scopedActor.userId,
      created_by_role: scopedActor.role,
    };

    const duplicate = await AcademicHistory.findOne({
      student_id: student._id,
      is_deleted: false,
      stage_type: recordData.stage_type,
      institution_name: {
        $regex: `^${recordData.institution_name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
      start_year: recordData.start_year,
    });
    if (duplicate) {
      throw new BadRequestError("An academic history record with the same stage, institution, and start year already exists");
    }

    const entry = await AcademicHistory.create(recordData);

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_academic_history",
        targetId: entry._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "ADD_ACADEMIC_HISTORY",
        changedFields: Object.keys(recordData),
        previousValues: {},
        newValues: recordData,
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const historyCount = await AcademicHistory.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });

    return {
      entry,
      completion: calculateAcademicCompletion(student, historyCount),
    };
  };

  const updateAcademicHistory = async (actor, targetStudentId, historyId, payload, reqMeta = {}) => {
    const scopedActor = await resolveActorScope(actor);
    const student = await loadPopulatedStudent(targetStudentId);
    assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(historyId, "academic history ID");

    const existing = await AcademicHistory.findOne({
      _id: historyId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Academic history record not found");
    }

    if (existing.is_locked && scopedActor.role === "Student") {
      throw new UnauthorizedError("This verified/archived academic history record cannot be modified");
    }

    const updates = {};
    for (const key of HISTORY_EDITABLE_FIELDS) {
      if (payload[key] === undefined) continue;
      if (key === "start_year") {
        updates.start_year = Number(payload.start_year);
      } else if (key === "end_year") {
        updates.end_year =
          payload.end_year === null || payload.end_year === "" ? null : Number(payload.end_year);
      } else if (typeof payload[key] === "string") {
        updates[key] = payload[key].trim();
      } else {
        updates[key] = payload[key];
      }
    }

    const mergedStart = updates.start_year !== undefined ? updates.start_year : existing.start_year;
    const mergedEnd = updates.end_year !== undefined ? updates.end_year : existing.end_year;
    if (mergedEnd !== null && mergedEnd !== undefined && mergedEnd < mergedStart) {
      throw new BadRequestError("End year cannot be earlier than start year");
    }

    const mergedScoreType = updates.score_type || existing.score_type;
    const mergedScoreValue = updates.score_value !== undefined ? updates.score_value : existing.score_value;
    validateScoreValue(mergedScoreType, mergedScoreValue);

    updates.updated_by_id = scopedActor.userId;
    updates.updated_by_role = scopedActor.role;

    const previousValues = {};
    const newValues = {};
    const changedFields = Object.keys(updates).filter(
      (k) => !["updated_by_id", "updated_by_role"].includes(k) && !isSameValue(updates[k], existing[k]),
    );
    for (const f of changedFields) {
      previousValues[f] = existing[f] ?? null;
      newValues[f] = updates[f] ?? null;
    }

    const updated = await AcademicHistory.findByIdAndUpdate(existing._id, { $set: updates }, { new: true });

    if (changedFields.length > 0) {
      await recordAuditLog(
        {
          actorId: scopedActor.userId,
          actorRole: scopedActor.role,
          targetUserId: student._id,
          targetModel: "tbl_academic_history",
          targetId: existing._id,
          collegeId: extractId(student.college_id),
          universityId: extractId(student.university_id),
          action: "UPDATE_ACADEMIC_HISTORY",
          changedFields,
          previousValues,
          newValues,
          ipAddress: reqMeta.ip || "",
          userAgent: reqMeta.userAgent || "",
        },
        AuditLog,
      );
    }

    return { entry: updated };
  };

  const deleteAcademicHistory = async (actor, targetStudentId, historyId, reqMeta = {}) => {
    const scopedActor = await resolveActorScope(actor);
    const student = await loadPopulatedStudent(targetStudentId);
    assertCanAccessStudent(scopedActor, student, "write");
    assertValidId(historyId, "academic history ID");

    const existing = await AcademicHistory.findOne({
      _id: historyId,
      student_id: student._id,
      is_deleted: false,
    });
    if (!existing) {
      throw new NotFoundError("Academic history record not found");
    }

    if (existing.is_locked && scopedActor.role === "Student") {
      throw new UnauthorizedError("This verified/archived academic history record cannot be deleted");
    }

    existing.is_deleted = true;
    existing.deleted_at = new Date();
    existing.deleted_by_id = scopedActor.userId;
    existing.deleted_by_role = scopedActor.role;
    await existing.save();

    await recordAuditLog(
      {
        actorId: scopedActor.userId,
        actorRole: scopedActor.role,
        targetUserId: student._id,
        targetModel: "tbl_academic_history",
        targetId: existing._id,
        collegeId: extractId(student.college_id),
        universityId: extractId(student.university_id),
        action: "DELETE_ACADEMIC_HISTORY",
        changedFields: ["is_deleted"],
        previousValues: { is_deleted: false, stage_type: existing.stage_type, institution_name: existing.institution_name },
        newValues: { is_deleted: true },
        ipAddress: reqMeta.ip || "",
        userAgent: reqMeta.userAgent || "",
      },
      AuditLog,
    );

    const historyCount = await AcademicHistory.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });

    return {
      deleted: true,
      history_id: existing._id,
      completion: calculateAcademicCompletion(student, historyCount),
    };
  };

  const getAuditLogs = async (actor, targetStudentId, { page = 1, limit = 20 } = {}) => {
    const scopedActor = await resolveActorScope(actor);
    const student = await loadPopulatedStudent(targetStudentId);
    assertCanAccessStudent(scopedActor, student, "read");

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const filter = { target_user_id: student._id };

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        total_pages: Math.ceil(total / safeLimit) || 1,
      },
    };
  };

  return {
    resolveActorScope,
    assertCanAccessStudent,
    resolveStudentInstituteId: (student) => extractId(student?.college_id),
    resolveActorInstituteId: (scopedActor) =>
      scopedActor?.role === "College"
        ? String(scopedActor.userId || "")
        : scopedActor?.role === "TPO"
          ? String(scopedActor.tpoCollegeId || "")
          : null,
    pickAllowedUpdateFields,
    validateAcademicRelationships,
    getAcademicProfile,
    initializeAcademicProfile,
    updateAcademicProfile,
    getCompletion,
    getAcademicHistory,
    addAcademicHistory,
    updateAcademicHistory,
    deleteAcademicHistory,
    getAuditLogs,
  };
};

export const academicProfileService = createAcademicProfileService();
