import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectToMongoDB } from "../config/db.js";
import tbl_resume_version from "../modules/resumeVersions/resumeVersion.model.js";
import tbl_resume from "../modules/student/resume.model.js";
import tbl_student from "../modules/student/student.model.js";
import tbl_student_skill from "../modules/skills/studentSkill.model.js";
import tbl_project from "../modules/projects/project.model.js";
import tbl_certification from "../modules/certifications/certification.model.js";
import tbl_internship from "../modules/internships/internship.model.js";
import tbl_academic_history from "../modules/academicProfile/academicHistory.model.js";
import { RESUME_SECTION_KEYS, RESUME_VERSION_STATUS, RESUME_VERSION_VISIBILITY } from "../utils/constants.js";
import { sanitizePlainText } from "../modules/projects/projects.service.js";

dotenv.config();

/**
 * Forward migration: sync indexes on tbl_resume_version and create an initial default version
 * referencing each existing student's canonical S1-01..S1-07 items without touching tbl_resume.
 */
export const up = async () => {
  await tbl_resume_version.syncIndexes();

  const legacyResumes = await tbl_resume.find({});
  let createdVersions = 0;

  for (const resume of legacyResumes) {
    const student = await tbl_student.findById(resume.student_id);
    if (!student || student.is_deleted) continue;

    const existingCount = await tbl_resume_version.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });
    if (existingCount > 0) continue;

    const [skills, projects, certs, internships, histories] = await Promise.all([
      tbl_student_skill.find({ student_id: student._id, is_deleted: false }).select("_id"),
      tbl_project.find({ student_id: student._id, is_deleted: false }).select("_id"),
      tbl_certification.find({ student_id: student._id, is_deleted: false }).select("_id"),
      tbl_internship.find({ student_id: student._id, is_deleted: false }).select("_id"),
      tbl_academic_history.find({ student_id: student._id, is_deleted: false }).select("_id"),
    ]);

    const name = "Default Resume";
    await tbl_resume_version.create({
      student_id: student._id,
      name,
      normalized_name: name.toLowerCase(),
      description: "Migrated default resume version",
      target_role: sanitizePlainText(resume.punch_line).slice(0, 120),
      summary: sanitizePlainText(resume.chosen_summary).slice(0, 2000),
      template_id: resume.selected_template_id || null,
      font_family: resume.font_family || "Inter",
      color_theme: resume.color_theme || "#3730a3",
      layout_columns: resume.layout_columns || "two_column_left",
      page_margin: resume.page_margin || "medium",
      section_config: RESUME_SECTION_KEYS.map((key, idx) => ({
        section_key: key,
        enabled: true,
        order: idx,
      })),
      selected_skill_ids: skills.map((s) => s._id),
      selected_project_ids: projects.map((p) => p._id),
      selected_certification_ids: certs.map((c) => c._id),
      selected_internship_ids: internships.map((i) => i._id),
      selected_education_ids: histories.map((h) => h._id),
      status: RESUME_VERSION_STATUS.ACTIVE,
      visibility: RESUME_VERSION_VISIBILITY.PRIVATE,
      is_default: true,
      display_order: 0,
      is_deleted: false,
    });
    createdVersions++;
  }

  return {
    legacyResumesScanned: legacyResumes.length,
    versionsCreated: createdVersions,
  };
};

export const down = async () => {
  return {
    rolledBack: true,
    note: "Non-destructive rollback: legacy tbl_resume remains unchanged.",
  };
};

if (process.argv[1] && process.argv[1].endsWith("migrateResumeVersions.js")) {
  const isRollback = process.argv.includes("--rollback") || process.argv.includes("--down");
  (async () => {
    await connectToMongoDB();
    const result = isRollback ? await down() : await up();
    console.log("S1-08 migration result:", JSON.stringify(result, null, 2));
    await mongoose.disconnect();
    process.exit(0);
  })().catch(async (err) => {
    console.error("S1-08 migration failed:", err);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  });
}
