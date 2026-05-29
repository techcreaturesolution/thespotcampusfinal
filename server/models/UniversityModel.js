import mongoose from "mongoose";
import { STATUS } from "../utils/constants.js";

const UniversitySchema = new mongoose.Schema(
  {
    university_establishment: String,
    university_name: String,
    university_email: String,
    university_address: String,
    university_contact_no: String,
    university_website: String,
    university_logo: String,
    university_logoPublicID: String,
    university_status: {
      type: String,
      default: STATUS.ACTIVE,
    },
    university_password: String,
    role: {
      type: String,
      default: "University",
    },
  },
  { timestamps: true }
);

UniversitySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.university_password;
  return obj;
};

export default mongoose.model("tbl_university", UniversitySchema);
