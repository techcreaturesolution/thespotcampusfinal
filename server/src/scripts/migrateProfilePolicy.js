import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectToMongoDB } from "../config/db.js";
import tbl_student from "../modules/student/student.model.js";
import { PROFILE_VISIBILITY, PROFILE_VISIBILITY_OVERRIDE } from "../utils/constants.js";

dotenv.config();

/**
 * Forward migration: sync indexes on tbl_student and backfill conservative Private
 * defaults on legacy records without making any existing profile publicly visible.
 */
export const up = async () => {
  await tbl_student.syncIndexes();

  const result = await tbl_student.updateMany(
    {
      $or: [
        { profile_visibility: { $exists: false } },
        { is_published: { $exists: false } },
        { visibility_override: { $exists: false } },
      ],
    },
    {
      $set: {
        profile_visibility: PROFILE_VISIBILITY.PRIVATE,
        is_published: false,
        published_at: null,
        visibility_override: PROFILE_VISIBILITY_OVERRIDE.NONE,
        visibility_override_reason: "",
      },
    },
  );

  return {
    matched: result.matchedCount ?? 0,
    modified: result.modifiedCount ?? 0,
  };
};

export const rollback = async () => {
  const result = await tbl_student.updateMany(
    {},
    {
      $unset: {
        profile_visibility: "",
        is_published: "",
        published_at: "",
        visibility_updated_at: "",
        visibility_override: "",
        visibility_override_reason: "",
      },
    },
  );
  return { modified: result.modifiedCount ?? 0 };
};

if (process.argv[1]?.endsWith("migrateProfilePolicy.js")) {
  const isRollback = process.argv.includes("--rollback");
  await connectToMongoDB();
  try {
    const outcome = isRollback ? await rollback() : await up();
    console.log(
      `migrateProfilePolicy ${isRollback ? "rollback" : "up"} completed:`,
      JSON.stringify(outcome),
    );
  } finally {
    await mongoose.disconnect();
  }
}
