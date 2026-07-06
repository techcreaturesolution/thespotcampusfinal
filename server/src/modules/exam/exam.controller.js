import tbl_exam from "./exam.model.js";
import tbl_job from "../job/job.model.js";
import { RecruitmentSubscription } from "../subscription/subscription.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";
import generateMCQs, { generateFromJobDescription } from "../../utils/generateMCQs.js";

export const getAllExams = async (req, res) => {
  try {
    const exams = await tbl_exam
      .find({ company_id: req.user.userId })
      .sort("-createdAt");
    res.status(StatusCodes.OK).json({ exams });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

// Generate exam paper from Job Description
export const createExamFromJD = async (req, res) => {
  try {
    const company_id = req.user.userId;

    // Subscription check bypassed for companies (subscription feature removed for company)

    const {
      job_id,
      title,
      noOfQuestion,
      hard,
      medium,
      easy,
      timeLimit,
      proctoring,
    } = req.body;

    if (!job_id) {
      return res.status(400).json({
        success: false,
        message: "job_id is required to generate exam from JD",
      });
    }

    const job = await tbl_job.findById(job_id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const jobDescription = `
Title: ${job.job_title}
Position: ${job.job_position}
Type: ${job.job_type}
Work Mode: ${job.job_work_mode}
Skills Required: ${job.job_skills}
Description: ${job.job_desc || ""}
Experience: ${job.job_exp || "Not specified"}
    `.trim();

    const totalDifficulty = (hard || 30) + (medium || 40) + (easy || 30);
    if (totalDifficulty !== 100) {
      return res.status(400).json({
        success: false,
        message: "Difficulty percentages must sum to 100.",
      });
    }

    const totalQ = noOfQuestion || 20;
    const hardCount = Math.round(((hard || 30) / 100) * totalQ);
    const mediumCount = Math.round(((medium || 40) / 100) * totalQ);
    const easyCount = totalQ - hardCount - mediumCount;

    const [hardQuestions, mediumQuestions, easyQuestions] = await Promise.all([
      generateFromJobDescription(jobDescription, hardCount, "hard"),
      generateFromJobDescription(jobDescription, mediumCount, "medium"),
      generateFromJobDescription(jobDescription, easyCount, "easy"),
    ]);

    const questions = [...hardQuestions, ...mediumQuestions, ...easyQuestions];

    const newExam = new tbl_exam({
      company_id,
      job_id,
      title: title || `Assessment for ${job.job_title}`,
      subject: `Job Role: ${job.job_title} - ${job.job_position}`,
      noOfQuestion: totalQ,
      timeLimit: timeLimit || 60,
      questions,
      generatedFromJD: true,
      proctoring: proctoring || {
        enabled: true,
        tabLockEnabled: true,
        cameraEnabled: true,
        cameraIntervalSeconds: 30,
        maxViolations: 5,
        autoSubmitOnMaxViolations: true,
        fullScreenRequired: true,
        copyPasteDisabled: true,
        rightClickDisabled: true,
        screenshotBlocked: true,
      },
      instructions: `This exam has been auto-generated based on the Job Description for "${job.job_title}". 
Answer all questions within the time limit. Tab switching and camera monitoring are enabled.`,
    });

    await newExam.save();

    res.status(201).json({
      success: true,
      message: "Exam generated from Job Description successfully",
      data: newExam,
    });
  } catch (error) {
    console.error("Error creating exam from JD:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate exam from JD",
    });
  }
};

export const getExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await tbl_exam.findOne({ job_id: id }).populate("job_id");
    if (!exam) throw new NotFoundError(`No Exam with id: ${id}`);
    if (exam.job_id && exam.job_id.job_status === "0") {
      throw new NotFoundError(`Exam is no longer active`);
    }
    res.status(StatusCodes.OK).json({ exam });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await tbl_exam.findById(id).populate("job_id");
    if (!exam) throw new NotFoundError(`No Exam with id: ${id}`);
    if (exam.job_id && exam.job_id.job_status === "0") {
      throw new NotFoundError(`Exam is no longer active`);
    }
    res.status(StatusCodes.OK).json({ exam });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedExam = await tbl_exam.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedExam) throw new NotFoundError(`No exam with id: ${id}`);
    res
      .status(StatusCodes.OK)
      .json({ msg: "Exam modified", exam: updatedExam });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const removedExam = await tbl_exam.findByIdAndDelete(id);
    if (!removedExam) throw new NotFoundError(`No exam with id: ${id}`);
    res
      .status(StatusCodes.OK)
      .json({ msg: "Exam deleted", exam: removedExam });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const updateProctoringSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { proctoring } = req.body;
    const updatedExam = await tbl_exam.findByIdAndUpdate(
      id,
      { proctoring },
      { new: true }
    );
    if (!updatedExam) throw new NotFoundError(`No exam with id: ${id}`);
    res.status(StatusCodes.OK).json({
      msg: "Proctoring settings updated",
      exam: updatedExam,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};
