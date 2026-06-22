import mongoose from "mongoose";

const DailyChallengeSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
    },
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_prep_question",
    }],
    total_questions: {
      type: Number,
      default: 10,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

DailyChallengeSchema.index({ date: 1 }, {
  unique: true,
});

export default mongoose.models.tbl_prep_dailychallenge || mongoose.model("tbl_prep_dailychallenge", DailyChallengeSchema);
