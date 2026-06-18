import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_prep_subject", required: true },
    topic_id: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_prep_topic", required: true },
    company_id: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_company", default: null },
    company_name: { type: String, default: "" },
    year: { type: Number, default: null },
    question_text: { type: String, required: true },
    options: [
      {
        text: { type: String, required: true },
        is_correct: { type: Boolean, default: false },
      },
    ],
    correct_option_index: { type: Number, required: true },
    explanation: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    tags: [{ type: String }],
    is_active: { type: Boolean, default: true },
    is_previous_year: { type: Boolean, default: false },
  },
  { timestamps: true }
);

QuestionSchema.index({ subject_id: 1, topic_id: 1, difficulty: 1 });
QuestionSchema.index({ company_name: 1, is_previous_year: 1 });
QuestionSchema.index({ is_active: 1, difficulty: 1 });
QuestionSchema.index({ tags: 1 });

export default mongoose.models.tbl_prep_question || mongoose.model("tbl_prep_question", QuestionSchema);
