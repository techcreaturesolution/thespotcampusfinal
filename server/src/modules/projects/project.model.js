import mongoose from "mongoose";
import { PROJECT_STATUS, PROJECT_VISIBILITY } from "../../utils/constants.js";

const ProjectSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
      required: true,
      index: true,
    },
    college_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_college",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    role: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUS),
      default: PROJECT_STATUS.COMPLETED,
      required: true,
    },
    visibility: {
      type: String,
      enum: Object.values(PROJECT_VISIBILITY),
      default: PROJECT_VISIBILITY.PUBLIC,
      required: true,
    },
    is_ongoing: {
      type: Boolean,
      default: false,
    },
    start_date: {
      type: Date,
      default: null,
    },
    end_date: {
      type: Date,
      default: null,
    },
    team_size: {
      type: Number,
      min: 1,
      max: 100,
      default: 1,
    },
    project_url: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    repository_url: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    live_demo_url: {
      type: String,
      trim: true,
      maxlength: 500,
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

ProjectSchema.index({ student_id: 1, is_deleted: 1, display_order: 1, createdAt: -1 });
ProjectSchema.index({ college_id: 1, is_deleted: 1, status: 1 });

export default mongoose.models.tbl_project || mongoose.model("tbl_project", ProjectSchema);
