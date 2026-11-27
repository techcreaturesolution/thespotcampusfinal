import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    actor_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    actor_role: {
      type: String,
      required: true,
    },
    target_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    target_model: {
      type: String,
      required: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    college_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_college",
      default: null,
    },
    university_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_university",
      default: null,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    changed_fields: {
      type: [String],
      default: [],
    },
    previous_values: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    new_values: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip_address: {
      type: String,
      default: "",
    },
    user_agent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

AuditLogSchema.index({ target_user_id: 1, createdAt: -1 });
AuditLogSchema.index({ college_id: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.models.tbl_audit_log ||
  mongoose.model("tbl_audit_log", AuditLogSchema);
