import mongoose from "mongoose";
import { STATUS } from "../../utils/constants.js";

const TPOSchema = new mongoose.Schema(
  {
    tpo_college_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tbl_college",
    },
    tpo_name: {
      type: String,
    },
    tpo_email: {
      type: String,
    },
    tpo_contact: {
      type: String,
    },
    tpo_image: {
      type: String,
    },
    tpo_imagePublicID: {
      type: String,
    },
    tpo_status: {
      type: String,
      default: STATUS.ACTIVE,
    },
    tpo_password: {
      type: String,
    },
    role: {
      type: String,
      default: "TPO",
    },
  },
  { timestamps: true },
);

TPOSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.tpo_password;
  return obj;
};

export default mongoose.model("tbl_tpo", TPOSchema);
