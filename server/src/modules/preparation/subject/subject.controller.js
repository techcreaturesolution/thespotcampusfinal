import Subject from "./subject.model.js";
import Question from "../question/question.model.js";
import SubjectCategory from "./subjectcategory.model.js";
import { StatusCodes } from "http-status-codes";

// Admin: Create subject
export const createSubject = async (req, res) => {
  const subject = await Subject.create(req.body);
  res.status(StatusCodes.CREATED).json({ subject });
};

// Admin: Get all subjects
export const getAllSubjects = async (req, res) => {
  const { category, search } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: "i" };
  const subjects = await Subject.find(filter).sort({ sort_order: 1, name: 1 });
  res.status(StatusCodes.OK).json({ subjects });
};

// Admin: Update subject
export const InstrumentPatchSubject = async (req, res) => {
  // Let's keep original name export const updateSubject
};

export const updateSubject = async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subject) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Subject not found" });
  res.status(StatusCodes.OK).json({ subject });
};

// Admin: Delete subject
export const deleteSubject = async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Subject not found" });
  await Question.deleteMany({ subject_id: req.params.id });
  res.status(StatusCodes.OK).json({ msg: "Subject deleted" });
};

// Public: Get active subjects with question count
export const getActiveSubjects = async (req, res) => {
  const subjects = await Subject.find({ is_active: true }).sort({ sort_order: 1, name: 1 }).lean();
  const subjectIds = subjects.map((s) => s._id);
  const questionCounts = await Question.aggregate([
    { $match: { subject_id: { $in: subjectIds }, is_active: true } },
    { $group: { _id: "$subject_id", count: { $sum: 1 } } },
  ]);
  const qcMap = Object.fromEntries(questionCounts.map((q) => [q._id.toString(), q.count]));
  const result = subjects.map((s) => ({
    ...s,
    question_count: qcMap[s._id.toString()] || 0,
  }));
  res.status(StatusCodes.OK).json({ subjects: result });
};

// Admin: Get all categories
export const getCategories = async (req, res) => {
  const categories = await SubjectCategory.find({ is_active: true }).sort({ name: 1 });
  res.status(StatusCodes.OK).json({ categories });
};

// Admin: Create subject category
export const createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Category name is required" });
  }
  const normalizedName = name.trim().toLowerCase();
  const existing = await SubjectCategory.findOne({ name: normalizedName });
  if (existing) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Category already exists" });
  }
  const category = await SubjectCategory.create({ name: normalizedName });
  res.status(StatusCodes.CREATED).json({ category });
};
