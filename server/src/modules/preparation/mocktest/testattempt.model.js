import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tbl_prep_question",
    required: true,
  },
  selected_option: {
    type: Number,
    default: -1,
  },
  is_correct: {
    type: Boolean,
    default: false,
  },
  is_skipped: {
    type: Boolean,
    default: true,
  },
  time_spent_seconds: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const TestAttemptSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
      required: true,
    },
    test_type: {
      type: String,
      enum: ["mock_test", "practice", "daily_challenge", "previous_year"],
      required: true,
    },
    mock_test_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_prep_mocktest",
      default: null,
    },
    subject_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_prep_subject",
      default: null,
    },
    answers: [AnswerSchema],
    total_questions: {
      type: Number,
      required: true,
    },
    correct_answers: {
      type: Number,
      default: 0,
    },
    wrong_answers: {
      type: Number,
      default: 0,
    },
    skipped: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    max_score: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    time_taken_seconds: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
    started_at: {
      type: Date,
      default: Date.now,
    },
    completed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

TestAttemptSchema.index({ student_id: 1, test_type: 1 });
TestAttemptSchema.index({ student_id: 1, mock_test_id: 1 });
TestAttemptSchema.index({ student_id: 1, status: 1 });
TestAttemptSchema.index({ student_id: 1, createdAt: -1 });

export default mongoose.models.tbl_prep_testattempt || mongoose.model("tbl_prep_testattempt", TestAttemptSchema);
