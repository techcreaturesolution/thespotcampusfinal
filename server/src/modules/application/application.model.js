import mongoose from "mongoose";
import { STATUS } from "../../utils/constants.js";

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
    // Multi-round tracking
    current_round: { type: Number, default: 0 },
    total_rounds: { type: Number, default: 0 },
    round_status: {
      type: String,
      enum: ["not_started", "in_progress", "all_cleared", "eliminated", "withdrawn"],
      default: "not_started",
    },
    final_result: {
      type: String,
      enum: ["pending", "selected", "rejected", "on_hold", "withdrawn"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("tbl_application", ApplicationSchema);
