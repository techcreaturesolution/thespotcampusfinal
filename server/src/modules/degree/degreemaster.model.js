import mongoose from "mongoose";

const BranchSubSchema = new mongoose.Schema({
  branch_name: { type: String, required: true },
  branch_code: { type: String, required: true },
});

const DegreeMasterSchema = new mongoose.Schema(
  {
    degree_name: { type: String, required: true },
    degree_code: { type: String, required: true },
    total_semesters: { type: Number, required: true },
    branches: { type: [BranchSubSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("tbl_degree_master", DegreeMasterSchema);
