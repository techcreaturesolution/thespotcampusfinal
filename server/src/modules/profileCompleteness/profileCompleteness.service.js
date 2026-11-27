import { NotFoundError, UnauthorizedError } from "../../errors/customErrors.js";
import Student from "../student/student.model.js";
import AcademicHistory from "../academicProfile/academicHistory.model.js";
import StudentSkill from "../skills/studentSkill.model.js";
import Project from "../projects/project.model.js";
import ProjectLink from "../projects/projectLink.model.js";
import Certification from "../certifications/certification.model.js";
import Internship from "../internships/internship.model.js";
import ResumeVersion from "../resumeVersions/resumeVersion.model.js";
import DocumentModel from "../documents/document.model.js";
import { academicProfileService } from "../academicProfile/academicProfile.service.js";
import {
  PROFILE_COMPLETENESS_FORMULA_VERSION,
  PROFILE_COMPLETENESS_SECTIONS,
} from "./profileCompleteness.config.js";
import { calculateUnifiedProfileCompleteness } from "./profileCompleteness.calculator.js";

export const createProfileCompletenessService = ({
  studentModel = Student,
  academicHistoryModel = AcademicHistory,
  studentSkillModel = StudentSkill,
  projectModel = Project,
  projectLinkModel = ProjectLink,
  certificationModel = Certification,
  internshipModel = Internship,
  resumeVersionModel = ResumeVersion,
  documentModel = DocumentModel,
  resolveActorScope = academicProfileService.resolveActorScope,
  assertCanAccessStudent = academicProfileService.assertCanAccessStudent,
} = {}) => {
  const getStudentCompleteness = async (actor, targetStudentId) => {
    const scopedActor = await resolveActorScope(actor);
    const student = await studentModel.findById(targetStudentId).lean();

    if (!student || student.is_deleted === true) {
      throw new NotFoundError("Student profile not found");
    }

    assertCanAccessStudent(scopedActor, student, "read");

    const studentObjectId = student._id;

    // Single parallel batch of lean queries across canonical S1-01..S1-09 collections (zero N+1)
    const [
      activeAcademicHistoryCount,
      studentSkills,
      projects,
      projectLinks,
      certifications,
      internships,
      resumeVersions,
      documents,
    ] = await Promise.all([
      academicHistoryModel.countDocuments({ student_id: studentObjectId, is_deleted: false }),
      studentSkillModel
        .find({ student_id: studentObjectId, is_deleted: false })
        .select("skill_id proficiency is_deleted")
        .populate("skill_id", "name is_active is_deleted")
        .lean(),
      projectModel
        .find({ student_id: studentObjectId, is_deleted: false })
        .select("_id title description status repository_url live_demo_url project_url is_deleted")
        .lean(),
      projectLinkModel
        .find({ student_id: studentObjectId, is_deleted: false })
        .select("project_id url link_type is_deleted")
        .lean(),
      certificationModel
        .find({ student_id: studentObjectId, is_deleted: false })
        .select("title issuing_organization issue_date status is_deleted")
        .lean(),
      internshipModel
        .find({ student_id: studentObjectId, is_deleted: false })
        .select("role_title organization_name start_date status is_deleted")
        .lean(),
      resumeVersionModel
        .find({ student_id: studentObjectId, is_deleted: false })
        .select("name status is_default is_deleted")
        .lean(),
      documentModel
        .find({ owner_id: studentObjectId, is_deleted: false })
        .select("document_type status malware_scan_status file_size original_filename title is_deleted")
        .lean(),
    ]);

    const completeness = calculateUnifiedProfileCompleteness({
      student,
      role: student.role || "Student",
      activeAcademicHistoryCount,
      studentSkills,
      projects,
      projectLinks,
      certifications,
      internships,
      resumeVersions,
      documents,
    });

    return {
      student_id: studentObjectId,
      completeness,
    };
  };

  const getMyCompleteness = async (actor) => {
    if (!actor || !actor.userId) {
      throw new UnauthorizedError("Authentication required");
    }
    if (actor.role !== "Student") {
      return {
        student_id: null,
        completeness: calculateUnifiedProfileCompleteness({
          student: null,
          role: actor.role,
        }),
      };
    }
    return getStudentCompleteness(actor, actor.userId);
  };

  const getRulesMetadata = () => ({
    formula_version: PROFILE_COMPLETENESS_FORMULA_VERSION,
    sections: PROFILE_COMPLETENESS_SECTIONS,
  });

  return {
    getMyCompleteness,
    getStudentCompleteness,
    getRulesMetadata,
  };
};

export const profileCompletenessService = createProfileCompletenessService();
