import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectToMongoDB } from "../config/db.js";
import tbl_certification from "../modules/certifications/certification.model.js";
import tbl_resume from "../modules/student/resume.model.js";
import tbl_student from "../modules/student/student.model.js";
import { CERTIFICATION_STATUS, CERTIFICATION_VISIBILITY } from "../utils/constants.js";
import { sanitizePlainText } from "../modules/projects/projects.service.js";

dotenv.config();

/**
 * Forward migration: sync indexes on tbl_certification and non-destructively backfill
 * any legacy free-text tbl_resume.certifications strings without altering tbl_resume.
 */
export const up = async () => {
  await tbl_certification.syncIndexes();

  const resumes = await tbl_resume.find({ "certifications.0": { $exists: true } });
  let createdCount = 0;

  for (const resume of resumes) {
    const student = await tbl_student.findById(resume.student_id);
    if (!student || student.is_deleted) continue;

    let order = await tbl_certification.countDocuments({
      student_id: student._id,
      is_deleted: false,
    });

    for (const rawEntry of resume.certifications || []) {
      const cleanTitle = sanitizePlainText(rawEntry).slice(0, 150);
      if (cleanTitle.length < 2) continue;

      const normalizedTitle = cleanTitle.toLowerCase();
      const existing = await tbl_certification.findOne({
        student_id: student._id,
        normalized_title: normalizedTitle,
        is_deleted: false,
      });
      if (existing) continue;

      const fallbackIssuer = "Legacy Resume Entry";
      await tbl_certification.create({
        student_id: student._id,
        title: cleanTitle,
        normalized_title: normalizedTitle,
        issuing_organization: fallbackIssuer,
        normalized_issuer: fallbackIssuer.toLowerCase(),
        category: "Other",
        credential_id: "",
        normalized_credential_id: "",
        credential_url: "",
        issue_date: resume.updatedAt || resume.createdAt || new Date(),
        expiry_date: null,
        does_not_expire: true,
        description: "Backfilled from legacy resume entry",
        visibility: CERTIFICATION_VISIBILITY.PUBLIC,
        status: CERTIFICATION_STATUS.ACTIVE,
        display_order: order++,
        is_deleted: false,
      });
      createdCount++;
    }
  }

  return {
    resumesScanned: resumes.length,
    certificationsCreated: createdCount,
  };
};

/**
 * Non-destructive rollback note: leaves tbl_certification user data intact.
 */
export const down = async () => {
  return {
    rolledBack: true,
    note: "Non-destructive rollback: tbl_resume was preserved unchanged and user certification records remain intact.",
  };
};

if (process.argv[1] && process.argv[1].endsWith("migrateCertifications.js")) {
  const isRollback = process.argv.includes("--rollback") || process.argv.includes("--down");
  (async () => {
    await connectToMongoDB();
    const result = isRollback ? await down() : await up();
    console.log("S1-06 migration result:", JSON.stringify(result, null, 2));
    await mongoose.disconnect();
    process.exit(0);
  })().catch(async (err) => {
    console.error("S1-06 migration failed:", err);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore disconnect errors
    }
    process.exit(1);
  });
}
