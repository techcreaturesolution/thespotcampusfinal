import mongoose from "mongoose";
import { PROJECT_LINK_TYPES } from "../../utils/constants.js";

const ProjectLinkSchema = new mongoose.Schema(
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
    link_type: {
      type: String,
      enum: Object.values(PROJECT_LINK_TYPES),
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    normalized_url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    label: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
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

// Prevent duplicate normalized URL on the same active project
ProjectLinkSchema.index(
  { project_id: 1, normalized_url: 1 },
  { unique: true, partialFilterExpression: { is_deleted: false } },
);

// Enforce at most one canonical GitHub repository per active project
ProjectLinkSchema.index(
  { project_id: 1, link_type: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: false, link_type: "GITHUB_REPOSITORY" },
  },
);

ProjectLinkSchema.index({ project_id: 1, is_deleted: 1, display_order: 1, createdAt: 1 });

export default mongoose.models.tbl_project_link ||
  mongoose.model("tbl_project_link", ProjectLinkSchema);
