import mongoose from "mongoose";
import { STATUS } from "../../utils/constants.js";

const CollegeSchema = new mongoose.Schema(
  {
    college_university_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_university",
    },
    college_code: String,
    college_name: String,
    college_email: String,
    college_address: String,
    college_contact: String,
    college_website: String,
    college_logo: String,
    college_logoPublicID: String,
    college_status: {
      type: String,
      default: STATUS.ACTIVE,
    },
    college_password: String,
    role: {
      type: String,
      default: "College",
    },
  },
  { timestamps: true }
);

CollegeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.college_password;
  return obj;
};

export default mongoose.model("tbl_college", CollegeSchema);
