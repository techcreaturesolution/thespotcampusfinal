import StudentProgress from "./studentprogress.model.js";
import TestAttempt from "./testattempt.model.js";
import { StatusCodes } from "http-status-codes";

// Get student's performance dashboard
export const getStudentProgress = async (req, res) => {
  const studentId = req.user.userId;
  let progress = await StudentProgress.findOne({ student_id: studentId });
  if (!progress) {
    progress = await StudentProgress.create({ student_id: studentId });
  }
  res.status(StatusCodes.OK).json({ progress });
};

// Get detailed subject-wise analysis
export const getSubjectAnalysis = async (req, res) => {
  const studentId = req.user.userId;
  const progress = await StudentProgress.findOne({ student_id: studentId });
  if (!progress) {
    return res.status(StatusCodes.OK).json({ subject_progress: [] });
  }

  // Sort by accuracy for strong/weak identification
  const sorted = [...progress.subject_progress].sort((a, b) => b.accuracy - a.accuracy);
  const strong_subjects = sorted.filter((s) => s.accuracy >= 70).slice(0, 5);
  const weak_subjects = sorted.filter((s) => s.accuracy < 50).slice(0, 5);

  res.status(StatusCodes.OK).json({
    subject_progress: progress.subject_progress,
    strong_subjects,
    weak_subjects,
  });
};

// Get weekly/monthly progress graphs data
export const getProgressGraphs = async (req, res) => {
  const studentId = req.user.userId;
  const progress = await StudentProgress.findOne({ student_id: studentId });
  if (!progress) {
    return res.status(StatusCodes.OK).json({ weekly: [], monthly: [] });
  }

  // Last 7 days
  const weekly = progress.weekly_activity.slice(-7);

  // Monthly: aggregate by month from attempts
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const monthlyAttempts = await TestAttempt.aggregate([
    { $match: { student_id: progress.student_id, status: "completed", completed_at: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$completed_at" } },
        tests: { $sum: 1 },
        avg_score: { $avg: "$accuracy" },
        questions: { $sum: "$total_questions" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(StatusCodes.OK).json({ weekly, monthly: monthlyAttempts });
};

// Get recent activity
export const getRecentActivity = async (req, res) => {
  const studentId = req.user.userId;
  const attempts = await TestAttempt.find({ student_id: studentId, status: "completed" })
    .populate("mock_test_id", "title")
    .populate("subject_id", "name")
    .sort({ completed_at: -1 })
    .limit(10);
  res.status(StatusCodes.OK).json({ activities: attempts });
};
