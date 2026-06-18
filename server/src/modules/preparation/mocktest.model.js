import mongoose from "mongoose";

const MockTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    test_type: {
      type: String,
      enum: ["company", "subject", "topic", "mixed"],
      required: true,
    },
    company_name: { type: String, default: "" },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_prep_subject", default: null },
    topic_id: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_prep_topic", default: null },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "tbl_prep_question" }],
    total_questions: { type: Number, required: true },
    duration_minutes: { type: Number, required: true },
    negative_marking: { type: Boolean, default: false },
    negative_mark_value: { type: Number, default: 0.25 },
    marks_per_question: { type: Number, default: 1 },
    passing_percentage: { type: Number, default: 40 },
    randomize_questions: { type: Boolean, default: true },
    is_active: { type: Boolean, default: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      default: "mixed",
    },
    attempts_count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MockTestSchema.index({ test_type: 1, is_active: 1 });
MockTestSchema.index({ company_name: 1 });
MockTestSchema.index({ subject_id: 1 });

export default mongoose.models.tbl_prep_mocktest || mongoose.model("tbl_prep_mocktest", MockTestSchema);
