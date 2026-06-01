import mongoose from "mongoose";
import { CANDIDATE_ROUND_STATUS } from "../../utils/constants.js";

const CandidateRoundSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_jobpost",
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
      required: true,
    },
    application_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_application",
      required: true,
    },
    round_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    round_number: { type: Number, required: true },
    round_type: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(CANDIDATE_ROUND_STATUS),
      default: CANDIDATE_ROUND_STATUS.PENDING,
    },
    score: { type: Number, default: null },
    max_score: { type: Number, default: null },
    remarks: { type: String, default: "" },
    feedback: { type: String, default: "" },
    evaluated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_company",
    },
    started_at: { type: Date },
    completed_at: { type: Date },
  },
  { timestamps: true },
);

CandidateRoundSchema.index(
  { job_id: 1, student_id: 1, round_number: 1 },
  { unique: true },
);

export default mongoose.model("tbl_candidate_round", CandidateRoundSchema);
