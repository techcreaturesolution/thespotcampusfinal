import tbl_paper from "./paper.model.js";
import tbl_exam from "./exam.model.js";
import tbl_candidate_round from "../interview/round.model.js";
import tbl_application from "../application/application.model.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../../errors/customErrors.js";

export const getAllPaper = async (req, res) => {
  try {
    const exam = await tbl_exam.findOne({ job_id: req.params.id }).populate("job_id");
    if (!exam) throw new NotFoundError(`No exam found for job id: ${req.params.id}`);

    const papers = await tbl_paper
      .find({ exam_id: req.params.id })
      .populate("student_id")
      .sort("-createdAt");

    // Filter out duplicate 'in_progress' papers if a submitted/auto_submitted one exists for the student
    const studentPaperMap = new Map();
    papers.forEach(p => {
      const studentId = p.student_id?._id?.toString() || p.student_id?.toString();
      if (!studentId) return;

      const existing = studentPaperMap.get(studentId);
      if (!existing) {
        studentPaperMap.set(studentId, p);
      } else {
        // If the current one is submitted/auto_submitted, prefer it over in_progress
        if (p.status !== "in_progress" && existing.status === "in_progress") {
          studentPaperMap.set(studentId, p);
        }
      }
    });

    const uniquePapers = Array.from(studentPaperMap.values());

    const enrichedPapers = [];
    for (const paper of uniquePapers) {
      const studentId = paper.student_id?._id || paper.student_id;
      const jobId = exam.job_id?._id || exam.job_id;

      const application = await tbl_application.findOne({ job_id: jobId, student_id: studentId });
      const candidateRound = await tbl_candidate_round.findOne({
        job_id: jobId,
        student_id: studentId,
        round_number: 1,
      });

      const paperObj = paper.toObject();
      paperObj.application = application || null;
      paperObj.candidateRound = candidateRound || null;
      enrichedPapers.push(paperObj);
    }

    res.status(StatusCodes.OK).json({ papers: enrichedPapers, exam });
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

    let paper = await tbl_paper.findOne({
      exam_id: req.params.id,
      student_id: req.user.userId,
      status: "in_progress",
    });

    if (paper) {
      paper.answers = answers;
      paper.score = score;
      paper.status = "submitted";

      if (!paper.proctoring) {
        paper.proctoring = {};
      }

      // Sync final proctoring score and violations count from client
      if (req.body.proctoring) {
        paper.proctoring.trustScore = req.body.proctoring.trustScore ?? paper.proctoring.trustScore;
        paper.proctoring.totalViolations = req.body.proctoring.totalViolations ?? paper.proctoring.totalViolations;

        // Merge violations if needed
        if (req.body.proctoring.violations && req.body.proctoring.violations.length > 0) {
          const dbViolationKeys = new Set(
            paper.proctoring.violations.map(v => `${v.type}-${new Date(v.timestamp).getTime()}`)
          );
          req.body.proctoring.violations.forEach(v => {
            const key = `${v.type}-${new Date(v.timestamp).getTime()}`;
            if (!dbViolationKeys.has(key)) {
              paper.proctoring.violations.push(v);
            }
          });
        }
      }

      paper.proctoring.submittedAt = new Date();
      if (paper.proctoring.startedAt) {
        const startTime = new Date(paper.proctoring.startedAt);
        paper.proctoring.totalTimeSpentSeconds = Math.floor(
          (Date.now() - startTime.getTime()) / 1000
        );
      }

      await paper.save();
    } else {
      paper = await tbl_paper.create(req.body);
    }

    // Sync score with candidate round in recruitment pipeline
    try {
      const studentId = req.user.userId;
      const jobId = req.params.id;
      if (studentId && jobId) {
        await tbl_candidate_round.findOneAndUpdate(
          { job_id: jobId, student_id: studentId, round_number: 1 },
          { score, max_score: exam.questions.length }
        );
      }
    } catch (syncErr) {
      console.warn("Failed to sync candidate round score:", syncErr);
    }

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

    if (req.body.proctoring) {
      paper.proctoring.trustScore = req.body.proctoring.trustScore ?? paper.proctoring.trustScore;
      paper.proctoring.totalViolations = req.body.proctoring.totalViolations ?? paper.proctoring.totalViolations;
    }

    paper.status = "auto_submitted";
    paper.proctoring.autoSubmitted = true;
    paper.proctoring.autoSubmitReason = reason || "Maximum violations exceeded";
    paper.proctoring.submittedAt = new Date();

    await paper.save();

    // Sync score with candidate round in recruitment pipeline
    try {
      const studentId = paper.student_id;
      const jobId = paper.exam_id;
      if (studentId && jobId) {
        // Load exam to know the total questions count
        const exam = await tbl_exam.findOne({ job_id: jobId });
        const maxQuestions = exam ? exam.questions.length : 0;
        await tbl_candidate_round.findOneAndUpdate(
          { job_id: jobId, student_id: studentId, round_number: 1 },
          { score: paper.score, max_score: maxQuestions }
        );
      }
    } catch (syncErr) {
      console.warn("Failed to sync candidate round score on auto-submit:", syncErr);
    }

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
