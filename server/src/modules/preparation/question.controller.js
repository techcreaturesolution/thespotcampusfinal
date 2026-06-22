import Question from "./question.model.js";
import { StatusCodes } from "http-status-codes";

// Admin: Create question
export const createQuestion = async (req, res) => {
  const question = await Question.create(req.body);
  res.status(StatusCodes.CREATED).json({ question });
};

// Admin: Bulk upload questions
export const bulkUploadQuestions = async (req, res) => {
  const { questions } = req.body;
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "No questions provided" });
  }
  const inserted = await Question.insertMany(questions);
  res.status(StatusCodes.CREATED).json({ msg: `${inserted.length} questions uploaded`, count: inserted.length });
};

// Admin: Get all questions (paginated)
export const getAllQuestions = async (req, res) => {
  const { subject_id, difficulty, company_name, is_previous_year, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (subject_id) filter.subject_id = subject_id;
  if (difficulty) filter.difficulty = difficulty;
  if (company_name) filter.company_name = { $regex: company_name, $options: "i" };
  if (is_previous_year === "true") filter.is_previous_year = true;
  if (search) filter.question_text = { $regex: search, $options: "i" };
  const skip = (Number(page) - 1) * Number(limit);
  const [questions, total] = await Promise.all([
    Question.find(filter)
      .populate("subject_id", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Question.countDocuments(filter),
  ]);
  res.status(StatusCodes.OK).json({ questions, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
};

// Admin: Update question
export const updateQuestion = async (req, res) => {
  const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!question) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Question not found" });
  res.status(StatusCodes.OK).json({ question });
};

// Admin: Delete question
export const deleteQuestion = async (req, res) => {
  const question = await Question.findByIdAndDelete(req.params.id);
  if (!question) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Question not found" });
  res.status(StatusCodes.OK).json({ msg: "Question deleted" });
};

// Student: Get practice questions for a subject
export const getPracticeQuestions = async (req, res) => {
  const { subjectId } = req.params;
  const { limit = 20, difficulty, page = 1 } = req.query;
  const filter = { subject_id: subjectId, is_active: true };
  if (difficulty) filter.difficulty = difficulty;
  const skip = (Number(page) - 1) * Number(limit);
  const [questions, total] = await Promise.all([
    Question.find(filter).skip(skip).limit(Number(limit)),
    Question.countDocuments(filter),
  ]);
  res.status(StatusCodes.OK).json({ questions, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
};

// Student: Get previous year questions
export const getPreviousYearQuestions = async (req, res) => {
  const { company_name, year, difficulty, page = 1, limit = 20 } = req.query;
  const filter = { is_previous_year: true, is_active: true };
  if (company_name) filter.company_name = { $regex: company_name, $options: "i" };
  if (year) filter.year = Number(year);
  if (difficulty) filter.difficulty = difficulty;
  const skip = (Number(page) - 1) * Number(limit);
  const [questions, total] = await Promise.all([
    Question.find(filter).sort({ company_name: 1, year: -1 }).skip(skip).limit(Number(limit)),
    Question.countDocuments(filter),
  ]);
  const companies = await Question.distinct("company_name", { is_previous_year: true, is_active: true });
  const years = await Question.distinct("year", { is_previous_year: true, is_active: true });
  res.status(StatusCodes.OK).json({ questions, total, companies, years, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
};
