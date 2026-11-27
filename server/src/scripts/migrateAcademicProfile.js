import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectToMongoDB } from "../config/db.js";
import tbl_student from "../modules/student/student.model.js";
import tbl_academic_history from "../modules/academicProfile/academicHistory.model.js";
import tbl_audit_log from "../modules/audit/auditLog.model.js";
import { ACADEMIC_STATUS } from "../utils/constants.js";

dotenv.config();

/**
 * Inspect existing student records for data anomalies before applying migration changes.
 */
export const inspectExistingAcademicData = async (StudentModel = tbl_student) => {
  const totalStudents = await StudentModel.countDocuments({});
  const missingCollege = await StudentModel.countDocuments({ college_id: { $in: [null, undefined] } });
  const missingDegree = await StudentModel.countDocuments({ degree_id: { $in: [null, undefined] } });
  const missingBranch = await StudentModel.countDocuments({ branch_id: { $in: [null, undefined] } });

  const duplicateEnrollments = await StudentModel.aggregate([
    {
      $match: {
        college_id: { $ne: null },
        student_enrollment: { $exists: true, $nin: [null, ""] },
      },
    },
    {
      $group: {
        _id: {
          college_id: "$college_id",
          enrollment: { $toLower: { $trim: { input: "$student_enrollment" } } },
        },
        count: { $sum: 1 },
        studentIds: { $push: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  return {
    totalStudents,
    missingCollege,
    missingDegree,
    missingBranch,
    duplicateEnrollments,
  };
};

/**
 * Forward migration (non-destructive, idempotent).
 */
export const up = async () => {
  const report = await inspectExistingAcademicData();
  console.log("Pre-migration inspection:", JSON.stringify(report, null, 2));

  if (report.duplicateEnrollments.length > 0) {
    console.warn(
      `Warning: Found ${report.duplicateEnrollments.length} duplicate enrollment groups within the same college. Keeping non-unique compound index to avoid destructive data loss.`,
    );
  }

  const updateResult = await tbl_student.updateMany(
    {
      $or: [
        { academic_status: { $exists: false } },
        { student_total_backlog: { $exists: false } },
        { is_deleted: { $exists: false } },
      ],
    },
    [
      {
        $set: {
          academic_status: { $ifNull: ["$academic_status", ACADEMIC_STATUS.ACTIVE] },
          student_total_backlog: { $ifNull: ["$student_total_backlog", "0"] },
          is_deleted: { $ifNull: ["$is_deleted", false] },
          academic_profile_initialized: {
            $ifNull: [
              "$academic_profile_initialized",
              {
                $and: [
                  { $ne: ["$college_id", null] },
                  { $ne: ["$degree_id", null] },
                  { $ne: ["$branch_id", null] },
                ],
              },
            ],
          },
        },
      },
    ],
  );

  await Promise.all([
    tbl_student.syncIndexes(),
    tbl_academic_history.syncIndexes(),
    tbl_audit_log.syncIndexes(),
  ]);

  console.log(`Academic Profile migration UP completed. Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);
  return { report, updateResult };
};

/**
 * Rollback migration (restores added metadata fields only, does not delete student records).
 */
export const down = async () => {
  const rollbackResult = await tbl_student.updateMany(
    {},
    {
      $unset: {
        academic_year: "",
        academic_batch: "",
        academic_status: "",
        cgpa: "",
        percentage: "",
        admission_year: "",
        expected_graduation_year: "",
        academic_profile_initialized: "",
        academic_profile_updated_at: "",
        is_deleted: "",
        deleted_at: "",
      },
    },
  );

  console.log(`Academic Profile migration DOWN (rollback) completed. Modified: ${rollbackResult.modifiedCount}`);
  return rollbackResult;
};

const isDirectExecution = process.argv[1] && process.argv[1].endsWith("migrateAcademicProfile.js");

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
      console.error("Migration failed:", err);
      await mongoose.disconnect();
      process.exit(1);
    });
}
