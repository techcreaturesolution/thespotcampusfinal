import mongoose from "mongoose";
import {
  INTERNSHIP_LINK_TYPES,
  INTERNSHIP_STATUS,
  INTERNSHIP_VISIBILITY,
  JOB_TYPE,
  WORK_MODE,
} from "../../utils/constants.js";

const InternshipLinkSchema = new mongoose.Schema(
  {
    link_type: {
      type: String,
      enum: Object.values(INTERNSHIP_LINK_TYPES),
      default: INTERNSHIP_LINK_TYPES.OTHER,
      required: true,
    },
    url: {
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
  },
  { _id: false },
);

const InternshipSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
      required: true,
      index: true,
    },
    role_title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    normalized_role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    organization_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    normalized_organization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    employment_type: {
      type: String,
      enum: Object.values(JOB_TYPE),
      default: JOB_TYPE.INTERNSHIP,
      required: true,
    },
    work_mode: {
      type: String,
      enum: Object.values(WORK_MODE),
      default: WORK_MODE.HYBRID,
      required: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      default: null,
    },
    currently_working: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    responsibilities: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    achievements: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
    },
    company_website: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    links: {
      type: [InternshipLinkSchema],
      default: [],
    },
    skill_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tbl_skill",
      },
    ],
    project_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tbl_project",
      },
    ],
    visibility: {
      type: String,
      enum: Object.values(INTERNSHIP_VISIBILITY),
      default: INTERNSHIP_VISIBILITY.PUBLIC,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(INTERNSHIP_STATUS),
      default: INTERNSHIP_STATUS.ACTIVE,
      required: true,
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

InternshipSchema.index({
  student_id: 1,
  is_deleted: 1,
  display_order: 1,
  currently_working: -1,
  start_date: -1,
});
InternshipSchema.index({ student_id: 1, status: 1, is_deleted: 1 });

export default mongoose.models.tbl_internship ||
  mongoose.model("tbl_internship", InternshipSchema);
