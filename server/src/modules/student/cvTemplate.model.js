import mongoose from "mongoose";

const CvTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    html_content: {
      type: String,
      required: true,
    },
    css_content: {
      type: String,
      required: false,
    },
    thumbnail: {
      type: String,
    }, // Cloudinary URL or fallback placeholder URL
  },
  { timestamps: true }
);

export default mongoose.models.tbl_cv_template || mongoose.model("tbl_cv_template", CvTemplateSchema);
