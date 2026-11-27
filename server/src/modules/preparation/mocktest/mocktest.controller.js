import MockTest from "./mocktest.model.js";
import Question from "../question/question.model.js";
import TestAttempt from "./testattempt.model.js";
import StudentProgress from "../progress/studentprogress.model.js";
import { StatusCodes } from "http-status-codes";

// Admin: Create mock test
export const createMockTest = async (req, res) => {
  const mockTest = await MockTest.create(req.body);
  res.status(StatusCodes.CREATED).json({ mockTest });
};

// Admin: Get all mock tests
export const getAllMockTests = async (req, res) => {
  const { test_type, search } = req.query;
  const filter = {};
  if (test_type) filter.test_type = test_type;
  if (search) filter.title = { $regex: search, $options: "i" };
  const mockTests = await MockTest.find(filter)
    .populate("subject_id", "name")
    .sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json({ mockTests });
};

// Admin: Update mock test
export const updateMockTest = async (req, res) => {
  const mockTest = await MockTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!mockTest) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Mock test not found" });
  res.status(StatusCodes.OK).json({ mockTest });
};

// Admin: Delete mock test
export const deleteMockTest = async (req, res) => {
  const mockTest = await MockTest.findByIdAndDelete(req.params.id);
  if (!mockTest) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Mock test not found" });
  res.status(StatusCodes.OK).json({ msg: "Mock test deleted" });
};

// Student: Get active mock tests
export const getActiveMockTests = async (req, res) => {
  const { test_type, company_name, subject_id } = req.query;
  const filter = { is_active: true };
  if (test_type) filter.test_type = test_type;
  if (company_name) filter.company_name = { $regex: company_name, $options: "i" };
  if (subject_id) filter.subject_id = subject_id;
  const mockTests = await MockTest.find(filter)
    .populate("subject_id", "name")
    .sort({ createdAt: -1 });
  res.status(StatusCodes.OK).json({ mockTests });
};

// Helper: Sanitize question for student-facing test start (never leak answers or explanations)
const sanitizeQuestionsForStudent = (questions) => {
  if (!Array.isArray(questions)) return [];
  return questions.map((q) => {
    const obj = typeof q.toObject === "function" ? q.toObject() : { ...q };
    delete obj.correct_option_index;
    delete obj.explanation;
    if (Array.isArray(obj.options)) {
      obj.options = obj.options.map((opt) => ({
        _id: opt._id,
        text: opt.text,
      }));
    }
    return obj;
  });
};

// Student: Start mock test
export const startMockTest = async (req, res) => {
  const { id } = req.params;
  const studentId = req.user.userId;
  const mockTest = await MockTest.findById(id);
  if (!mockTest) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Mock test not found" });

  const durationMinutes = mockTest.duration_minutes || 30;

  // Check for existing in-progress attempt
  const existing = await TestAttempt.findOne({ student_id: studentId, mock_test_id: id, status: "in_progress" });
  if (existing) {
    const questionIds = existing.answers.map((a) => a.question_id);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const elapsedMs = Date.now() - new Date(existing.started_at).getTime();
    const remaining_seconds = Math.max(0, Math.ceil((durationMinutes * 60 * 1000 - elapsedMs) / 1000));
    
    // Sanitize questions so correct answers are not leaked on resume
    const sanitizedQuestions = sanitizeQuestionsForStudent(questions);
    return res.status(StatusCodes.OK).json({ 
      attempt: existing, 
      questions: sanitizedQuestions, 
      resumed: true, 
      remaining_seconds 
    });
  }

  // Get questions
  let questions;
  if (mockTest.questions && mockTest.questions.length > 0) {
    questions = await Question.find({ _id: { $in: mockTest.questions } });
  } else {
    const filter = { is_active: true };
    if (mockTest.subject_id) filter.subject_id = mockTest.subject_id;
    if (mockTest.company_name) filter.company_name = mockTest.company_name;
    questions = await Question.aggregate([{ $match: filter }, { $sample: { size: mockTest.total_questions } }]);
  }

  if (mockTest.randomize_questions) {
    questions = questions.sort(() => Math.random() - 0.5);
  }

  const attempt = await TestAttempt.create({
    student_id: studentId,
    test_type: "mock_test",
    mock_test_id: id,
    subject_id: mockTest.subject_id,
    total_questions: questions.length,
    max_score: questions.length * (mockTest.marks_per_question || 1),
    answers: questions.map((q) => ({ question_id: q._id, selected_option: -1 })),
  });

  await MockTest.findByIdAndUpdate(id, { $inc: { attempts_count: 1 } });
  
  // Sanitize questions so correct answers are not exposed in initial test load
  const sanitizedQuestions = sanitizeQuestionsForStudent(questions);

  res.status(StatusCodes.CREATED).json({
    attempt,
    questions: sanitizedQuestions,
    remaining_seconds: durationMinutes * 60,
  });
};

