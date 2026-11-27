import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectToMongoDB } from "../config/db.js";
import tbl_internship from "../modules/internships/internship.model.js";
import tbl_resume from "../modules/student/resume.model.js";
import tbl_student from "../modules/student/student.model.js";
import {
  INTERNSHIP_STATUS,
  INTERNSHIP_VISIBILITY,
  JOB_TYPE,
  WORK_MODE,
} from "../utils/constants.js";
import { sanitizePlainText } from "../modules/projects/projects.service.js";

dotenv.config();

const parseSafeDate = (raw, fallbackDate) => {
  if (!raw) return fallbackDate;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? fallbackDate : parsed;
};

/**
 * Forward migration: sync indexes on tbl_internship and non-destructively backfill
 * legacy tbl_resume.experience entries without altering tbl_resume.
 */
export const up = async () => {
  await tbl_internship.syncIndexes();

  const resumes = await tbl_resume.find({ "experience.0": { $exists: true } });
  let createdCount = 0;

  for (const resume of resumes) {
    const student = await tbl_student.findById(resume.student_id);
    if (!student || student.is_deleted) continue;

    let order = await tbl_internship.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });

    for (const legacyExp of resume.experience || []) {
      const roleTitle = sanitizePlainText(legacyExp.role || "Intern").slice(0, 120);
      const orgName = sanitizePlainText(legacyExp.company).slice(0, 120);
      if (roleTitle.length < 2 || orgName.length < 2) continue;

      const normalizedRole = roleTitle.toLowerCase();
      const normalizedOrg = orgName.toLowerCase();
      const existing = await tbl_internship.findOne({
        student_id: student._id,
        normalized_organization: normalizedOrg,
        normalized_role: normalizedRole,
        is_deleted: false,
      });
      if (existing) continue;

      const fallbackStart = resume.createdAt || new Date();
      const startDate = parseSafeDate(legacyExp.startDate, fallbackStart);
      const rawEnd = String(legacyExp.endDate || "").trim();
      const currentlyWorking = /present|current/i.test(rawEnd);
      const parsedEnd = currentlyWorking ? null : parseSafeDate(rawEnd, startDate);
      const safeEnd = parsedEnd && parsedEnd >= startDate ? parsedEnd : currentlyWorking ? null : startDate;

      await tbl_internship.create({
        student_id: student._id,
        role_title: roleTitle,
        normalized_role: normalizedRole,
        organization_name: orgName,
        normalized_organization: normalizedOrg,
        employment_type: JOB_TYPE.INTERNSHIP,
        work_mode: WORK_MODE.HYBRID,
        start_date: startDate,
        end_date: safeEnd,
        currently_working: currentlyWorking,
        description: sanitizePlainText(legacyExp.description).slice(0, 2000),
        visibility: INTERNSHIP_VISIBILITY.PUBLIC,
        status: INTERNSHIP_STATUS.ACTIVE,
        display_order: order++,
        is_deleted: false,
      });
      createdCount++;
    }
  }

  return {
    resumesScanned: resumes.length,
    internshipsCreated: createdCount,
  };
};

export const down = async () => {
  return {
    rolledBack: true,
    note: "Non-destructive rollback: tbl_resume.experience was preserved untouched and user internship records remain intact.",
  };
};

if (process.argv[1] && process.argv[1].endsWith("migrateInternships.js")) {
  const isRollback = process.argv.includes("--rollback") || process.argv.includes("--down");
  (async () => {
    await connectToMongoDB();
    const result = isRollback ? await down() : await up();
    console.log("S1-07 migration result:", JSON.stringify(result, null, 2));
    await mongoose.disconnect();
    process.exit(0);
  })().catch(async (err) => {
    console.error("S1-07 migration failed:", err);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  });
}
