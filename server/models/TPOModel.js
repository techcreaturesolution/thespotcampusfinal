import mongoose from "mongoose";
import { STATUS } from "../utils/constants.js";

const TPOSchema = new mongoose.Schema(
  {
    tpo_college_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_college",
    },
    tpo_name: String,
    tpo_email: String,
    tpo_contact: String,
    tpo_image: String,
    tpo_imagePublicID: String,
    tpo_status: {
      type: String,
      default: STATUS.ACTIVE,
    },
    tpo_password: String,
    role: {
      type: String,
      default: "TPO",
    },
  },
  { timestamps: true }
);

TPOSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.tpo_password;
  return obj;
};

export default mongoose.model("tbl_tpo", TPOSchema);
