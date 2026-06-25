import StudentProgress from "./studentprogress.model.js";
import TestAttempt from "../mocktest/testattempt.model.js";
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

// Track progress for individual subject practice questions
export const updatePracticeProgress = async (req, res) => {
  const studentId = req.user.userId;
  const { subject_id, is_correct } = req.body;

  if (!subject_id) return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Subject ID is required" });

  let progress = await StudentProgress.findOne({ student_id: studentId });
  if (!progress) {
    progress = await StudentProgress.create({ student_id: studentId });
  }

  // Update overall stats
  progress.total_questions_solved += 1;
  if (is_correct) progress.total_correct += 1;
  progress.overall_accuracy = progress.total_questions_solved > 0
    ? Math.round((progress.total_correct / progress.total_questions_solved) * 100)
    : 0;

  // Streak logic
  const today = new Date().toISOString().split("T")[0];
  if (progress.last_active_date !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (progress.last_active_date === yesterday) progress.current_streak += 1;
    else progress.current_streak = 1;
    progress.last_active_date = today;
  }
  if (progress.current_streak > progress.longest_streak) progress.longest_streak = progress.current_streak;

  // Weekly activity
  const weekEntry = progress.weekly_activity.find((w) => w.date === today);
  if (weekEntry) {
    weekEntry.questions_solved += 1;
    if (is_correct) weekEntry.correct += 1;
  } else {
    progress.weekly_activity.push({ date: today, questions_solved: 1, correct: is_correct ? 1 : 0 });
    if (progress.weekly_activity.length > 30) progress.weekly_activity.shift();
  }

  // Update subject progress
  const sp = progress.subject_progress.find((s) => s.subject_id?.toString() === subject_id.toString());
  if (sp) {
    sp.questions_attempted += 1;
    if (is_correct) sp.correct_answers += 1;
    sp.accuracy = Math.round((sp.correct_answers / sp.questions_attempted) * 100);
  } else {
    const Subject = (await import("../subject/subject.model.js")).default;
    const subj = await Subject.findById(subject_id);
    progress.subject_progress.push({
      subject_id: subject_id,
      subject_name: subj?.name || "Unknown",
      questions_attempted: 1,
      correct_answers: is_correct ? 1 : 0,
      accuracy: is_correct ? 100 : 0,
    });
  }

  await progress.save();
  res.status(StatusCodes.OK).json({ msg: "Progress updated" });
};
