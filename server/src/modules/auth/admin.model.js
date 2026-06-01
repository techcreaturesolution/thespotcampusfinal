import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    admin_name: {
      type: String,
    },
    admin_email: {
      type: String,
    },
    admin_password: {
      type: String,
    },
    admin_image: {
      type: String,
    },
    admin_imagePublicID: {
      type: String,
    },
    role: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true },
);

AdminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.admin_password;
  return obj;
};

export default mongoose.model("tbl_admin", AdminSchema);
