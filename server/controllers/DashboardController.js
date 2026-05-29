import tbl_student from "../models/StudentModel.js";
import tbl_company from "../models/CompanyModel.js";
import tbl_job from "../models/JobModel.js";
import tbl_application from "../models/ApplicationModel.js";
import tbl_college from "../models/CollegeModel.js";
import tbl_university from "../models/UniversityModel.js";
import tbl_exam from "../models/ExamModel.js";
import tbl_paper from "../models/PaperModel.js";
import { StatusCodes } from "http-status-codes";

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalCompanies,
      totalJobs,
      totalApplications,
      totalColleges,
      totalUniversities,
      totalExams,
      totalPapers,
    ] = await Promise.all([
      tbl_student.countDocuments(),
      tbl_company.countDocuments(),
      tbl_job.countDocuments(),
      tbl_application.countDocuments(),
      tbl_college.countDocuments(),
      tbl_university.countDocuments(),
      tbl_exam.countDocuments(),
      tbl_paper.countDocuments(),
    ]);

    const recentJobs = await tbl_job
      .find()
      .populate("job_company_id")
      .sort("-createdAt")
      .limit(5);

    const recentApplications = await tbl_application
      .find()
      .populate("student_id")
      .populate("job_id")
      .sort("-createdAt")
      .limit(5);

    res.status(StatusCodes.OK).json({
      stats: {
        totalStudents,
        totalCompanies,
        totalJobs,
        totalApplications,
        totalColleges,
        totalUniversities,
        totalExams,
        totalPapers,
      },
      recentJobs,
      recentApplications,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
