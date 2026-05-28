import mongoose from "mongoose";
import { STATUS } from "../utils/constants.js";

const ApplicationSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
    },
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_jobpost",
    },
    company_reason: String,
    student_reason: String,
    application_current_status: {
      type: String,
      default: STATUS.DEACTIVE,
    },
    application_status: {
      type: String,
      default: STATUS.DEACTIVE,
    },
    student_decision: {
      type: String,
      default: STATUS.DEACTIVE,
    },
  },
  { timestamps: true }
);

export default mongoose.model("tbl_application", ApplicationSchema);