// Student: Save attempt progress (intermediate answer saving & recovery)
export const saveAttemptProgress = async (req, res) => {
  const { attemptId } = req.params;
  const { answers, time_taken_seconds } = req.body;
  const attempt = await TestAttempt.findById(attemptId);
  if (!attempt) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Attempt not found" });
  if (attempt.student_id.toString() !== req.user.userId) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: "Unauthorized" });
  }
  if (attempt.status === "completed") {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Attempt already completed" });
  }

  if (Array.isArray(answers)) {
    const answerMap = new Map();
    answers.forEach((ans) => {
      const qId = ans.question_id?.toString();
      const sel = ans.selected_option !== undefined 
        ? ans.selected_option 
        : ans.selected_option_index;
      if (qId) {
        answerMap.set(qId, {
          selected_option: sel !== undefined && sel !== null ? Number(sel) : -1,
          time_spent_seconds: ans.time_spent_seconds || 0,
        });
      }
    });

    attempt.answers = attempt.answers.map((a) => {
      const qIdStr = a.question_id.toString();
      if (answerMap.has(qIdStr)) {
        const entry = answerMap.get(qIdStr);
        return {
          ...a.toObject(),
          selected_option: entry.selected_option,
          is_skipped: entry.selected_option === -1,
          time_spent_seconds: entry.time_spent_seconds,
        };
      }
      return a;
    });
  }

  if (time_taken_seconds !== undefined) {
    attempt.time_taken_seconds = time_taken_seconds;
  }

  await attempt.save();
  res.status(StatusCodes.OK).json({ msg: "Progress saved", attempt });
};

// Student: Submit mock test (Server-authoritative evaluation and timer enforcement)
export const submitMockTest = async (req, res) => {
  const { attemptId } = req.params;
  const { answers, time_taken_seconds } = req.body;
  const attempt = await TestAttempt.findById(attemptId);
  if (!attempt) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Attempt not found" });
  if (attempt.student_id.toString() !== req.user.userId) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: "Unauthorized" });
  }

  // Prevent duplicate submissions
  if (attempt.status === "completed") {
    return res.status(StatusCodes.BAD_REQUEST).json({ 
      msg: "This test attempt has already been submitted and completed.",
      attempt 
    });
  }

  const mockTest = await MockTest.findById(attempt.mock_test_id);
  const durationMinutes = mockTest?.duration_minutes || 30;
  const marksPerQuestion = mockTest?.marks_per_question || 1;
  const negativeMarkValue = mockTest?.negative_marking ? (mockTest.negative_mark_value ?? 0.25) : 0;

  // Server-authoritative timing calculation
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000));
  const finalTimeTaken = time_taken_seconds ? Math.min(time_taken_seconds, durationMinutes * 60) : elapsedSeconds;

  // Fetch actual questions from database for secure authoritative grading
  const questionIds = attempt.answers.map((a) => a.question_id);
  const dbQuestions = await Question.find({ _id: { $in: questionIds } });
  const questionMap = new Map(dbQuestions.map((q) => [q._id.toString(), q]));

  let correct = 0, wrong = 0, skipped = 0, score = 0;

  const updatedAnswers = attempt.answers.map((a) => {
    const qIdStr = a.question_id.toString();
    const dbQ = questionMap.get(qIdStr);

    // Look for submitted answer in request payload; handle both selected_option and selected_option_index
    const submitted = answers?.find((s) => (s.question_id?.toString() || s.question_id) === qIdStr);

    let selectedOpt = -1;
    let timeSpent = a.time_spent_seconds || 0;

    if (submitted) {
      if (submitted.selected_option !== undefined && submitted.selected_option !== null) {
        selectedOpt = Number(submitted.selected_option);
      } else if (submitted.selected_option_index !== undefined && submitted.selected_option_index !== null) {
        selectedOpt = Number(submitted.selected_option_index);
      }
      if (submitted.time_spent_seconds) timeSpent = Number(submitted.time_spent_seconds);
    } else if (a.selected_option !== undefined && a.selected_option !== null && a.selected_option !== -1) {
      selectedOpt = a.selected_option;
    }

    if (selectedOpt === -1 || !dbQ) {
      skipped++;
      return {
        ...a.toObject(),
        selected_option: -1,
        is_correct: false,
        is_skipped: true,
        time_spent_seconds: timeSpent,
      };
    }

    // Authoritative check against database correct_option_index (NEVER trust client is_correct)
    const isCorrect = selectedOpt === dbQ.correct_option_index;
    if (isCorrect) {
      correct++;
      score += marksPerQuestion;
    } else {
      wrong++;
      score -= negativeMarkValue;
    }

    return {
      ...a.toObject(),
      selected_option: selectedOpt,
      is_correct: isCorrect,
      is_skipped: false,
      time_spent_seconds: timeSpent,
    };
  });

  const accuracy = attempt.total_questions > 0 ? Math.round((correct / (correct + wrong || 1)) * 100) : 0;
  attempt.answers = updatedAnswers;
  attempt.correct_answers = correct;
  attempt.wrong_answers = wrong;
  attempt.skipped = skipped;
  attempt.score = Math.max(score, 0);
  attempt.accuracy = accuracy;
  attempt.time_taken_seconds = finalTimeTaken;
  attempt.status = "completed";
  attempt.completed_at = new Date();
  await attempt.save();

  // Update student progress
  await updateStudentProgress(req.user.userId, attempt);

  res.status(StatusCodes.OK).json({ attempt });
};

