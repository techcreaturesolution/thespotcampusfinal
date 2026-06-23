import mongoose from "mongoose";

const PdfMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["aptitude", "reasoning", "programming", "interview_preparation", "company_specific", "general"],
      required: true,
    },
    subject_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_prep_subject",
      default: null,
    },
    file_url: {
      type: String,
      required: true,
    },
    file_public_id: {
      type: String,
      default: "",
    },
    file_size_mb: {
      type: Number,
      default: 0,
    },
    total_pages: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
    }],
    is_active: {
      type: Boolean,
      default: true,
    },
    download_count: {
      type: Number,
      default: 0,
    },
    view_count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

PdfMaterialSchema.index({ category: 1, is_active: 1 });
PdfMaterialSchema.index({ subject_id: 1 });
PdfMaterialSchema.index({ tags: 1 });

export default mongoose.models.tbl_prep_pdfmaterial || mongoose.model("tbl_prep_pdfmaterial", PdfMaterialSchema);
