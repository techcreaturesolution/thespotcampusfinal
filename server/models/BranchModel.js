import mongoose from "mongoose";

const BranchSchema = new mongoose.Schema(
  {
    degree_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_degree",
    },
    college_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_college",
    },
    branch_code: String,
    branch_name: String,
  },
  { timestamps: true }
);

export default mongoose.model("tbl_branch", BranchSchema);
