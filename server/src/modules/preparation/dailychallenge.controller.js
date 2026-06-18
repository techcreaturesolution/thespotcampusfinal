import DailyChallenge from "./dailychallenge.model.js";
import Question from "./question.model.js";
import TestAttempt from "./testattempt.model.js";
import StudentProgress from "./studentprogress.model.js";
import { StatusCodes } from "http-status-codes";

// Get or generate today's challenge
export const getTodayChallenge = async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  let challenge = await DailyChallenge.findOne({ date: today }).populate("questions");

  if (!challenge) {
    // Auto-generate daily challenge with mixed questions
    const questions = await Question.aggregate([
      { $match: { is_active: true } },
      { $sample: { size: 10 } },
    ]);
    if (questions.length === 0) {
      return res.status(StatusCodes.OK).json({ challenge: null, msg: "No questions available" });
    }
    challenge = await DailyChallenge.create({
      date: today,
      questions: questions.map((q) => q._id),
      total_questions: questions.length,
    });
    challenge = await DailyChallenge.findById(challenge._id).populate("questions");
  }

  // Check if student already attempted today
  const studentId = req.user.userId;
  const existingAttempt = await TestAttempt.findOne({
    student_id: studentId,
    test_type: "daily_challenge",
    started_at: { $gte: new Date(today) },
    status: "completed",
  });

  res.status(StatusCodes.OK).json({ challenge, already_completed: !!existingAttempt, attempt: existingAttempt });
};

// Submit daily challenge
export const submitDailyChallenge = async (req, res) => {
  const { answers, time_taken_seconds } = req.body;
  const studentId = req.user.userId;
  const today = new Date().toISOString().split("T")[0];

  const challenge = await DailyChallenge.findOne({ date: today });
  if (!challenge) return res.status(StatusCodes.NOT_FOUND).json({ msg: "No challenge today" });

  // Check duplicate submission
  const existingAttempt = await TestAttempt.findOne({
    student_id: studentId,
    test_type: "daily_challenge",
    started_at: { $gte: new Date(today) },
    status: "completed",
  });
  if (existingAttempt) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Already submitted today's challenge", attempt: existingAttempt });
  }

  const questions = await Question.find({ _id: { $in: challenge.questions } });
  let correct = 0, wrong = 0, skipped = 0;

  const attemptAnswers = questions.map((q) => {
    const submitted = answers?.find((a) => a.question_id === q._id.toString());
    if (!submitted || submitted.selected_option === -1) {
      skipped++;
      return { question_id: q._id, is_skipped: true };
    }
    const isCorrect = submitted.selected_option === q.correct_option_index;
    if (isCorrect) correct++;
    else wrong++;
    return {
      question_id: q._id,
      selected_option: submitted.selected_option,
      is_correct: isCorrect,
      is_skipped: false,
    };
  });

  const accuracy = questions.length > 0 ? Math.round((correct / (correct + wrong || 1)) * 100) : 0;
  const attempt = await TestAttempt.create({
    student_id: studentId,
    test_type: "daily_challenge",
    total_questions: questions.length,
    answers: attemptAnswers,
    correct_answers: correct,
    wrong_answers: wrong,
    skipped,
    score: correct,
    max_score: questions.length,
    accuracy,
    time_taken_seconds: time_taken_seconds || 0,
    status: "completed",
    completed_at: new Date(),
  });

  // Update streak
  let progress = await StudentProgress.findOne({ student_id: studentId });
  if (!progress) progress = await StudentProgress.create({ student_id: studentId });
  
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (progress.last_active_date === yesterday || progress.last_active_date === today) {
    progress.daily_challenge_streak += progress.last_active_date === today ? 0 : 1;
  } else {
    progress.daily_challenge_streak = 1;
  }
  progress.daily_challenges_completed += 1;
  progress.total_questions_solved += correct + wrong;
  progress.total_correct += correct;
  progress.overall_accuracy = progress.total_questions_solved > 0
    ? Math.round((progress.total_correct / progress.total_questions_solved) * 100) : 0;
  progress.last_active_date = today;
  if (progress.daily_challenge_streak > progress.current_streak) {
    progress.current_streak = progress.daily_challenge_streak;
  }
  if (progress.current_streak > progress.longest_streak) {
    progress.longest_streak = progress.current_streak;
  }
  await progress.save();

  res.status(StatusCodes.OK).json({ attempt, streak: progress.daily_challenge_streak });
};

// Admin: Manually create a daily challenge
export const createDailyChallenge = async (req, res) => {
  const { date, question_ids } = req.body;
  const existing = await DailyChallenge.findOne({ date });
  if (existing) {
    existing.questions = question_ids;
    existing.total_questions = question_ids.length;
    await existing.save();
    return res.status(StatusCodes.OK).json({ challenge: existing });
  }
  const challenge = await DailyChallenge.create({
    date,
    questions: question_ids,
    total_questions: question_ids.length,
  });
  res.status(StatusCodes.CREATED).json({ challenge });
};
