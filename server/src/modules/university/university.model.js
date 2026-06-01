import mongoose from "mongoose";
import { STATUS } from "../../utils/constants.js";

const UniversitySchema = new mongoose.Schema(
  {
    university_establishment: {
      type: String,
    },
    university_name: {
      type: String,
    },
    university_email: {
      type: String,
    },
    university_address: {
      type: String,
    },
    university_contact_no: {
      type: String,
    },
    university_website: {
      type: String,
    },
    university_logo: {
      type: String,
    },
    university_logoPublicID: {
      type: String,
    },
    university_status: {
      type: String,
      default: STATUS.ACTIVE,
    },
    university_verified: {
      type: String,
      default: STATUS.DEACTIVE,
    },
    university_password: {
      type: String,
    },
    role: {
      type: String,
      default: "University",
    },
  },
  { timestamps: true },
);

UniversitySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.university_password;
  return obj;
};

export default mongoose.model("tbl_university", UniversitySchema);
