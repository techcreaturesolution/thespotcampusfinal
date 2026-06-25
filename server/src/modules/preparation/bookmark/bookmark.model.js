import mongoose from "mongoose";

const BookmarkSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_student",
      required: true,
    },
    item_type: {
      type: String,
      enum: ["question", "mock_test", "pdf", "subject", "previous_year"],
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

BookmarkSchema.index({ student_id: 1, item_type: 1 });
BookmarkSchema.index({ student_id: 1, item_id: 1, notes: 1 }, {
  unique: true,
});

export default mongoose.models.tbl_prep_bookmark || mongoose.model("tbl_prep_bookmark", BookmarkSchema);
