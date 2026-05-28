import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateMCQs = async (prompt) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0].message.content?.trim();
  if (!content) {
    throw new Error("Empty response from OpenAI.");
  }

  const match = content.match(/\[\s*{[\s\S]*}\s*]/);
  if (!match) {
    throw new Error("OpenAI returned invalid JSON format.");
  }

  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed)) {
    throw new Error("Parsed content is not an array.");
  }
  return parsed;
};

export const generateFromJobDescription = async (jobDescription, count, difficulty) => {
  const prompt = `
You are an expert exam question generator. Based on the following Job Description, generate exactly ${count} ${difficulty}-level multiple-choice questions that test the skills and knowledge required for this role.

Job Description:
"""
${jobDescription}
"""

Instructions:
- Questions must be relevant to the skills, technologies, and competencies mentioned in the JD.
- Each question must have 4 answer options.
- Only one option should be correct, marked with 'isCorrect: true'.
- Questions should assess practical knowledge, not just definitions.
- For ${difficulty} level: ${
    difficulty === "easy"
      ? "basic concepts and fundamentals"
      : difficulty === "medium"
      ? "applied knowledge and problem-solving"
      : "advanced scenarios and architectural decisions"
  }

Return ONLY a valid JSON array:
[
  {
    "questionText": "Question here?",
    "difficulty": "${difficulty}",
    "options": [
      { "optionText": "Option A", "isCorrect": false },
      { "optionText": "Option B", "isCorrect": true },
      { "optionText": "Option C", "isCorrect": false },
      { "optionText": "Option D", "isCorrect": false }
    ]
  }
]
`.trim();

  return generateMCQs(prompt);
};

export default generateMCQs;
