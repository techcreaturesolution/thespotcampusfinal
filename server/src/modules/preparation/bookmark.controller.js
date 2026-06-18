import Bookmark from "./bookmark.model.js";
import Question from "./question.model.js";
import MockTest from "./mocktest.model.js";
import PdfMaterial from "./pdfmaterial.model.js";
import { StatusCodes } from "http-status-codes";

// Toggle bookmark
export const toggleBookmark = async (req, res) => {
  const { item_type, item_id } = req.body;
  const studentId = req.user.userId;
  const existing = await Bookmark.findOne({ student_id: studentId, item_id });
  if (existing) {
    await Bookmark.findByIdAndDelete(existing._id);
    return res.status(StatusCodes.OK).json({ bookmarked: false, msg: "Bookmark removed" });
  }
  await Bookmark.create({ student_id: studentId, item_type, item_id });
  res.status(StatusCodes.OK).json({ bookmarked: true, msg: "Bookmarked" });
};

// Get all bookmarks
export const getBookmarks = async (req, res) => {
  const { item_type } = req.query;
  const filter = { student_id: req.user.userId };
  if (item_type) filter.item_type = item_type;
  const bookmarks = await Bookmark.find(filter).sort({ createdAt: -1 }).lean();

  // Populate items
  const result = [];
  for (const bm of bookmarks) {
    let item = null;
    if (bm.item_type === "question") {
      item = await Question.findById(bm.item_id).populate("subject_id", "name").populate("topic_id", "name").lean();
    } else if (bm.item_type === "mock_test") {
      item = await MockTest.findById(bm.item_id).lean();
    } else if (bm.item_type === "pdf") {
      item = await PdfMaterial.findById(bm.item_id).lean();
    }
    result.push({ ...bm, item });
  }
  res.status(StatusCodes.OK).json({ bookmarks: result });
};

// Check if item is bookmarked
export const checkBookmark = async (req, res) => {
  const { item_id } = req.params;
  const bookmark = await Bookmark.findOne({ student_id: req.user.userId, item_id });
  res.status(StatusCodes.OK).json({ bookmarked: !!bookmark });
};
