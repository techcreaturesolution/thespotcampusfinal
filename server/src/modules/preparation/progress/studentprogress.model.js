import mongoose from "mongoose";

const SubjectProgressSchema = new mongoose.Schema({
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tbl_prep_subject",
  },
  subject_name: {
    type: String,
  },
  questions_attempted: {
    type: Number,
    default: 0,
  },
  correct_answers: {
    type: Number,
    default: 0,
  },
  accuracy: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const StudentProgressSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
      required: true,
      unique: true,
    },
    total_questions_solved: {
      type: Number,
      default: 0,
    },
    total_correct: {
      type: Number,
      default: 0,
    },
    tests_attempted: {
      type: Number,
      default: 0,
    },
    overall_accuracy: {
      type: Number,
      default: 0,
    },
    current_streak: {
      type: Number,
      default: 0,
    },
    longest_streak: {
      type: Number,
      default: 0,
    },
    last_active_date: {
      type: String,
      default: "",
    },
    daily_challenge_streak: {
      type: Number,
      default: 0,
    },
    daily_challenges_completed: {
      type: Number,
      default: 0,
    },
    subject_progress: [SubjectProgressSchema],
    weekly_activity: [
      {
        date: {
          type: String,
        },
        questions_solved: {
          type: Number,
          default: 0,
        },
        correct: {
          type: Number,
          default: 0,
        },
      },
    ],
    reading_progress: [
      {
        pdf_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "tbl_prep_pdfmaterial",
        },
        last_page: {
          type: Number,
          default: 0,
        },
        total_pages: {
          type: Number,
          default: 0,
        },
        progress_percent: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

StudentProgressSchema.index({ student_id: 1 }, {
  unique: true,
});

export default mongoose.models.tbl_prep_studentprogress || mongoose.model("tbl_prep_studentprogress", StudentProgressSchema);
