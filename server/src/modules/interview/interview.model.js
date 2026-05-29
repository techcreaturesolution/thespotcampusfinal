import mongoose from "mongoose";
import { INTERVIEW_STATUS } from "../../utils/constants.js";

const InterviewSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_jobpost",
      required: true,
    },
    round_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_company",
      required: true,
    },
    candidate_round_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_candidate_round",
    },
    interview_mode: {
      type: String,
      enum: ["video_conference", "in_person", "phone"],
      default: "video_conference",
    },
    scheduled_at: { type: Date, required: true },
    duration_minutes: { type: Number, default: 60 },
    // Video conference
    room_id: { type: String, unique: true, sparse: true },
    meeting_link: { type: String, default: "" },
    // Status
    status: {
      type: String,
      enum: Object.values(INTERVIEW_STATUS),
      default: INTERVIEW_STATUS.SCHEDULED,
    },
    started_at: { type: Date },
    ended_at: { type: Date },
    // Evaluation
    interviewer_notes: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 10, default: null },
    recommendation: {
      type: String,
      enum: ["strong_yes", "yes", "maybe", "no", "strong_no", ""],
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("tbl_interview", InterviewSchema);
