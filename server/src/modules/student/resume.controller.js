import tbl_resume from "./resume.model.js";
import { StatusCodes } from "http-status-codes";
import { OpenAI } from "openai";


export const getResume = async (req, res) => {
  try {
    const resume = await tbl_resume.findOne({ student_id: req.user.userId });
    res.status(StatusCodes.OK).json({ resume });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const saveResume = async (req, res) => {
  try {
    const student_id = req.user.userId;
    const updateData = { ...req.body };
    
    // Remove empty selected_template_id to avoid Mongoose CastError
    if (updateData.selected_template_id === "" || updateData.selected_template_id === null) {
      delete updateData.selected_template_id;
    }

    // Server-side enforcement of limits to fit in 1 page:
    if (updateData.education) {
      updateData.education = updateData.education.slice(0, 2);
    }
    if (updateData.skills) {
      updateData.skills = updateData.skills.slice(0, 5);
    }
    if (updateData.languages) {
      updateData.languages = updateData.languages.slice(0, 3);
    }
    if (updateData.projects) {
      updateData.projects = updateData.projects.slice(0, 2).map((proj) => ({
        ...proj,
        description: proj.description ? proj.description.slice(0, 200) : "",
      }));
    }
    if (updateData.experience) {
      updateData.experience = updateData.experience.slice(0, 2).map((exp) => ({
        ...exp,
        description: exp.description ? exp.description.slice(0, 200) : "",
      }));
    }
    if (updateData.certifications) {
      updateData.certifications = updateData.certifications.slice(0, 3);
    }
    if (updateData.chosen_summary) {
      updateData.chosen_summary = updateData.chosen_summary.slice(0, 300);
    }

    // Force clear social/portfolio links since we only keep phone and email in contact details
    updateData.linkedin = "";
    updateData.github = "";
    updateData.portfolio = "";

    let resume = await tbl_resume.findOne({ student_id });

    if (resume) {
      if (!updateData.selected_template_id) {
        resume = await tbl_resume.findOneAndUpdate(
          { student_id },
          { $set: updateData, $unset: { selected_template_id: "" } },
          { new: true }
        );
      } else {
        resume = await tbl_resume.findOneAndUpdate({ student_id }, updateData, { new: true });
      }
    } else {
      resume = await tbl_resume.create({ student_id, ...updateData });
    }
    res.status(StatusCodes.OK).json({ msg: "Resume details saved successfully", resume });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const generateAiSummaries = async (req, res) => {
  try {
    const student_id = req.user.userId;
    const { skills, projects, education, punch_line } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "OpenAI API Key is missing on the server. Please check configurations." });
    }

    if (!skills) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Skills details are required to generate summaries." });
    }

    const prompt = `
      You are a professional resume writer. Based on the following student details:
      Job Title/Punchline: ${punch_line || "Software Engineer / Fresher"}
      Education: ${JSON.stringify(education || [])}
      Skills: ${JSON.stringify(skills)}
      Projects: ${JSON.stringify(projects || [])}

      Generate exactly 5 distinct professional resume summary options (approx 2-3 sentences each) written in the first person.
      Vary the tone of each:
      1. Classic & Professional: Emphasize dedication, solid academic background, and core technical skills.
      2. Modern & Tech-focused: Highlight passion for modern stacks, rapid learning, and hands-on coding.
      3. Creative & High-energy: Showcase problem-solving drive, innovation, and active participation in project groups or hackathons.
      4. Minimalist & Direct: Clean, crisp description focusing strictly on key engineering goals and primary skills.
      5. Results-oriented / Metric-driven: Focus on project accomplishments, performance metrics, and technological outputs.

      Return the response STRICTLY as a JSON object with a single key "summaries" containing an array of exactly 5 strings.
      Format example: { "summaries": ["summary 1", "summary 2", "summary 3", "summary 4", "summary 5"] }
    `;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const parsedData = JSON.parse(response.choices[0].message.content);
    const summaries = parsedData.summaries || [];

    // Save generated summaries to the database so they persist
    await tbl_resume.findOneAndUpdate(
      { student_id },
      { $set: { ai_summaries: summaries } },
      { new: true }
    );

    res.status(StatusCodes.OK).json({ summaries });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
