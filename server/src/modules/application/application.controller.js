import tbl_application from "./application.model.js";
import tbl_student from "../student/student.model.js";
import tbl_exam from "../exam/exam.model.js";
import tbl_jobpost from "../job/job.model.js";
import tbl_payment from "../subscription/payment.model.js";
import tbl_tpo from "../tpo/tpo.model.js";
import tbl_resume from "../student/resume.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";

export const getAllApplications = async (req, res) => {
  try {
    const applications = await tbl_application
      .find({ job_id: req.params.id })
      .populate({
        path: "student_id",
        populate: [
          { path: "college_id", select: "college_name" },
          { path: "university_id", select: "university_name" },
          { path: "degree_id", select: "degree_name" },
          { path: "branch_id", select: "branch_name" },
        ]
      })
      .sort("-createdAt");

    let filteredApplications = applications;
    if (req.user && req.user.role === "TPO") {
      const tpo = await tbl_tpo.findById(req.user.userId);
      if (tpo && tpo.tpo_degree_id) {
        filteredApplications = applications.filter((app) => {
          return (
            app.student_id &&
            app.student_id.degree_id &&
            app.student_id.degree_id.toString() === tpo.tpo_degree_id.toString()
          );
        });
      }
    }

    res.status(StatusCodes.OK).json({ applications: filteredApplications });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createApplication = async (req, res) => {
  try {
    const job = await tbl_jobpost.findById(req.params.id);
    if (!job || job.job_status === "0") {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "This job opening is no longer accepting applications" });
    }

    // Check if the student has already applied to this job
    const existingApplication = await tbl_application.findOne({
      student_id: req.user.userId,
      job_id: req.params.id,
    });
    if (existingApplication) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "You have already applied for this job" });
    }

    // Check if the student has an active paid subscription plan
    const now = new Date();
    const activePayment = await tbl_payment.findOne({
      user_id: req.user.userId,
      status: "Paid",
      expires_at: { $gt: now },
    });

    if (!activePayment) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: "payment_required",
        msg: "An active student plan subscription is required to apply for job openings.",
      });
    }

    // Check if the student has generated and compiled a CV
    const resume = await tbl_resume.findOne({ student_id: req.user.userId });
    if (!resume || !resume.ai_compiled_html) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "cv_required",
        msg: "You must generate and save your CV to your profile before applying.",
      });
    }

    req.body.student_id = req.user.userId;
    req.body.job_id = req.params.id;
    const application = await tbl_application.create(req.body);
    res.status(StatusCodes.CREATED).json({ application });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedApplication = await tbl_application.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );
    if (!updatedApplication) throw new NotFoundError(`No application with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Application updated", application: updatedApplication });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const removedApplication = await tbl_application.findByIdAndDelete(id);
    if (!removedApplication) throw new NotFoundError(`No application with id: ${id}`);
    res.status(StatusCodes.OK).json({ msg: "Application deleted", application: removedApplication });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getStudentApplications = async (req, res) => {
  try {
    const applications = await tbl_application
      .find({ student_id: req.user.userId })
      .populate({
        path: "job_id",
        populate: {
          path: "job_company_id",
          model: "tbl_company",
        },
      })
      .sort("-createdAt");

    const jobIds = applications.map((app) => app.job_id?._id).filter(Boolean);
    const exams = await tbl_exam.find({ job_id: { $in: jobIds } });
    const examJobIds = new Set(exams.map((exam) => exam.job_id.toString()));

    const applicationsWithExamInfo = applications.map((app) => {
      const appObj = app.toObject();
      const jobActive = app.job_id && app.job_id.job_status !== "0";
      appObj.hasExam = jobActive ? examJobIds.has(app.job_id._id.toString()) : false;
      return appObj;
    });

    res.status(StatusCodes.OK).json({ applications: applicationsWithExamInfo });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getCompanyApplications = async (req, res) => {
  try {
    const jobs = await tbl_jobpost.find({ job_company_id: req.user.userId }).select("_id");
    const jobIds = jobs.map((job) => job._id);

    const applications = await tbl_application
      .find({ job_id: { $in: jobIds } })
      .populate({
        path: "student_id",
        populate: [
          { path: "college_id", select: "college_name" },
          { path: "university_id", select: "university_name" },
          { path: "degree_id", select: "degree_name" },
          { path: "branch_id", select: "branch_name" },
        ]
      })
      .populate("job_id", "job_title job_position")
      .sort("-createdAt");

    // Hide/Sanitize student contact details for company privacy
    const sanitizedApplications = applications.map((app) => {
      const appObj = app.toObject();
      if (appObj.student_id) {
        appObj.student_id.student_email = "";
        appObj.student_id.student_contact = "";
      }
      return appObj;
    });

    res.status(StatusCodes.OK).json({ applications: sanitizedApplications });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getInstitutionApplications = async (req, res) => {
  try {
    let studentQuery = {};

    if (req.user.role === "College") {
      studentQuery = { college_id: req.user.userId };
    } else if (req.user.role === "TPO") {
      const tpo = await tbl_tpo.findById(req.user.userId);
      if (!tpo) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: "TPO not found" });
      }
      studentQuery = {
        college_id: tpo.tpo_college_id,
        degree_id: tpo.tpo_degree_id,
      };
    } else {
      return res.status(StatusCodes.FORBIDDEN).json({ error: "Access denied" });
    }

    const students = await tbl_student.find(studentQuery).select("_id");
    const studentIds = students.map((student) => student._id);

    const applications = await tbl_application
      .find({ student_id: { $in: studentIds } })
      .populate({
        path: "student_id",
        populate: [
          { path: "college_id", select: "college_name" },
          { path: "university_id", select: "university_name" },
          { path: "degree_id", select: "degree_name" },
          { path: "branch_id", select: "branch_name" },
        ]
      })
      .populate({
        path: "job_id",
        populate: {
          path: "job_company_id",
          model: "tbl_company",
        },
      })
      .sort("-createdAt");

    res.status(StatusCodes.OK).json({ applications });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const getApplicationResume = async (req, res) => {
  try {
    const { id } = req.params; // Application ID
    const application = await tbl_application.findById(id);
    if (!application) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Application not found" });
    }

    const student = await tbl_student.findById(application.student_id);
    if (!student) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Student not found" });
    }

    const resume = await tbl_resume.findOne({ student_id: application.student_id });
    if (!resume) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "No CV generated or saved for this student yet." });
    }

    let compiledHtml = resume.ai_compiled_html || "";
    let compiledCss = resume.ai_compiled_css || "";

    if (compiledHtml) {
      // Replace the email and contact details in compiled HTML using escaped RegExp patterns to avoid syntax errors
      if (student.student_email) {
        const escapedEmail = student.student_email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        compiledHtml = compiledHtml.replace(new RegExp(escapedEmail, "g"), "");
      }
      if (student.student_contact) {
        const escapedContact = student.student_contact.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        compiledHtml = compiledHtml.replace(new RegExp(escapedContact, "g"), "");
      }
    }

    res.status(StatusCodes.OK).json({ compiledHtml, compiledCss });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

