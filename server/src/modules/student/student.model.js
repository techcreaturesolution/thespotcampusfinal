import mongoose from "mongoose";
import { STATUS } from "../../utils/constants.js";

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
    },
    student_total_backlog: {
      type: String,
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
    student_password: {
      type: String,
    },
    role: {
      type: String,
      default: "Student",
    },
  },
  { timestamps: true },
);

StudentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.student_password;
  return obj;
};

export default mongoose.models.tbl_student || mongoose.model("tbl_student", StudentSchema);
