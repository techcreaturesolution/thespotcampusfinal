import mongoose from "mongoose";

const DegreeSchema = new mongoose.Schema(
  {
    college_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_college",
    },
    degree_name: {
      type: String,
    },
    degree_code: {
      type: String,
    },
    degree_sem: {
      type: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model("tbl_degree", DegreeSchema);
