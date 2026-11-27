import mongoose from "mongoose";
import {
  ACADEMIC_HISTORY_STAGE,
  ACADEMIC_HISTORY_STATUS,
  SCORE_TYPE,
} from "../../utils/constants.js";

const AcademicHistorySchema = new mongoose.Schema(
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
    university_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_university",
      default: null,
    },
    degree_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_degree",
      default: null,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_branch",
      default: null,
    },
    stage_type: {
      type: String,
      enum: Object.values(ACADEMIC_HISTORY_STAGE),
      required: true,
    },
    institution_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    board_or_university: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    program_name: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
    department_name: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
    academic_year: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },
    semester_or_year: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },
    start_year: {
      type: Number,
      required: true,
      min: 1970,
      max: 2100,
    },
    end_year: {
      type: Number,
      min: 1970,
      max: 2100,
      default: null,
    },
    score_type: {
      type: String,
      enum: Object.values(SCORE_TYPE),
      default: SCORE_TYPE.PERCENTAGE,
    },
    score_value: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },
    status: {
      type: String,
      enum: Object.values(ACADEMIC_HISTORY_STATUS),
      default: ACADEMIC_HISTORY_STATUS.COMPLETED,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    is_locked: {
      type: Boolean,
      default: false,
    },
    created_by_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    created_by_role: {
      type: String,
      default: "",
    },
    updated_by_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    updated_by_role: {
      type: String,
      default: "",
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

AcademicHistorySchema.index({ student_id: 1, is_deleted: 1, start_year: -1, createdAt: -1 });
AcademicHistorySchema.index({ college_id: 1, is_deleted: 1 });

export default mongoose.models.tbl_academic_history ||
  mongoose.model("tbl_academic_history", AcademicHistorySchema);
