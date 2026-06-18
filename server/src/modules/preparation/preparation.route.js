import { Router } from "express";
import { createSubject, getAllSubjects, updateSubject, deleteSubject, getActiveSubjects } from "./subject.controller.js";
import { createTopic, getTopicsBySubject, getAllTopics, updateTopic, deleteTopic } from "./topic.controller.js";
import { createQuestion, bulkUploadQuestions, getAllQuestions, updateQuestion, deleteQuestion, getPracticeQuestions, getPreviousYearQuestions } from "./question.controller.js";
import { createMockTest, getAllMockTests, updateMockTest, deleteMockTest, getActiveMockTests, startMockTest, submitMockTest, getTestResult, getMyAttempts } from "./mocktest.controller.js";
import { getTodayChallenge, submitDailyChallenge, createDailyChallenge } from "./dailychallenge.controller.js";
import { toggleBookmark, getBookmarks, checkBookmark } from "./bookmark.controller.js";
import { createPdfMaterial, getAllPdfMaterials, updatePdfMaterial, deletePdfMaterial, getActivePdfs, updateReadingProgress } from "./pdfmaterial.controller.js";
import { getStudentProgress, getSubjectAnalysis, getProgressGraphs, getRecentActivity } from "./progress.controller.js";
import upload from "../../middleware/multerMiddleware.js";

const router = Router();

// =========== SUBJECTS ===========
router.get("/subjects/active", getActiveSubjects);
router.get("/subjects", getAllSubjects);
router.post("/subjects", createSubject);
router.patch("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

// =========== TOPICS ===========
router.get("/topics", getAllTopics);
router.get("/topics/subject/:subjectId", getTopicsBySubject);
router.post("/topics", createTopic);
router.patch("/topics/:id", updateTopic);
router.delete("/topics/:id", deleteTopic);

// =========== QUESTIONS ===========
router.get("/questions", getAllQuestions);
router.get("/questions/practice/:topicId", getPracticeQuestions);
router.get("/questions/previous-year", getPreviousYearQuestions);
router.post("/questions", createQuestion);
router.post("/questions/bulk", bulkUploadQuestions);
router.patch("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);

// =========== MOCK TESTS ===========
router.get("/mock-tests", getAllMockTests);
router.get("/mock-tests/active", getActiveMockTests);
router.post("/mock-tests", createMockTest);
router.patch("/mock-tests/:id", updateMockTest);
router.delete("/mock-tests/:id", deleteMockTest);
router.post("/mock-tests/:id/start", startMockTest);
router.post("/mock-tests/submit/:attemptId", submitMockTest);
router.get("/mock-tests/result/:attemptId", getTestResult);
router.get("/mock-tests/my-attempts", getMyAttempts);

// =========== DAILY CHALLENGE ===========
router.get("/daily-challenge", getTodayChallenge);
router.post("/daily-challenge/submit", submitDailyChallenge);
router.post("/daily-challenge/create", createDailyChallenge);

// =========== BOOKMARKS ===========
router.post("/bookmarks/toggle", toggleBookmark);
router.get("/bookmarks", getBookmarks);
router.get("/bookmarks/check/:item_id", checkBookmark);

// =========== PDF MATERIALS ===========
router.get("/pdfs", getAllPdfMaterials);
router.get("/pdfs/active", getActivePdfs);
router.post("/pdfs", upload.single("file"), createPdfMaterial);
router.patch("/pdfs/:id", updatePdfMaterial);
router.delete("/pdfs/:id", deletePdfMaterial);
router.post("/pdfs/reading-progress", updateReadingProgress);

// =========== PROGRESS & PERFORMANCE ===========
router.get("/progress", getStudentProgress);
router.get("/progress/subjects", getSubjectAnalysis);
router.get("/progress/graphs", getProgressGraphs);
router.get("/progress/activity", getRecentActivity);

export default router;
