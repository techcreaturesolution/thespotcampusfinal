import mongoose from "mongoose";
import { SKILL_CATEGORIES } from "../../utils/constants.js";

/**
 * Normalize a skill name for case/whitespace-insensitive canonical matching.
 */
export const normalizeSkillName = (name) => {
  if (!name || typeof name !== "string") return "";
  return name.trim().replace(/\s+/g, " ").toLowerCase();
};

const SkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    normalized_name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 80,
    },
    category: {
      type: String,
      enum: SKILL_CATEGORIES,
      default: "Other",
      required: true,
    },
    aliases: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
    created_by_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    created_by_role: {
      type: String,
      default: "System",
    },
  },
  { timestamps: true },
);

SkillSchema.pre("validate", function (next) {
  if (this.name) {
    this.name = this.name.trim().replace(/\s+/g, " ");
    this.normalized_name = normalizeSkillName(this.name);
  }
  next();
});

SkillSchema.index(
  { normalized_name: 1 },
  { unique: true, partialFilterExpression: { is_deleted: false } },
);
SkillSchema.index({ is_active: 1, is_deleted: 1, category: 1, name: 1 });

export default mongoose.models.tbl_skill || mongoose.model("tbl_skill", SkillSchema);
