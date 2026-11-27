import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectToMongoDB } from "../config/db.js";
import tbl_skill, { normalizeSkillName } from "../modules/skills/skill.model.js";
import tbl_student_skill from "../modules/skills/studentSkill.model.js";
import tbl_student from "../modules/student/student.model.js";
import { DEFAULT_CANONICAL_SKILLS, SKILL_PROFICIENCY } from "../utils/constants.js";

dotenv.config();

/**
 * Forward migration: seed canonical skills and safely backfill legacy comma-separated student_skills.
 */
export const up = async () => {
  await Promise.all([tbl_skill.syncIndexes(), tbl_student_skill.syncIndexes()]);

  let seededCount = 0;
  for (const item of DEFAULT_CANONICAL_SKILLS) {
    const normalized = normalizeSkillName(item.name);
    const existing = await tbl_skill.findOne({ normalized_name: normalized, is_deleted: false });
    if (!existing) {
      await tbl_skill.create({
        name: item.name,
        normalized_name: normalized,
        category: item.category,
        is_active: true,
        is_deleted: false,
        created_by_role: "Migration",
      });
      seededCount++;
    }
  }

  const students = await tbl_student.find({
    is_deleted: { $ne: true },
    student_skills: { $exists: true, $nin: [null, ""] },
  });

  let migratedAssociations = 0;
  for (const student of students) {
    const tokens = String(student.student_skills)
      .split(",")
      .map((s) => s.trim().replace(/\s+/g, " "))
      .filter(Boolean);

    let order = await tbl_student_skill.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });

    for (const rawName of tokens) {
      const normalized = normalizeSkillName(rawName);
      if (!normalized) continue;

      let skill = await tbl_skill.findOne({ normalized_name: normalized, is_deleted: false });
      if (!skill) {
        skill = await tbl_skill.create({
          name: rawName.slice(0, 80),
          normalized_name: normalized,
          category: "Other",
          is_active: true,
          is_deleted: false,
          created_by_role: "Migration",
        });
      }

      const exists = await tbl_student_skill.findOne({
        student_id: student._id,
        skill_id: skill._id,
        is_deleted: false,
      });

      if (!exists) {
        await tbl_student_skill.create({
          student_id: student._id,
          skill_id: skill._id,
          college_id: student.college_id || null,
          proficiency: SKILL_PROFICIENCY.INTERMEDIATE,
          display_order: order++,
          is_deleted: false,
        });
        migratedAssociations++;
      }
    }
  }

  console.log(
    `Technical Skills migration UP completed. Seeded canonical skills: ${seededCount}, Backfilled student skills: ${migratedAssociations}`,
  );
  return { seededCount, migratedAssociations };
};

/**
 * Rollback migration: removes only records created by Migration without deleting legacy student_skills strings.
 */
export const down = async () => {
  const migrationSkills = await tbl_skill.find({ created_by_role: "Migration" }).select("_id");
  const skillIds = migrationSkills.map((s) => s._id);
  const removedAssociations = await tbl_student_skill.deleteMany({
    skill_id: { $in: skillIds },
  });
  const removedSkills = await tbl_skill.deleteMany({ created_by_role: "Migration" });

  console.log(
    `Technical Skills migration DOWN completed. Removed associations: ${removedAssociations.deletedCount}, Removed seeded skills: ${removedSkills.deletedCount}`,
  );
  return { removedAssociations, removedSkills };
};

const isDirectExecution = process.argv[1] && process.argv[1].endsWith("migrateTechnicalSkills.js");

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
      console.error("Technical Skills migration failed:", err);
      await mongoose.disconnect();
      process.exit(1);
    });
}