// Student: Get test result
export const getTestResult = async (req, res) => {
  const { attemptId } = req.params;
  const attempt = await TestAttempt.findById(attemptId)
    .populate("mock_test_id", "title duration_minutes negative_marking marks_per_question passing_percentage");
  if (!attempt) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Attempt not found" });

  // Ownership validation: only the candidate student or admin can access results
  if (attempt.student_id.toString() !== req.user.userId && req.user.role !== "Admin") {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: "Unauthorized access to test result" });
  }

  const questionIds = attempt.answers.map((a) => a.question_id);
  const questions = await Question.find({ _id: { $in: questionIds } });
  
  const durationMinutes = attempt.mock_test_id?.duration_minutes || 30;
  const elapsedMs = Date.now() - new Date(attempt.started_at).getTime();
  const remaining_seconds = Math.max(0, Math.ceil((durationMinutes * 60 * 1000 - elapsedMs) / 1000));
  
  // If attempt is not completed yet, sanitize questions to prevent leak during unauthorized access
  const questionsToReturn = attempt.status === "completed" 
    ? questions 
    : sanitizeQuestionsForStudent(questions);

  res.status(StatusCodes.OK).json({ attempt, questions: questionsToReturn, remaining_seconds });
};

// Student: Get my attempts
export const getMyAttempts = async (req, res) => {
  const { test_type, page = 1, limit = 10 } = req.query;
  const filter = { student_id: req.user.userId, status: "completed" };
  if (test_type) filter.test_type = test_type;
  const skip = (Number(page) - 1) * Number(limit);
  const [attempts, total] = await Promise.all([
    TestAttempt.find(filter)
      .populate("mock_test_id", "title test_type")
      .populate("subject_id", "name")
      .sort({ completed_at: -1 })
      .skip(skip)
      .limit(Number(limit)),
    TestAttempt.countDocuments(filter),
  ]);
  res.status(StatusCodes.OK).json({ attempts, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
};

// Helper: Update student progress
async function updateStudentProgress(studentId, attempt) {
  let progress = await StudentProgress.findOne({ student_id: studentId });
  if (!progress) {
    progress = await StudentProgress.create({ student_id: studentId });
  }
  progress.total_questions_solved += attempt.correct_answers + attempt.wrong_answers;
  progress.total_correct += attempt.correct_answers;
  progress.tests_attempted += 1;
  progress.overall_accuracy = progress.total_questions_solved > 0
    ? Math.round((progress.total_correct / progress.total_questions_solved) * 100)
    : 0;

  const today = new Date().toISOString().split("T")[0];
  if (progress.last_active_date === today) {
    // Already active today
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (progress.last_active_date === yesterday) {
      progress.current_streak += 1;
    } else {
      progress.current_streak = 1;
    }
    progress.last_active_date = today;
  }
  if (progress.current_streak > progress.longest_streak) {
    progress.longest_streak = progress.current_streak;
  }

  // Update weekly activity
  const weekEntry = progress.weekly_activity.find((w) => w.date === today);
  if (weekEntry) {
    weekEntry.questions_solved += attempt.correct_answers + attempt.wrong_answers;
    weekEntry.correct += attempt.correct_answers;
  } else {
    progress.weekly_activity.push({ date: today, questions_solved: attempt.correct_answers + attempt.wrong_answers, correct: attempt.correct_answers });
    if (progress.weekly_activity.length > 30) progress.weekly_activity.shift();
  }

  // Update subject progress
  if (attempt.subject_id) {
    const sp = progress.subject_progress.find((s) => s.subject_id?.toString() === attempt.subject_id?.toString());
    if (sp) {
      sp.questions_attempted += attempt.correct_answers + attempt.wrong_answers;
      sp.correct_answers += attempt.correct_answers;
      sp.accuracy = Math.round((sp.correct_answers / sp.questions_attempted) * 100);
    } else {
      const Subject = (await import("../subject/subject.model.js")).default;
      const subj = await Subject.findById(attempt.subject_id);
      progress.subject_progress.push({
        subject_id: attempt.subject_id,
        subject_name: subj?.name || "",
        questions_attempted: attempt.correct_answers + attempt.wrong_answers,
        correct_answers: attempt.correct_answers,
        accuracy: Math.round((attempt.correct_answers / (attempt.correct_answers + attempt.wrong_answers || 1)) * 100),
      });
    }
  }

  await progress.save();
}
