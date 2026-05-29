import tbl_student from "../student/student.model.js";
import tbl_company from "../company/company.model.js";
import tbl_job from "../job/job.model.js";
import tbl_application from "../application/application.model.js";
import tbl_college from "../college/college.model.js";
import tbl_university from "../university/university.model.js";
import tbl_exam from "../exam/exam.model.js";
import tbl_paper from "../exam/paper.model.js";
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
