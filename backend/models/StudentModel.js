import mongoose from "mongoose";
import { STATUS } from "../utils/constants.js";

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
    student_enrollment: String,
    student_name: String,
    student_email: String,
    student_contact: String,
    student_current_sem: String,
    student_total_backlog: String,
    student_skills: String,
    student_last_marksheet: String,
    student_last_marksheetPublicID: String,
    student_image: String,
    student_imagePublicID: String,
    student_status: {
      type: String,
      default: STATUS.DEACTIVE,
    },
    student_password: String,
    role: {
      type: String,
      default: "Student",
    },
  },
  { timestamps: true }
);

StudentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.student_password;
  return obj;
};

export default mongoose.model("tbl_student", StudentSchema);
