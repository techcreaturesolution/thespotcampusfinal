import mongoose from "mongoose";
import { STATUS } from "../../utils/constants.js";

const CollegeSchema = new mongoose.Schema(
  {
    college_university_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_university",
    },
    college_code: {
      type: String,
    },
    college_name: {
      type: String,
    },
    college_email: {
      type: String,
    },
    college_address: {
      type: String,
    },
    college_contact: {
      type: String,
    },
    college_website: {
      type: String,
    },
    college_logo: {
      type: String,
    },
    college_logoPublicID: {
      type: String,
    },
    college_status: {
      type: String,
      default: STATUS.ACTIVE,
    },
    college_verified: {
      type: String,
      default: STATUS.DEACTIVE,
    },
    college_password: {
      type: String,
    },
    role: {
      type: String,
      default: "College",
    },
  },
  { timestamps: true },
);

CollegeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.college_password;
  return obj;
};

export default mongoose.model("tbl_college", CollegeSchema);
