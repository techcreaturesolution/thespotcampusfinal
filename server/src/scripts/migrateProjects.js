import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectToMongoDB } from "../config/db.js";
import tbl_project from "../modules/projects/project.model.js";
import tbl_project_skill from "../modules/projects/projectSkill.model.js";
import tbl_resume from "../modules/student/resume.model.js";
import tbl_student from "../modules/student/student.model.js";
import tbl_skill, { normalizeSkillName } from "../modules/skills/skill.model.js";
import { PROJECT_STATUS, PROJECT_VISIBILITY } from "../utils/constants.js";
import { sanitizePlainText, validateAndNormalizeProjectUrl } from "../modules/projects/projects.service.js";

dotenv.config();

/**
 * Forward migration: sync indexes and backfill legacy tbl_resume.projects into tbl_project + tbl_project_skill.
 */
export const up = async () => {
  await Promise.all([tbl_project.syncIndexes(), tbl_project_skill.syncIndexes()]);

  const resumes = await tbl_resume.find({ "projects.0": { $exists: true } });
  let createdProjects = 0;
  let linkedSkills = 0;

  for (const resume of resumes) {
    const student = await tbl_student.findById(resume.student_id);
    if (!student || student.is_deleted) continue;

    let order = await tbl_project.countDocuments({ student_id: student._id, is_deleted: false });

    for (const legacyProj of resume.projects || []) {
      const cleanTitle = sanitizePlainText(legacyProj.title);
      if (!cleanTitle || cleanTitle.length < 2) continue;

      const existing = await tbl_project.findOne({
        student_id: student._id,
        title: cleanTitle,
        is_deleted: false,
      });
      if (existing) continue;

      let safeUrl = "";
      try {
        safeUrl = validateAndNormalizeProjectUrl(legacyProj.link, "project_url");
      } catch {
        safeUrl = "";
      }

      const cleanDesc = sanitizePlainText(legacyProj.description);
      const description =
        cleanDesc.length >= 10
          ? cleanDesc.slice(0, 2000)
          : `${cleanDesc || cleanTitle} (migrated from resume)`.slice(0, 2000);

      const proj = await tbl_project.create({
        student_id: student._id,
        college_id: student.college_id || null,
        title: cleanTitle.slice(0, 120),
        description,
        status: PROJECT_STATUS.COMPLETED,
        visibility: PROJECT_VISIBILITY.PUBLIC,
        project_url: safeUrl,
        display_order: order++,
        is_deleted: false,
      });
      createdProjects++;

      for (const tech of legacyProj.technologies || []) {
        const norm = normalizeSkillName(tech);
        if (!norm) continue;
        const skill = await tbl_skill.findOne({ normalized_name: norm, is_deleted: false, is_active: true });
        if (!skill) continue;
        const existsLink = await tbl_project_skill.findOne({
          project_id: proj._id,
          skill_id: skill._id,
          is_deleted: false,
        });
        if (!existsLink) {
          await tbl_project_skill.create({
            project_id: proj._id,
            student_id: student._id,
            skill_id: skill._id,
            is_deleted: false,
          });
          linkedSkills++;
        }
      }
    }
  }

  console.log(
    `Projects migration UP completed. Backfilled projects: ${createdProjects}, Linked skills: ${linkedSkills}`,
  );
  return { createdProjects, linkedSkills };
};

export const down = async () => {
  console.log("Projects migration DOWN: existing project records preserved safely (non-destructive).");
  return { rolledBack: true };
};

const isDirectExecution = process.argv[1] && process.argv[1].endsWith("migrateProjects.js");

if (isDirectExecution) {
  const isRollback = process.argv.includes("--rollback");
  connectToMongoDB()
    .then(async () => {
      if (isRollback) {
        await down();
      } else {
        await up();
      }
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("Projects migration failed:", err);
      await mongoose.disconnect();
      process.exit(1);
    });
}
