import mongoose from "mongoose";

const ProjectSkillSchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_project",
      required: true,
      index: true,
    },
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
    is_deleted: {
      type: Boolean,
      default: false,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

ProjectSkillSchema.index(
  { project_id: 1, skill_id: 1 },
  { unique: true, partialFilterExpression: { is_deleted: false } },
);
ProjectSkillSchema.index({ student_id: 1, is_deleted: 1 });

export default mongoose.models.tbl_project_skill ||
  mongoose.model("tbl_project_skill", ProjectSkillSchema);
