import Question from "./question.model.js";
import { StatusCodes } from "http-status-codes";
import Subject from "../subject/subject.model.js";
import Company from "../../company/company.model.js";
import XLSX from "xlsx";
import fs from "fs";

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
  res.status(StatusCodes.OK).json({ questions, total, companies, years, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
};

// Admin: Import questions from CSV/Excel
export const importQuestions = async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Please upload an Excel file" });
    }

    filePath = req.file.path;
    const { subject_id: bodySubjectId } = req.body;

    // Fetch all active subjects and companies for lookup
    const [allSubjects, allCompanies] = await Promise.all([
      Subject.find({ is_active: true }).select("name category"),
      Company.find({}).select("company_name"),
    ]);

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (data.length === 0) {
      if (filePath && fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "The file is empty or has no data rows" });
    }

    const getField = (row, aliases) => {
      for (const alias of aliases) {
        if (row[alias] !== undefined && row[alias] !== "") return row[alias];
      }
      return null;
    };

    const selectedSubject = allSubjects.find(s => String(s._id) === String(bodySubjectId));

    const questions = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const originalRow = data[i];
      // Normalize keys: trim, lowercase, remove non-alphanumeric characters
      const row = {};
      Object.keys(originalRow).forEach(key => {
        const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        row[normalizedKey] = typeof originalRow[key] === "string" ? originalRow[key].trim() : originalRow[key];
      });

      try {
        const questionText = getField(row, ["question", "questiontext", "questions", "q", "questiontext"]);
        const optionA = getField(row, ["optiona", "option1", "opta", "choice1", "a", "opt1"]);
        const optionB = getField(row, ["optionb", "option2", "optb", "choice2", "b", "opt2"]);
        const optionC = getField(row, ["optionc", "option3", "optc", "choice3", "c", "opt3"]);
        const optionD = getField(row, ["optiond", "option4", "optd", "choice4", "d", "opt4"]);
        const answer = getField(row, ["answer", "ans", "correctanswer", "correctoption", "correctoptionindex", "correct"]);
        const difficulty = getField(row, ["difficulty", "level", "difficultylevel", "diff"]) || "medium";
        const explanation = getField(row, ["explanation", "explain", "solution", "reason"]) || "";
        const companyName = getField(row, ["company", "companyname", "companyname"]) || "";
        const year = getField(row, ["year", "yr"]);
        const isPreviousYearVal = getField(row, ["ispreviousyear", "previousyear", "pyq", "ispyq"]);
        const tagsVal = getField(row, ["tags", "tag"]);
        const excelSubjectName = getField(row, ["subject", "subjectname", "sub"]);
        const category = getField(row, ["category", "categoryname", "cat"]);

        // Validate basic fields
        if (!questionText || !optionA || !optionB || !optionC || !optionD || !answer) {
          const missingFields = [];
          if (!questionText) missingFields.push("Question Text");
          if (!optionA) missingFields.push("Option A");
          if (!optionB) missingFields.push("Option B");
          if (!optionC) missingFields.push("Option C");
          if (!optionD) missingFields.push("Option D");
          if (!answer) missingFields.push("Answer");
          errors.push({ row: i + 2, error: `Missing required fields: ${missingFields.join(", ")}` });
          continue;
        }

        // Determine subject_id
        let subject_id = bodySubjectId;
        let resolvedSubject = selectedSubject;
        if (excelSubjectName) {
          const matchedSubject = allSubjects.find(s => s.name.toLowerCase() === excelSubjectName.toLowerCase());
          if (selectedSubject && matchedSubject && String(selectedSubject._id) !== String(matchedSubject._id)) {
            errors.push({ row: i + 2, error: `Subject mismatch: Excel says '${excelSubjectName}' but you selected '${selectedSubject.name}'` });
            continue;
          }
          if (!subject_id && matchedSubject) {
            subject_id = matchedSubject._id;
            resolvedSubject = matchedSubject;
          } else if (!subject_id && !matchedSubject) {
            errors.push({ row: i + 2, error: `Subject '${excelSubjectName}' not found in database` });
            continue;
          }
        }

        if (!subject_id) {
          errors.push({ row: i + 2, error: "Subject is required but not selected or specified in file" });
          continue;
        }

        const finalCategory = category ? String(category).trim().toLowerCase() : (resolvedSubject ? resolvedSubject.category : "");

        // Parse correct answer
        let correct_option_index = -1;
        const answerStr = String(answer).trim().toLowerCase();
        if (["a", "1", "option a", "option 1"].includes(answerStr)) {
          correct_option_index = 0;
        } else if (["b", "2", "option b", "option 2"].includes(answerStr)) {
          correct_option_index = 1;
        } else if (["c", "3", "option c", "option 3"].includes(answerStr)) {
          correct_option_index = 2;
        } else if (["d", "4", "option d", "option 4"].includes(answerStr)) {
          correct_option_index = 3;
        } else {
          // Fallback: match by option text
          if (answerStr === String(optionA).trim().toLowerCase()) correct_option_index = 0;
          else if (answerStr === String(optionB).trim().toLowerCase()) correct_option_index = 1;
          else if (answerStr === String(optionC).trim().toLowerCase()) correct_option_index = 2;
          else if (answerStr === String(optionD).trim().toLowerCase()) correct_option_index = 3;
        }

        if (correct_option_index === -1) {
          errors.push({ row: i + 2, error: `Invalid answer: '${answer}'. Must be A/B/C/D, 1/2/3/4, or match option text` });
          continue;
        }

        // Validate difficulty
        const diffLower = difficulty.toLowerCase();
        if (!["easy", "medium", "hard"].includes(diffLower)) {
          errors.push({ row: i + 2, error: `Invalid difficulty: '${difficulty}'. Must be easy, medium, or hard` });
          continue;
        }

        // Resolve company_id if companyName provided
        let company_id = null;
        if (companyName) {
          const matchedCompany = allCompanies.find(c => c.company_name.toLowerCase() === companyName.toLowerCase());
          if (matchedCompany) {
            company_id = matchedCompany._id;
          }
        }

        // Parse is_previous_year
        let is_previous_year = false;
        if (isPreviousYearVal) {
          const pyqStr = String(isPreviousYearVal).trim().toLowerCase();
          if (["yes", "true", "1", "y"].includes(pyqStr)) {
            is_previous_year = true;
          }
        }

        // Parse year
        let finalYear = null;
        if (year) {
          const yrNum = Number(year);
          if (!isNaN(yrNum)) {
            finalYear = yrNum;
          }
        }

        // Parse tags
        let tags = [];
        if (tagsVal) {
          tags = String(tagsVal).split(",").map(t => t.trim()).filter(t => t);
        }

        const options = [
          { text: String(optionA), is_correct: correct_option_index === 0 },
          { text: String(optionB), is_correct: correct_option_index === 1 },
          { text: String(optionC), is_correct: correct_option_index === 2 },
          { text: String(optionD), is_correct: correct_option_index === 3 },
        ];

        questions.push({
          subject_id,
          category: finalCategory,
          company_id,
          company_name: String(companyName),
          year: finalYear,
          question_text: String(questionText),
          options,
          correct_option_index,
          explanation: String(explanation),
          difficulty: diffLower,
          tags,
          is_previous_year,
          is_active: true
        });
      } catch (err) {
        errors.push({ row: i + 2, error: err.message });
      }
    }

    let inserted = [];
    if (questions.length > 0) {
      try {
        inserted = await Question.insertMany(questions, { ordered: false });
      } catch (insertErr) {
        if (insertErr.insertedDocs) {
          inserted = insertErr.insertedDocs;
        }
        console.error("[Import] insertMany error:", insertErr.message);
        if (inserted.length === 0) {
          if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
          return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Failed to save questions: " + insertErr.message });
        }
      }
    }

    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }

    res.status(StatusCodes.CREATED).json({
      msg: `${inserted.length} questions imported successfully`,
      uploaded: inserted.length,
      total: data.length,
      skipped: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Import] unexpected error:", error);
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: error.message });
  }
};
