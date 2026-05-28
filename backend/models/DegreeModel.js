import mongoose from "mongoose";

const DegreeSchema = new mongoose.Schema(
  {
    college_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_college",
    },
    degree_name: String,
    degree_code: String,
    degree_sem: String,
  },
  { timestamps: true }
);

export default mongoose.model("tbl_degree", DegreeSchema);
