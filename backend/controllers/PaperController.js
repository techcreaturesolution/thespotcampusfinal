import tbl_paper from "../models/PaperModel.js";
import tbl_exam from "../models/ExamModel.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../errors/customErrors.js";

export const getAllPaper = async (req, res) => {
  try {
    const papers = await tbl_paper
      .find({ exam_id: req.params.id })
      .populate("student_id")
      .sort("-createdAt");

    res.status(StatusCodes.OK).json({ papers });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const createPaper = async (req, res) => {
  const { answers } = req.body;

  try {
    req.body.student_id = req.user.userId;
    req.body.exam_id = req.params.id;

    const exam = await tbl_exam.findOne({ job_id: req.params.id });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    let score = 0;
    exam.questions.forEach((question, index) => {
      const selected = answers[index];
      if (!selected) return;

      const correctOption = question.options.find((opt) => opt.isCorrect);
      if (!correctOption) return;

      const correctOptionId = correctOption._id.toString();
      const selectedOptionId = selected.selectedOption.toString();

      if (correctOptionId === selectedOptionId) {
        score += 1;
      }
    });

    req.body.score = score;
    req.body.status = "submitted";

    if (req.body.proctoring) {
      req.body.proctoring.submittedAt = new Date();
      if (req.body.proctoring.startedAt) {
        const startTime = new Date(req.body.proctoring.startedAt);
        req.body.proctoring.totalTimeSpentSeconds = Math.floor(
          (Date.now() - startTime.getTime()) / 1000
        );
      }
    }

    const paper = await tbl_paper.create(req.body);
    res.status(StatusCodes.CREATED).json({ paper });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const recordViolation = async (req, res) => {
  try {
    const { paperId } = req.params;
    const { type, details } = req.body;

    const paper = await tbl_paper.findById(paperId);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    paper.proctoring.violations.push({
      type,
      details,
      timestamp: new Date(),
    });
    paper.proctoring.totalViolations += 1;

    // Decrease trust score
    const deduction = type === "tab_switch" ? 10 : type === "face_not_detected" ? 15 : 5;
    paper.proctoring.trustScore = Math.max(
      0,
      paper.proctoring.trustScore - deduction
    );

    await paper.save();

    res.status(StatusCodes.OK).json({
      totalViolations: paper.proctoring.totalViolations,
      trustScore: paper.proctoring.trustScore,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const saveCameraSnapshot = async (req, res) => {
  try {
    const { paperId } = req.params;
    const { imageUrl, faceDetected, multipleFaces } = req.body;

    const paper = await tbl_paper.findById(paperId);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    paper.proctoring.cameraSnapshots.push({
      imageUrl,
      faceDetected,
      multipleFaces,
      timestamp: new Date(),
    });

    if (!faceDetected || multipleFaces) {
      const violationType = !faceDetected
        ? "face_not_detected"
        : "multiple_faces";
      paper.proctoring.violations.push({
        type: violationType,
        details: !faceDetected
          ? "No face detected during camera capture"
          : "Multiple faces detected during camera capture",
        timestamp: new Date(),
      });
      paper.proctoring.totalViolations += 1;
      paper.proctoring.trustScore = Math.max(
        0,
        paper.proctoring.trustScore - 15
      );
    }

    await paper.save();

    res.status(StatusCodes.OK).json({
      msg: "Snapshot saved",
      totalViolations: paper.proctoring.totalViolations,
      trustScore: paper.proctoring.trustScore,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const autoSubmitPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const { reason, answers } = req.body;

    const paper = await tbl_paper.findById(paperId);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    if (answers) {
      paper.answers = answers;
      const exam = await tbl_exam.findOne({ job_id: paper.exam_id });
      if (exam) {
        let score = 0;
        exam.questions.forEach((question, index) => {
          const selected = answers[index];
          if (!selected) return;
          const correctOption = question.options.find((opt) => opt.isCorrect);
          if (!correctOption) return;
          if (correctOption._id.toString() === selected.selectedOption.toString()) {
            score += 1;
          }
        });
        paper.score = score;
      }
    }

    paper.status = "auto_submitted";
    paper.proctoring.autoSubmitted = true;
    paper.proctoring.autoSubmitReason = reason || "Maximum violations exceeded";
    paper.proctoring.submittedAt = new Date();

    await paper.save();

    res.status(StatusCodes.OK).json({
      msg: "Paper auto-submitted",
      paper,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const startExamSession = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.userId;

    const existingPaper = await tbl_paper.findOne({
      exam_id: examId,
      student_id: studentId,
      status: { $in: ["submitted", "auto_submitted"] },
    });

    if (existingPaper) {
      return res.status(400).json({
        message: "You have already submitted this exam",
      });
    }

    let paper = await tbl_paper.findOne({
      exam_id: examId,
      student_id: studentId,
      status: "in_progress",
    });

    if (!paper) {
      paper = await tbl_paper.create({
        exam_id: examId,
        student_id: studentId,
        answers: [],
        proctoring: {
          startedAt: new Date(),
          browserInfo: req.body.browserInfo || "",
          ipAddress: req.ip,
          violations: [],
          cameraSnapshots: [],
          totalViolations: 0,
          trustScore: 100,
        },
        status: "in_progress",
      });
    }

    res.status(StatusCodes.OK).json({ paper });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const deletePaper = async (req, res) => {
  try {
    const { id } = req.params;
    const removedPaper = await tbl_paper.findByIdAndDelete(id);
    if (!removedPaper) throw new NotFoundError(`no Paper with id : ${id}`);

    res
      .status(StatusCodes.OK)
      .json({ msg: "Paper deleted", paper: removedPaper });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};

export const getPaperWithProctoring = async (req, res) => {
  try {
    const { paperId } = req.params;
    const paper = await tbl_paper
      .findById(paperId)
      .populate("student_id");

    if (!paper) throw new NotFoundError(`No paper with id: ${paperId}`);

    res.status(StatusCodes.OK).json({ paper });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: error.message });
  }
};
