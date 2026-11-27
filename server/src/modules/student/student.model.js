import mongoose from "mongoose";
import { STATUS, ACADEMIC_STATUS, PROFILE_VISIBILITY, PROFILE_VISIBILITY_OVERRIDE } from "../../utils/constants.js";

const StudentSchema = new mongoose.Schema(
  {
    college_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_college",
    },
    university_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_university",
    },
    degree_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_degree",
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_branch",
    },
    student_enrollment: {
      type: String,
      trim: true,
    },
    student_name: {
      type: String,
    },
    student_email: {
      type: String,
    },
    student_contact: {
      type: String,
    },
    student_current_sem: {
      type: String,
      trim: true,
    },
    student_total_backlog: {
      type: String,
      default: "0",
    },
    academic_year: {
      type: String,
      trim: true,
    },
    academic_batch: {
      type: String,
      trim: true,
    },
    academic_status: {
      type: String,
      enum: Object.values(ACADEMIC_STATUS),
      default: ACADEMIC_STATUS.ACTIVE,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    admission_year: {
      type: Number,
      min: 1990,
      max: 2100,
      default: null,
    },
    expected_graduation_year: {
      type: Number,
      min: 1990,
      max: 2100,
      default: null,
    },
    academic_profile_initialized: {
      type: Boolean,
      default: false,
    },
    academic_profile_updated_at: {
      type: Date,
      default: null,
    },
    student_skills: {
      type: String,
    },
    student_last_marksheet: {
      type: String,
    },
    student_last_marksheetPublicID: {
      type: String,
    },
    student_image: {
      type: String,
    },
    student_imagePublicID: {
      type: String,
    },
    student_status: {
      type: String,
      default: STATUS.DEACTIVE,
    },
    isVerifiedByTPO: {
      type: Boolean,
      default: false,
    },
    profile_visibility: {
      type: String,
      enum: Object.values(PROFILE_VISIBILITY),
      default: PROFILE_VISIBILITY.PRIVATE,
    },
    is_published: {
      type: Boolean,
      default: false,
    },
    published_at: {
      type: Date,
      default: null,
    },
    visibility_updated_at: {
      type: Date,
      default: null,
    },
    visibility_override: {
      type: String,
      enum: Object.values(PROFILE_VISIBILITY_OVERRIDE),
      default: PROFILE_VISIBILITY_OVERRIDE.NONE,
    },
    visibility_override_reason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    student_password: {
      type: String,
    },
    role: {
      type: String,
      default: "Student",
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

StudentSchema.index({ college_id: 1, degree_id: 1, branch_id: 1 });
StudentSchema.index({ university_id: 1 });
StudentSchema.index({ college_id: 1, student_enrollment: 1 });
StudentSchema.index({ is_published: 1, profile_visibility: 1, is_deleted: 1 });

StudentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.student_password;
  return obj;
};

export default mongoose.models.tbl_student || mongoose.model("tbl_student", StudentSchema);
