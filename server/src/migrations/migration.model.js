import mongoose from "mongoose";

const MigrationHistorySchema = new mongoose.Schema(
  {
    migrationId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "running", "applied", "failed", "rolled_back"],
      default: "pending",
    },
    checksum: { type: String },
    appliedAt: { type: Date },
    rolledBackAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("tbl_migration_history", MigrationHistorySchema);
