import mongoose from "mongoose";
import { STATUS } from "../utils/constants.js";

const CompanySchema = new mongoose.Schema(
  {
    company_name: String,
    company_email: String,
    company_address: String,
    company_contact: String,
    company_website: String,
    company_logo: String,
    company_logoPublicID: String,
    company_verified: {
      type: String,
      default: STATUS.DEACTIVE,
    },
    company_status: {
      type: String,
      default: STATUS.ACTIVE,
    },
    company_password: String,
    role: {
      type: String,
      default: "Company",
    },
  },
  { timestamps: true }
);

CompanySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.company_password;
  return obj;
};

export default mongoose.model("tbl_company", CompanySchema);
