import mongoose from "mongoose";
import {
  RESUME_FONT_FAMILIES,
  RESUME_LAYOUT_COLUMNS,
  RESUME_PAGE_MARGINS,
  RESUME_SECTION_KEYS,
  RESUME_VERSION_STATUS,
  RESUME_VERSION_VISIBILITY,
} from "../../utils/constants.js";

const SectionConfigSchema = new mongoose.Schema(
  {
    section_key: {
      type: String,
      enum: RESUME_SECTION_KEYS,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const DEFAULT_SECTIONS = RESUME_SECTION_KEYS.map((key, idx) => ({
  section_key: key,
  enabled: true,
  order: idx,
}));

const ResumeVersionSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    normalized_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    target_role: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_cv_template",
      default: null,
    },
    font_family: {
      type: String,
      enum: RESUME_FONT_FAMILIES,
      default: "Inter",
    },
    color_theme: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "#3730a3",
    },
    layout_columns: {
      type: String,
      enum: RESUME_LAYOUT_COLUMNS,
      default: "two_column_left",
    },
    page_margin: {
      type: String,
      enum: RESUME_PAGE_MARGINS,
      default: "medium",
    },
    section_config: {
      type: [SectionConfigSchema],
      default: () => DEFAULT_SECTIONS,
    },
    // Canonical profile entity references ONLY (never duplicate underlying profile data)
    selected_skill_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tbl_student_skill",
      },
    ],
    selected_project_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tbl_project",
      },
    ],
    selected_certification_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tbl_certification",
      },
    ],
    selected_internship_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tbl_internship",
      },
    ],
    selected_education_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tbl_academic_history",
      },
    ],
    uploaded_document_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_document",
      default: null,
    },
    include_academic_summary: {
      type: Boolean,
      default: true,
    },
    include_skill_proficiency: {
      type: Boolean,
      default: true,
    },
    include_project_links: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: Object.values(RESUME_VERSION_STATUS),
      default: RESUME_VERSION_STATUS.ACTIVE,
      required: true,
    },
    visibility: {
      type: String,
      enum: Object.values(RESUME_VERSION_VISIBILITY),
      default: RESUME_VERSION_VISIBILITY.PRIVATE,
      required: true,
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    display_order: {
      type: Number,
      min: 0,
      default: 0,
    },
    share_token: {
      type: String,
      default: null,
    },
    share_enabled: {
      type: Boolean,
      default: false,
    },
    share_expires_at: {
      type: Date,
      default: null,
    },
    last_generated_at: {
      type: Date,
      default: null,
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

ResumeVersionSchema.index({
  student_id: 1,
  is_deleted: 1,
  is_default: -1,
  display_order: 1,
  updatedAt: -1,
});

// Enforce at most one default active resume version per student
ResumeVersionSchema.index(
  { student_id: 1, is_default: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: false, is_default: true },
  },
);

ResumeVersionSchema.index({ share_token: 1 }, { unique: true, sparse: true });

export default mongoose.models.tbl_resume_version ||
  mongoose.model("tbl_resume_version", ResumeVersionSchema);
