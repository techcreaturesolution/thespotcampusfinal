import mongoose from "mongoose";

const SubjectCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.tbl_prep_subject_category || mongoose.model("tbl_prep_subject_category", SubjectCategorySchema);
