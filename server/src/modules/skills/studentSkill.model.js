import mongoose from "mongoose";
import { SKILL_PROFICIENCY } from "../../utils/constants.js";

const StudentSkillSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
      required: true,
      index: true,
    },
    skill_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_skill",
      required: true,
      index: true,
    },
    college_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_college",
      default: null,
    },
    proficiency: {
      type: String,
      enum: Object.values(SKILL_PROFICIENCY),
      default: SKILL_PROFICIENCY.INTERMEDIATE,
      required: true,
    },
    years_of_experience: {
      type: Number,
      min: 0,
      max: 50,
      default: null,
    },
    display_order: {
      type: Number,
      min: 0,
      default: 0,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
    deleted_by_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    deleted_by_role: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

StudentSkillSchema.index(
  { student_id: 1, skill_id: 1 },
  { unique: true, partialFilterExpression: { is_deleted: false } },
);
StudentSkillSchema.index({ student_id: 1, is_deleted: 1, display_order: 1, createdAt: 1 });
StudentSkillSchema.index({ student_id: 1, is_deleted: 1, proficiency: 1 });
StudentSkillSchema.index({ college_id: 1, skill_id: 1, is_deleted: 1 });

export default mongoose.models.tbl_student_skill ||
  mongoose.model("tbl_student_skill", StudentSkillSchema);
