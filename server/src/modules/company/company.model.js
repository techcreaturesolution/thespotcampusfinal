import mongoose from "mongoose";
import { STATUS } from "../../utils/constants.js";

const CompanySchema = new mongoose.Schema(
  {
    company_name: {
      type: String,
    },
    company_email: {
      type: String,
    },
    company_address: {
      type: String,
    },
    company_contact: {
      type: String,
    },
    company_website: {
      type: String,
    },
    company_logo: {
      type: String,
    },
    company_logoPublicID: {
      type: String,
    },
    company_verified: {
      type: String,
      default: STATUS.DEACTIVE,
    },
    company_status: {
      type: String,
      default: STATUS.ACTIVE,
    },
    company_password: {
      type: String,
    },
    role: {
      type: String,
      default: "Company",
    },
  },
  { timestamps: true },
);

CompanySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.company_password;
  return obj;
};

export default mongoose.model("tbl_company", CompanySchema);
