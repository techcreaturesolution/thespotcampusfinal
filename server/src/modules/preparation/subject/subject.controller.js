import Subject from "./subject.model.js";
import Question from "../question/question.model.js";
import SubjectCategory from "./subjectcategory.model.js";
import { StatusCodes } from "http-status-codes";

// Admin: Create subject
export const createSubject = async (req, res) => {
  if (!req.body.sort_order || req.body.sort_order === 0) {
    const maxSubject = await Subject.findOne({}).sort({ sort_order: -1 });
    req.body.sort_order = maxSubject ? (maxSubject.sort_order || 0) + 1 : 1;
  }
  const subject = await Subject.create(req.body);

  // Re-index remaining subjects sequentially
  const all = await Subject.find({}).sort({ sort_order: 1, name: 1 });
  for (let i = 0; i < all.length; i++) {
    const sub = all[i];
    const newSortOrder = i + 1;
    if (sub.sort_order !== newSortOrder) {
      await Subject.findByIdAndUpdate(sub._id, { sort_order: newSortOrder });
    }
  }

  const updatedSubject = await Subject.findById(subject._id);
  res.status(StatusCodes.CREATED).json({ subject: updatedSubject });
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

  // Re-index remaining subjects sequentially
  const all = await Subject.find({}).sort({ sort_order: 1, name: 1 });
  for (let i = 0; i < all.length; i++) {
    const sub = all[i];
    const newSortOrder = i + 1;
    if (sub.sort_order !== newSortOrder) {
      await Subject.findByIdAndUpdate(sub._id, { sort_order: newSortOrder });
    }
  }

  const updatedSubject = await Subject.findById(subject._id);
  res.status(StatusCodes.OK).json({ subject: updatedSubject });
};

// Admin: Delete subject
export const deleteSubject = async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Subject not found" });
  await Question.deleteMany({ subject_id: req.params.id });

  // Re-index remaining subjects sequentially
  const remainingSubjects = await Subject.find({}).sort({ sort_order: 1, name: 1 });
  for (let i = 0; i < remainingSubjects.length; i++) {
    const sub = remainingSubjects[i];
    const newSortOrder = i + 1;
    if (sub.sort_order !== newSortOrder) {
      await Subject.findByIdAndUpdate(sub._id, { sort_order: newSortOrder });
    }
  }

  res.status(StatusCodes.OK).json({ msg: "Subject deleted and sorting updated" });
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

// Admin: Delete subject category
export const deleteCategory = async (req, res) => {
  const category = await SubjectCategory.findById(req.params.id);
  if (!category) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Category not found" });
  
  // Check if in use
  const inUseCount = await Subject.countDocuments({ category: category.name });
  if (inUseCount > 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: `Cannot delete category because it is in use by ${inUseCount} subjects` });
  }
  
  await SubjectCategory.findByIdAndDelete(req.params.id);
  res.status(StatusCodes.OK).json({ msg: "Category deleted successfully" });
};
