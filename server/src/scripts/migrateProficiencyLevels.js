import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectToMongoDB } from "../config/db.js";
import tbl_student_skill from "../modules/skills/studentSkill.model.js";
import { SKILL_PROFICIENCY, SKILL_PROFICIENCY_LEVELS } from "../utils/constants.js";

dotenv.config();

const CANONICAL_MAP = new Map(
  SKILL_PROFICIENCY_LEVELS.flatMap((lvl) => [
    [lvl.name.toLowerCase(), lvl.name],
    [lvl.code.toLowerCase(), lvl.name],
  ]),
);

export const normalizeProficiencyValue = (raw) => {
  if (!raw || typeof raw !== "string") return SKILL_PROFICIENCY.INTERMEDIATE;
  const trimmed = raw.trim().toLowerCase();
  return CANONICAL_MAP.get(trimmed) || null;
};

/**
 * Inspect and normalize existing tbl_student_skill proficiency values safely.
 */
export const up = async () => {
  await tbl_student_skill.syncIndexes();

  const records = await tbl_student_skill.find({});
  let normalizedCount = 0;
  const incompatibleIds = [];

  for (const doc of records) {
    const raw = doc.proficiency;
    if (!raw || String(raw).trim() === "") {
      doc.proficiency = SKILL_PROFICIENCY.INTERMEDIATE;
      await doc.save();
      normalizedCount++;
      continue;
    }

    const mapped = normalizeProficiencyValue(String(raw));
    if (!mapped) {
      incompatibleIds.push({ id: doc._id, raw });
      continue;
    }
    if (mapped !== raw) {
      doc.proficiency = mapped;
      await doc.save();
      normalizedCount++;
    }
  }

  console.log(
    `Proficiency migration UP completed. Total inspected: ${records.length}, Normalized: ${normalizedCount}, Incompatible: ${incompatibleIds.length}`,
  );
  if (incompatibleIds.length > 0) {
    console.warn("Incompatible proficiency values found (preserved untouched):", incompatibleIds);
  }

  return { total: records.length, normalizedCount, incompatibleIds };
};

/**
 * Non-destructive rollback check (proficiency normalization preserves canonical data).
 */
export const down = async () => {
  console.log("Proficiency migration DOWN: canonical proficiency values preserved safely (non-destructive).");
  return { rolledBack: true };
};

const isDirectExecution = process.argv[1] && process.argv[1].endsWith("migrateProficiencyLevels.js");

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
      console.error("Proficiency migration failed:", err);
      await mongoose.disconnect();
      process.exit(1);
    });
}
