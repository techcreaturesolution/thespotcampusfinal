
import { Router } from "express";
import { createSubject, getAllSubjects, updateSubject, deleteSubject, getActiveSubjects, getCategories, createCategory, deleteCategory } from "./subject/subject.controller.js";
import { createQuestion, bulkUploadQuestions, importQuestions, getAllQuestions, updateQuestion, deleteQuestion, getPracticeQuestions, getPreviousYearQuestions, bulkDeleteQuestions, getPreviousYearCategories, getPreviousYearSubjects } from "./question/question.controller.js";
import { createMockTest, getAllMockTests, updateMockTest, deleteMockTest, getActiveMockTests, startMockTest, submitMockTest, getTestResult, getMyAttempts, saveAttemptProgress } from "./mocktest/mocktest.controller.js";
import { getTodayChallenge, submitDailyChallenge, createDailyChallenge } from "./dailychallenge/dailychallenge.controller.js";
import { toggleBookmark, getBookmarks, checkBookmark } from "./bookmark/bookmark.controller.js";
import { createPdfMaterial, getAllPdfMaterials, updatePdfMaterial, deletePdfMaterial, getActivePdfs, updateReadingProgress } from "./pdfmaterial/pdfmaterial.controller.js";
import { getStudentProgress, getSubjectAnalysis, getProgressGraphs, getRecentActivity, updatePracticeProgress } from "./progress/progress.controller.js";
import upload from "../../middleware/multerMiddleware.js";
import { authorizePermissions } from "../../middleware/authMiddleware.js";

const router = Router();

// =========== SUBJECTS ===========
router.get("/subjects/active", getActiveSubjects);
router.get("/subjects", getAllSubjects);
router.post("/subjects", authorizePermissions("Admin"), createSubject);
router.patch("/subjects/:id", authorizePermissions("Admin"), updateSubject);
router.delete("/subjects/:id", authorizePermissions("Admin"), deleteSubject);
router.get("/subjects/categories", getCategories);
router.post("/subjects/categories", authorizePermissions("Admin"), createCategory);
router.delete("/subjects/categories/:id", authorizePermissions("Admin"), deleteCategory);

// =========== QUESTIONS ===========
router.get("/questions", getAllQuestions);
router.get("/questions/practice/:subjectId", getPracticeQuestions);
router.get("/questions/previous-year", getPreviousYearQuestions);
router.get("/questions/previous-year/categories", getPreviousYearCategories);
router.get("/questions/previous-year/subjects", getPreviousYearSubjects);
router.post("/questions", authorizePermissions("Admin"), createQuestion);
router.post("/questions/bulk", authorizePermissions("Admin"), bulkUploadQuestions);
router.post("/questions/bulk-delete", authorizePermissions("Admin"), bulkDeleteQuestions);
router.post("/questions/import", authorizePermissions("Admin"), upload.single("file"), importQuestions);
router.patch("/questions/:id", authorizePermissions("Admin"), updateQuestion);
router.delete("/questions/:id", authorizePermissions("Admin"), deleteQuestion);

// =========== MOCK TESTS ===========
router.get("/mock-tests", getAllMockTests);
router.get("/mock-tests/active", getActiveMockTests);
router.post("/mock-tests", authorizePermissions("Admin"), createMockTest);
router.patch("/mock-tests/:id", authorizePermissions("Admin"), updateMockTest);
router.delete("/mock-tests/:id", authorizePermissions("Admin"), deleteMockTest);
router.post("/mock-tests/:id/start", startMockTest);
router.post("/mock-tests/save/:attemptId", saveAttemptProgress);
router.post("/mock-tests/submit/:attemptId", submitMockTest);
router.get("/mock-tests/result/:attemptId", getTestResult);
router.get("/mock-tests/my-attempts", getMyAttempts);

// =========== DAILY CHALLENGE ===========
router.get("/daily-challenge", getTodayChallenge);
router.post("/daily-challenge/submit", submitDailyChallenge);
router.post("/daily-challenge/create", authorizePermissions("Admin"), createDailyChallenge);

// =========== BOOKMARKS ===========
router.post("/bookmarks/toggle", toggleBookmark);
router.get("/bookmarks", getBookmarks);
router.get("/bookmarks/check/:item_id", checkBookmark);

// =========== PDF MATERIALS ===========
router.get("/pdfs", getAllPdfMaterials);
router.get("/pdfs/active", getActivePdfs);
router.post("/pdfs", authorizePermissions("Admin"), upload.single("file"), createPdfMaterial);
router.patch("/pdfs/:id", authorizePermissions("Admin"), upload.single("file"), updatePdfMaterial);
router.delete("/pdfs/:id", authorizePermissions("Admin"), deletePdfMaterial);
router.post("/pdfs/reading-progress", updateReadingProgress);
 
// =========== PROGRESS & PERFORMANCE ===========
router.get("/progress", getStudentProgress);
router.get("/progress/subjects", getSubjectAnalysis);
router.get("/progress/graphs", getProgressGraphs);
router.get("/progress/activity", getRecentActivity);
router.post("/progress/practice/update", updatePracticeProgress);

export default router;
