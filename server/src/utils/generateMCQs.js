import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const validateQuestionStructure = (q, fallbackDifficulty = "medium") => {
  if (!q || typeof q !== "object") return null;
  const questionText = q.questionText || q.question_text || q.text;
  if (!questionText || typeof questionText !== "string" || questionText.trim().length === 0) {
    return null;
  }

  const rawOptions = q.options;
  if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
    return null;
  }

  const validOptions = [];
  let correctCount = 0;

  for (const opt of rawOptions) {
    if (!opt || typeof opt !== "object") continue;
    const optionText = opt.optionText || opt.text || opt.title;
    if (!optionText || typeof optionText !== "string") continue;
    const isCorrect = Boolean(opt.isCorrect || opt.is_correct);
    if (isCorrect) correctCount++;
    validOptions.push({
      optionText: optionText.trim(),
      isCorrect,
    });
  }

  if (validOptions.length < 2) return null;

  // Ensure exactly one correct option is designated; if none, mark first as correct
  if (correctCount === 0 && validOptions.length > 0) {
    validOptions[0].isCorrect = true;
  } else if (correctCount > 1) {
    let seenFirst = false;
    for (const opt of validOptions) {
      if (opt.isCorrect) {
        if (!seenFirst) {
          seenFirst = true;
        } else {
          opt.isCorrect = false;
        }
      }
    }
  }

  return {
    questionText: questionText.trim(),
    difficulty: q.difficulty || fallbackDifficulty,
    options: validOptions,
  };
};

const generateMCQs = async (prompt, expectedCount = 5, expectedDifficulty = "medium") => {
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("Invalid prompt provided for AI question generation.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your-openai-api-key") {
    throw new Error("OpenAI API key is not configured on the server. Please contact administrator.");
  }

  try {
    const openai = new OpenAI({
      apiKey,
      timeout: 35000, // 35-second hard timeout
      maxRetries: 2,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = response.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("OpenAI returned an empty response.");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\[\s*{[\s\S]*}\s*]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("OpenAI returned an invalid JSON response structure.");
      }
    }

    const questionList = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.questions)
      ? parsed.questions
      : Array.isArray(parsed.data)
      ? parsed.data
      : Object.values(parsed).find((val) => Array.isArray(val));

    if (!Array.isArray(questionList) || questionList.length === 0) {
      throw new Error("Failed to extract question list from AI response.");
    }

    const validatedQuestions = [];
    for (const item of questionList) {
      const valid = validateQuestionStructure(item, expectedDifficulty);
      if (valid) validatedQuestions.push(valid);
    }

    if (validatedQuestions.length === 0) {
      throw new Error("AI response did not contain any validly formatted multiple-choice questions.");
    }

    return validatedQuestions;
  } catch (error) {
    // Structured error logging without exposing API key
    console.error("[AI Question Generation Error]:", {
      message: error.message,
      name: error.name,
      status: error.status || error.statusCode,
      timestamp: new Date().toISOString(),
    });

    // Clean, explicit error propagation (no silent fake mocks)
    throw new Error(`AI Exam Question Generation failed: ${error.message}`);
  }
};

export const generateFromJobDescription = async (jobDescription, count = 5, difficulty = "medium") => {
  if (!jobDescription || jobDescription.trim().length === 0) {
    throw new Error("Job description is required to generate assessment questions.");
  }

  const prompt = `
You are an expert technical assessor. Based on the following Job Description, generate exactly ${count} ${difficulty}-level multiple-choice assessment questions.

Job Description:
"""
${jobDescription}
"""

Requirements:
- Each question must evaluate relevant practical skills, competencies, and responsibilities required for this role.
- Each question must have 4 options.
- Exactly one option must be correct, with "isCorrect": true.
- Format the response STRICTLY as a JSON object containing a "questions" array:
{
  "questions": [
    {
      "questionText": "Question string here?",
      "difficulty": "${difficulty}",
      "options": [
        { "optionText": "Option A", "isCorrect": false },
        { "optionText": "Option B", "isCorrect": true },
        { "optionText": "Option C", "isCorrect": false },
        { "optionText": "Option D", "isCorrect": false }
      ]
    }
  ]
}
`.trim();

  return generateMCQs(prompt, count, difficulty);
};

export default generateMCQs;
