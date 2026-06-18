import mongoose from "mongoose";

const SubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    category: {
      type: String,
      enum: ["aptitude", "reasoning", "english", "programming", "technical", "general"],
      default: "technical",
    },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SubjectSchema.index({ name: 1 }, { unique: true });
SubjectSchema.index({ category: 1, is_active: 1 });

export default mongoose.models.tbl_prep_subject || mongoose.model("tbl_prep_subject", SubjectSchema);
