import mongoose from "mongoose";

const TopicSchema = new mongoose.Schema(
  {
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "tbl_prep_subject", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
    total_questions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TopicSchema.index({ subject_id: 1, name: 1 }, { unique: true });
TopicSchema.index({ subject_id: 1, is_active: 1 });

export default mongoose.models.tbl_prep_topic || mongoose.model("tbl_prep_topic", TopicSchema);
