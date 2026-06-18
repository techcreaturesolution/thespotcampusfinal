import Topic from "./topic.model.js";
import Question from "./question.model.js";
import { StatusCodes } from "http-status-codes";

// Admin: Create topic
export const createTopic = async (req, res) => {
  const topic = await Topic.create(req.body);
  res.status(StatusCodes.CREATED).json({ topic });
};

// Get topics by subject
export const getTopicsBySubject = async (req, res) => {
  const { subjectId } = req.params;
  const topics = await Topic.find({ subject_id: subjectId, is_active: true })
    .sort({ sort_order: 1, name: 1 })
    .lean();
  const topicIds = topics.map((t) => t._id);
  const qCounts = await Question.aggregate([
    { $match: { topic_id: { $in: topicIds }, is_active: true } },
    { $group: { _id: "$topic_id", count: { $sum: 1 } } },
  ]);
  const qMap = Object.fromEntries(qCounts.map((q) => [q._id.toString(), q.count]));
  const result = topics.map((t) => ({
    ...t,
    question_count: qMap[t._id.toString()] || 0,
  }));
  res.status(StatusCodes.OK).json({ topics: result });
};

// Admin: Get all topics
export const getAllTopics = async (req, res) => {
  const { subject_id, search } = req.query;
  const filter = {};
  if (subject_id) filter.subject_id = subject_id;
  if (search) filter.name = { $regex: search, $options: "i" };
  const topics = await Topic.find(filter).populate("subject_id", "name").sort({ sort_order: 1, name: 1 });
  res.status(StatusCodes.OK).json({ topics });
};

// Admin: Update topic
export const updateTopic = async (req, res) => {
  const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!topic) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Topic not found" });
  res.status(StatusCodes.OK).json({ topic });
};

// Admin: Delete topic
export const deleteTopic = async (req, res) => {
  const topic = await Topic.findByIdAndDelete(req.params.id);
  if (!topic) return res.status(StatusCodes.NOT_FOUND).json({ msg: "Topic not found" });
  await Question.deleteMany({ topic_id: req.params.id });
  res.status(StatusCodes.OK).json({ msg: "Topic deleted" });
};
